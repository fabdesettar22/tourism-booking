from decimal import Decimal, ROUND_HALF_UP
from django.utils import timezone
from apps.pricing.models import Season, RoomPrice, ExchangeRate

# ────────────────────────────────────────────────────────────
# Currency conversion + 3-layer pricing
# ────────────────────────────────────────────────────────────

SUPPORTED_CURRENCIES = ['MYR', 'USD', 'EUR', 'SGD', 'AED', 'SAR', 'DZD']
MONEY_Q = Decimal('0.01')


def _money(amount: Decimal) -> Decimal:
    return amount.quantize(MONEY_Q, rounding=ROUND_HALF_UP)


def convert_currency(amount, from_curr: str, to_curr: str, on_date=None):
    """تحويل قيمة من عملة إلى أخرى عبر ExchangeRate."""
    if amount is None:
        return None
    if not isinstance(amount, Decimal):
        amount = Decimal(str(amount))
    if from_curr == to_curr:
        return _money(amount)
    rate = ExchangeRate.get_rate(from_curr, to_curr, on_date=on_date)
    if rate is None:
        inverse = ExchangeRate.get_rate(to_curr, from_curr, on_date=on_date)
        if inverse and inverse > 0:
            rate = Decimal('1') / inverse
    if rate is None:
        return None
    return _money(amount * rate)


def _resolve_cost(item):
    """يستخرج (cost, currency) من أي نموذج يحمل سعراً."""
    if hasattr(item, 'base_price') and hasattr(item, 'currency'):
        return (item.base_price, item.currency or 'MYR')
    if hasattr(item, 'price_per_night'):
        currency = getattr(item, 'currency', None) or 'MYR'
        return (item.price_per_night, currency)
    return (None, 'MYR')


def _resolve_hq_commission(item) -> Decimal:
    pct = getattr(item, 'commission_percentage', None)
    if pct:
        return Decimal(str(pct))
    try:
        from apps.settings_app.models import SiteSettings
        s = SiteSettings.get()
        return Decimal(str(getattr(s, 'default_hq_commission_pct', 0) or 0))
    except Exception:
        return Decimal('0')


def get_floor_price(item, display_currency: str = 'MYR', on_date=None) -> dict:
    """سعر الأرضية = تكلفة المورد + عمولة HQ، محوّل إلى display_currency."""
    cost, src_curr = _resolve_cost(item)
    if cost is None:
        return {
            'cost': None, 'currency_src': src_curr, 'hq_commission_pct': Decimal('0'),
            'hq_commission_amount': None, 'floor_src': None, 'floor_display': None,
            'currency_display': display_currency, 'fx_rate': None,
        }
    cost = Decimal(str(cost))
    pct = _resolve_hq_commission(item)
    hq_amount = _money(cost * pct / Decimal('100'))
    floor_src = _money(cost + hq_amount)
    floor_display = convert_currency(floor_src, src_curr, display_currency, on_date=on_date)
    rate = ExchangeRate.get_rate(src_curr, display_currency, on_date=on_date) if src_curr != display_currency else Decimal('1')
    return {
        'cost': _money(cost),
        'currency_src': src_curr,
        'hq_commission_pct': pct,
        'hq_commission_amount': hq_amount,
        'floor_src': floor_src,
        'floor_display': floor_display,
        'currency_display': display_currency,
        'fx_rate': rate,
    }


def get_sell_price(item, agency=None, display_currency: str = 'MYR', on_date=None) -> dict:
    """سعر البيع = الأرضية + agency.commission_rate."""
    floor = get_floor_price(item, display_currency=display_currency, on_date=on_date)
    if floor['floor_display'] is None:
        return {**floor, 'sell_display': None, 'agency_pct': None, 'agency_margin': None}
    agency_pct = Decimal('0')
    if agency is not None:
        agency_pct = Decimal(str(getattr(agency, 'commission_rate', 0) or 0))
    multiplier = Decimal('1') + agency_pct / Decimal('100')
    sell = _money(floor['floor_display'] * multiplier)
    margin = _money(sell - floor['floor_display'])
    return {**floor, 'agency_pct': agency_pct, 'sell_display': sell, 'agency_margin': margin}


def quote(item, agency=None, display_currency: str = 'MYR', is_hq: bool = False, on_date=None) -> dict:
    """Quote موحّد. HQ يرى التفصيل، الوكالة ترى floor+sell+margin، السائح يرى sell فقط."""
    full = get_sell_price(item, agency=agency, display_currency=display_currency, on_date=on_date)
    public = {'sell_price': full.get('sell_display'), 'currency': display_currency}
    if agency is not None and not is_hq:
        public.update({
            'floor_price': full.get('floor_display'),
            'agency_margin': full.get('agency_margin'),
            'agency_pct': full.get('agency_pct'),
        })
    if is_hq:
        return {**full, **public}
    return public


# ────────────────────────────────────────────────────────────
# Legacy helpers (preserved)
# ────────────────────────────────────────────────────────────


def get_current_season(hotel):
    """الموسم النشط الآن للفندق."""
    today = timezone.localdate()
    return Season.objects.filter(
        hotel=hotel,
        valid_from__lte=today,
        valid_to__gte=today
    ).first()


def get_best_room_price(hotel, room_type, date=None):
    """
    إرجاع أفضل RoomPrice لفندق ونوع غرفة في تاريخ معين.
    يعيد None إذا لم يجد موسماً نشطاً.
    """
    from django.db.models import Q
    from apps.pricing.models import Season
    import datetime

    if date is None:
        date = timezone.localdate()

    season = Season.objects.filter(
        hotel=hotel,
        valid_from__lte=date,
        valid_to__gte=date
    ).first()

    if not season:
        return None

    return RoomPrice.objects.filter(
        season=season,
        room_type=room_type
    ).first()


def calculate_room_cost(room_price: RoomPrice, nights: int, rooms: int = 1) -> Decimal:
    """حساب تكلفة غرفة لعدد ليالٍ وغرف."""
    base = room_price.price_per_night
    if room_price.discount_percentage:
        discount = room_price.discount_percentage / Decimal('100')
        base = base * (Decimal('1') - discount)
    total = base * nights * rooms
    return total.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
