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


# ════════════════════════════════════════════════════════════
# Tourism Booking — Component Calculators (MYR → EUR + USD)
# ────────────────────────────────────────────────────────────
# الحاسبات المركزية للحجوزات. كل دالة:
#   - تأخذ مكوّناً (Tour, Transfer, Gift, RoomPrice…)
#   - تأخذ تكوين المجموعة (adults, children, infants, ...)
#   - ترجع dict موحّد: {cost_myr, commission_myr, total_myr, totals_dual_currency}
#
# مبدأ: التكاليف بالـ MYR، العرض النهائي بـ EUR + USD.
# الرضع (infants) لا يُحتسبون في تسعير المقاعد/الجولات.
# ════════════════════════════════════════════════════════════

# ── شرائح pax المعتمدة في الكتالوج (مرتبة تصاعدياً) ──
# لكل شريحة: (الحد الأقصى للأفراد، اسم حقل السعر، اسم حقل الـ margin)
PAX_TIERS = [
    (2,  'price_pax_1_2',    'margin_pct_1_2'),
    (4,  'price_pax_3_4',    'margin_pct_3_4'),
    (6,  'price_pax_5_6',    'margin_pct_5_6'),
    (8,  'price_pax_7_8',    'margin_pct_7_8'),
    (12, 'price_pax_10_12',  'margin_pct_10_12'),
    (14, 'price_pax_14',     'margin_pct_14'),
    (40, 'price_pax_40_bus', 'margin_pct_40_bus'),
]


def _select_pax_tier(item, pax_total: int):
    """يختار أول شريحة تستوعب pax_total ولها سعر مُدخَل.

    يرجع (tier_label, base_price_myr, margin_pct) أو يرفع ValueError.
    """
    if pax_total <= 0:
        raise ValueError("pax_total must be > 0")
    for cap, price_attr, margin_attr in PAX_TIERS:
        if pax_total > cap:
            continue
        price = getattr(item, price_attr, None)
        if price is not None:
            return (price_attr, Decimal(str(price)), Decimal(str(getattr(item, margin_attr) or 0)))
    # fallback: أكبر شريحة متاحة (لمجموعات كبيرة جداً)
    for cap, price_attr, margin_attr in reversed(PAX_TIERS):
        price = getattr(item, price_attr, None)
        if price is not None:
            return (price_attr, Decimal(str(price)), Decimal(str(getattr(item, margin_attr) or 0)))
    raise ValueError(f"No tier price configured on {item}")


def to_dual_currency(amount_myr, on_date=None) -> dict:
    """تحويل قيمة MYR إلى EUR + USD معاً (نمط العرض الموحّد للوكالة)."""
    if amount_myr is None:
        return {'myr': None, 'eur': None, 'usd': None}
    if not isinstance(amount_myr, Decimal):
        amount_myr = Decimal(str(amount_myr))
    return {
        'myr': _money(amount_myr),
        'eur': convert_currency(amount_myr, 'MYR', 'EUR', on_date=on_date),
        'usd': convert_currency(amount_myr, 'MYR', 'USD', on_date=on_date),
    }


def _apply_commission(cost_myr: Decimal, pct: Decimal) -> dict:
    """يطبق نسبة عمولة على تكلفة ويرجع التفصيل."""
    commission = _money(cost_myr * pct / Decimal('100'))
    total = _money(cost_myr + commission)
    return {
        'cost_myr':       _money(cost_myr),
        'commission_pct': pct,
        'commission_myr': commission,
        'total_myr':      total,
    }


# ────────────────────────────────────────────────────────────
# Tour calculator
# ────────────────────────────────────────────────────────────

def quote_tour_for_group(
    tour, adults: int, children: int, infants: int = 0,
    direction: str = 'one_way',
    include_guide: bool = False,
    on_date=None,
) -> dict:
    """يحسب سعر جولة لمجموعة كاملة.

    - يجمع adults + children كأفراد محتسبين (الرضع مجاناً)
    - يختار شريحة pax المناسبة من جدول tours_excursions.Tour
    - يطبق margin_pct للشريحة
    - direction='round_trip' يضاعف السعر
    - include_guide يضيف tour_guide_fee + commission

    Args:
        tour: instance من apps.tours_excursions.models.Tour
        adults, children, infants: عدد كل فئة
        direction: 'one_way' أو 'round_trip'
        include_guide: هل يُضاف رسم المرشد؟

    Returns:
        dict مع breakdown + totals_myr + totals (EUR/USD)
    """
    pax_total = (adults or 0) + (children or 0)
    if pax_total == 0:
        raise ValueError("Tour requires at least 1 adult or child")

    tier_label, base_price, margin_pct = _select_pax_tier(tour, pax_total)

    # المضاعف للذهاب-عودة
    direction_multiplier = Decimal('2') if direction == 'round_trip' else Decimal('1')
    tier_cost = _money(base_price * direction_multiplier)
    tier_breakdown = _apply_commission(tier_cost, margin_pct)

    # رسم المرشد (اختياري)
    guide_breakdown = None
    if include_guide and tour.tour_guide_fee_myr:
        guide_cost = Decimal(str(tour.tour_guide_fee_myr)) * direction_multiplier
        guide_pct = Decimal(str(tour.tour_guide_margin_pct or 0))
        guide_breakdown = _apply_commission(guide_cost, guide_pct)

    # تجميع
    cost_myr = tier_breakdown['cost_myr'] + (guide_breakdown['cost_myr'] if guide_breakdown else Decimal('0'))
    comm_myr = tier_breakdown['commission_myr'] + (guide_breakdown['commission_myr'] if guide_breakdown else Decimal('0'))
    total_myr = tier_breakdown['total_myr'] + (guide_breakdown['total_myr'] if guide_breakdown else Decimal('0'))

    return {
        'component_type': 'tour',
        'component_id': getattr(tour, 'pk', None) or getattr(getattr(tour, 'service', None), 'pk', None),
        'pax_total': pax_total,
        'adults': adults,
        'children': children,
        'infants': infants,
        'tier_used': tier_label,
        'direction': direction,
        'tier_breakdown': tier_breakdown,
        'guide_breakdown': guide_breakdown,
        'cost_myr':       _money(cost_myr),
        'commission_myr': _money(comm_myr),
        'total_myr':      _money(total_myr),
        'totals':         to_dual_currency(total_myr, on_date=on_date),
    }


# ────────────────────────────────────────────────────────────
# Airport transfer calculator
# ────────────────────────────────────────────────────────────

def quote_airport_transfer_for_group(
    transfer, adults: int, children: int, infants: int = 0,
    direction: str = 'to_hotel',
    include_guide: bool = False,
    on_date=None,
) -> dict:
    """يحسب سعر النقل من/إلى المطار لمجموعة.

    - يجمع adults + children + infants كأفراد (في النقل، حتى الرضيع يحتاج مقعد عادةً)
    - يختار شريحة pax بنفس منطق الجولة
    - direction: 'to_hotel' / 'to_airport' / 'round_trip' (الأخيرة = ضعف)
    - include_guide يضيف رسم المرشد
    """
    pax_total = (adults or 0) + (children or 0) + (infants or 0)
    if pax_total == 0:
        raise ValueError("Transfer requires at least 1 person")

    tier_label, base_price, margin_pct = _select_pax_tier(transfer, pax_total)

    direction_multiplier = Decimal('2') if direction == 'round_trip' else Decimal('1')
    tier_cost = _money(base_price * direction_multiplier)
    tier_breakdown = _apply_commission(tier_cost, margin_pct)

    guide_breakdown = None
    if include_guide and transfer.tour_guide_fee_myr:
        guide_cost = Decimal(str(transfer.tour_guide_fee_myr)) * direction_multiplier
        guide_pct = Decimal(str(transfer.tour_guide_margin_pct or 0))
        guide_breakdown = _apply_commission(guide_cost, guide_pct)

    cost_myr = tier_breakdown['cost_myr'] + (guide_breakdown['cost_myr'] if guide_breakdown else Decimal('0'))
    comm_myr = tier_breakdown['commission_myr'] + (guide_breakdown['commission_myr'] if guide_breakdown else Decimal('0'))
    total_myr = tier_breakdown['total_myr'] + (guide_breakdown['total_myr'] if guide_breakdown else Decimal('0'))

    return {
        'component_type': 'airport_transfer',
        'component_id': getattr(transfer, 'pk', None) or getattr(getattr(transfer, 'service', None), 'pk', None),
        'pax_total': pax_total,
        'tier_used': tier_label,
        'direction': direction,
        'tier_breakdown': tier_breakdown,
        'guide_breakdown': guide_breakdown,
        'cost_myr':       _money(cost_myr),
        'commission_myr': _money(comm_myr),
        'total_myr':      _money(total_myr),
        'totals':         to_dual_currency(total_myr, on_date=on_date),
    }


# ────────────────────────────────────────────────────────────
# Gift calculator
# ────────────────────────────────────────────────────────────

def quote_gift_for_group(
    gift, adults: int, children: int, infants: int = 0,
    on_date=None,
) -> dict:
    """يحسب سعر الهدية للمجموعة.

    الهدية تُعطى لكل بالغ + كل طفل (ليس للرضع).
    base_price × profit_margin_pct على الواحد، ثم × عدد الأفراد.
    """
    countable = (adults or 0) + (children or 0)
    if countable == 0:
        raise ValueError("Gift requires at least 1 adult or child")

    unit_cost = Decimal(str(gift.base_price))
    margin_pct = Decimal(str(gift.profit_margin_pct or 0))
    total_cost = _money(unit_cost * countable)
    breakdown = _apply_commission(total_cost, margin_pct)

    return {
        'component_type': 'gift',
        'component_id': getattr(gift, 'pk', None) or getattr(getattr(gift, 'service', None), 'pk', None),
        'unit_cost_myr': _money(unit_cost),
        'unit_count':    countable,
        'cost_myr':       breakdown['cost_myr'],
        'commission_pct': breakdown['commission_pct'],
        'commission_myr': breakdown['commission_myr'],
        'total_myr':      breakdown['total_myr'],
        'totals':         to_dual_currency(breakdown['total_myr'], on_date=on_date),
    }


# ────────────────────────────────────────────────────────────
# Hotel room stay calculator
# ────────────────────────────────────────────────────────────

def quote_room_stay(
    hotel, room_type, nights: int, rooms_count: int = 1,
    extra_beds_adult: int = 0, extra_beds_child: int = 0,
    children_with_bed: int = 0, children_without_bed: int = 0,
    infants_with_bed: int = 0, infants_without_bed: int = 0,
    check_in_date=None, on_date=None,
) -> dict:
    """يحسب تكلفة إقامة فندقية كاملة لـ "غرفة" واحدة.

    يستخدم RoomPrice (الموسم النشط) ويضيف:
      - السعر الأساسي = price_per_night × nights × rooms_count
      - إضافة أسرّة الأطفال/الرضع حسب نوع السرير (with/without bed)
      - الخصم إن وُجد

    ثم يطبق Hotel.commission_percentage كنسبة عمولة HQ.
    """
    rp = get_best_room_price(hotel, room_type, date=check_in_date)
    if rp is None:
        raise ValueError(f"لا يوجد تسعير نشط لهذا الفندق/الغرفة في التاريخ المطلوب: {hotel} / {room_type}")

    # السعر الأساسي للغرفة (يتضمن خصم RoomPrice إن وُجد)
    base_per_night = Decimal(str(rp.price_per_night))
    if rp.discount_percentage:
        discount = Decimal(str(rp.discount_percentage)) / Decimal('100')
        base_per_night = base_per_night * (Decimal('1') - discount)

    rooms_cost = _money(base_per_night * nights * rooms_count)

    # إضافات الأطفال/الرضع
    extras_cost = Decimal('0')

    def _add(price_field, count):
        nonlocal extras_cost
        price = getattr(rp, price_field, None)
        if price and count:
            extras_cost += Decimal(str(price)) * count * nights

    _add('child_with_bed_price',     children_with_bed)
    _add('child_without_bed_price',  children_without_bed)
    _add('infant_with_bed_price',    infants_with_bed)
    _add('infant_without_bed_price', infants_without_bed)
    extras_cost = _money(extras_cost)

    cost_myr = _money(rooms_cost + extras_cost)
    hq_pct = Decimal(str(getattr(hotel, 'commission_percentage', 0) or 0))
    breakdown = _apply_commission(cost_myr, hq_pct)

    return {
        'component_type': 'hotel_room',
        'component_id': hotel.pk,
        'hotel_id': hotel.pk,
        'room_type_id': room_type.pk,
        'nights': nights,
        'rooms_count': rooms_count,
        'price_per_night_myr': _money(base_per_night),
        'rooms_cost_myr': rooms_cost,
        'extras_cost_myr': extras_cost,
        'cost_myr':       breakdown['cost_myr'],
        'commission_pct': breakdown['commission_pct'],
        'commission_myr': breakdown['commission_myr'],
        'total_myr':      breakdown['total_myr'],
        'totals':         to_dual_currency(breakdown['total_myr'], on_date=on_date),
    }


# ────────────────────────────────────────────────────────────
# Booking aggregator (الحاسبة المركزية)
# ────────────────────────────────────────────────────────────

def aggregate_quotes(line_quotes: list, on_date=None) -> dict:
    """يجمع قائمة من نتائج quote_*  ويرجع total شامل + per-person."""
    cost_myr = sum((q['cost_myr'] for q in line_quotes), Decimal('0'))
    comm_myr = sum((q['commission_myr'] for q in line_quotes), Decimal('0'))
    total_myr = sum((q['total_myr'] for q in line_quotes), Decimal('0'))
    return {
        'lines': line_quotes,
        'totals_breakdown': {
            'cost_myr':       _money(cost_myr),
            'commission_myr': _money(comm_myr),
            'total_myr':      _money(total_myr),
        },
        'totals': to_dual_currency(total_myr, on_date=on_date),
    }


def per_person_split(totals_dual: dict, persons_count: int) -> dict:
    """قسمة المجموع على عدد الأفراد (للعرض فقط)."""
    if persons_count <= 0:
        return {'myr': None, 'eur': None, 'usd': None}
    out = {}
    for k, v in totals_dual.items():
        out[k] = _money(v / persons_count) if v is not None else None
    return out
