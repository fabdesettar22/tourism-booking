"""محرك تسعير إقامات الفنادق — البنية الجديدة (PricingTierDef + HotelGuestPricing).

يحسب التكلفة الكاملة لإقامة فندق آخذاً في الاعتبار:
- السعر الأساسي للغرفة × عدد الغرف × عدد الليالي
- التمييز بين Weekday/Weekend والمواسم لكل ليلة
- مصفوفة أسعار الضيوف على مستوى الفندق (HotelGuestPricing) لكل طبقة:
  · سرير إضافي · رضيع · طفل بسرير · طفل بدون سرير · فطور أطفال
- الضريبة = Hotel.tax_per_night_per_room × عدد الغرف × عدد الليالي
- هامش الربح من PricingTierDef.profit_margin_pct (لكل طبقة)
- الـ surcharges المرتبطة بأيام أسبوع أو نطاقات تاريخية
"""
from datetime import date, timedelta
from decimal import Decimal, ROUND_HALF_UP

from django.db.models import Q

from .models import (
    HotelGuestPricing,
    HotelSurcharge,
    PricingTierDef,
    RoomRate,
    SURCHARGE_TYPE_PERCENTAGE,
)


class HotelQuoteError(ValueError):
    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)


def _q(v) -> Decimal:
    return Decimal(str(v)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)


def _D(v) -> Decimal:
    if v is None:
        return Decimal('0')
    return Decimal(str(v))


def _resolve_rate_for_date(category, *, on_date: date, pricing_tier: str, occupancy: str = 'double') -> RoomRate:
    """يجد السعر المناسب لتاريخ معين (موسم + day_type + tier)."""
    is_weekend = on_date.weekday() in (4, 5)
    day_type_pref = 'weekend' if is_weekend else 'weekday'

    # 1. Seasonal
    seasonal_rates = RoomRate.objects.filter(
        room_category=category,
        pricing_tier=pricing_tier,
        occupancy=occupancy,
        season__isnull=False,
        season__date_ranges__start_date__lte=on_date,
        season__date_ranges__end_date__gte=on_date,
        is_active=True,
    ).distinct()
    rate = seasonal_rates.filter(day_type=day_type_pref).first()
    if not rate:
        rate = seasonal_rates.filter(day_type='all').first()
    if rate:
        return rate

    # 2. Flat (season=NULL)
    flat_rates = RoomRate.objects.filter(
        room_category=category,
        pricing_tier=pricing_tier,
        occupancy=occupancy,
        season__isnull=True,
        is_active=True,
    )
    rate = flat_rates.filter(day_type=day_type_pref).first()
    if not rate:
        rate = flat_rates.filter(day_type='all').first()
    if rate:
        return rate

    # 3. Last resort
    rate = RoomRate.objects.filter(
        room_category=category, pricing_tier=pricing_tier, is_active=True,
    ).first()
    if rate:
        return rate

    raise HotelQuoteError('rate_not_found', f'لا يوجد سعر لهذه الفئة في {on_date} (طبقة {pricing_tier})')


def _applicable_surcharges(hotel, *, on_date: date, pricing_tier: str, room_category=None) -> list:
    qs = HotelSurcharge.objects.filter(hotel=hotel, is_active=True)
    if room_category:
        qs = qs.filter(Q(room_category__isnull=True) | Q(room_category=room_category))
    qs = qs.filter(Q(applies_to_tier='') | Q(applies_to_tier=pricing_tier))
    qs = qs.filter(Q(weekday=on_date.weekday()) | Q(date_start__lte=on_date, date_end__gte=on_date))
    return list(qs)


def quote_hotel_stay(
    *,
    room_category,
    check_in: date,
    check_out: date,
    pricing_tier: str = 'FIT',
    occupancy: str = 'double',
    number_of_rooms: int = 1,
    adults: int = 2,
    children_with_bed: int = 0,
    children_without_bed: int = 0,
    infants: int = 0,
    extra_beds: int = 0,
    apply_markup: bool = True,
    apply_tax: bool = True,
) -> dict:
    """يحسب التسعيرة الكاملة لإقامة فندق بالبنية الجديدة.

    - اسم الطبقة (pricing_tier) يطابق PricingTierDef.name
    - أسعار الضيوف الإضافيين تأتي من HotelGuestPricing (مرة واحدة لكل طبقة)
    - الضريبة من Hotel.tax_per_night_per_room × عدد الغرف × عدد الليالي
    - هامش الربح من PricingTierDef.profit_margin_pct
    """
    if check_out <= check_in:
        raise HotelQuoteError('invalid_dates', 'تاريخ الخروج يجب أن يكون بعد تاريخ الدخول')
    if number_of_rooms < 1:
        raise HotelQuoteError('rooms_too_low', 'عدد الغرف يجب أن يكون 1 على الأقل')
    if adults < 1:
        raise HotelQuoteError('adults_too_low', 'عدد البالغين يجب أن يكون 1 على الأقل')

    nights_count = (check_out - check_in).days
    hotel = room_category.hotel

    # 1. Pricing tier definition (for margin)
    tier_def = PricingTierDef.objects.filter(hotel=hotel, name=pricing_tier, is_active=True).first()

    # 2. Hotel guest pricing for this tier
    guest_pricing = None
    if tier_def:
        guest_pricing = HotelGuestPricing.objects.filter(hotel=hotel, tier=tier_def).first()

    if guest_pricing:
        gp_extra_bed   = _D(guest_pricing.extra_bed_price)
        gp_infant      = _D(guest_pricing.infant_price)
        gp_child_w_bed = _D(guest_pricing.child_with_bed_price)
        gp_child_no_b  = _D(guest_pricing.child_no_bed_price)
        gp_child_bf    = _D(guest_pricing.child_breakfast_price)
    else:
        gp_extra_bed = gp_infant = gp_child_w_bed = gp_child_no_b = gp_child_bf = Decimal('0')

    rooms_total = Decimal('0')
    extra_beds_total = Decimal('0')
    children_with_bed_total = Decimal('0')
    children_without_bed_total = Decimal('0')
    infants_total = Decimal('0')
    child_breakfast_total = Decimal('0')
    surcharges_total = Decimal('0')
    lines = []

    sample_rate = None

    for i in range(nights_count):
        day = check_in + timedelta(days=i)
        rate = _resolve_rate_for_date(room_category, on_date=day, pricing_tier=pricing_tier, occupancy=occupancy)
        sample_rate = rate

        # Room cost: base × rooms
        night_room_cost = _D(rate.base_rate) * number_of_rooms
        rooms_total += night_room_cost

        # Guest costs: per-person counts (independent of room count)
        extra_bed_cost = gp_extra_bed * extra_beds
        infant_cost    = gp_infant * infants
        cwb_cost       = gp_child_w_bed * children_with_bed
        cnb_cost       = gp_child_no_b * children_without_bed
        bf_cost        = gp_child_bf * (children_with_bed + children_without_bed)
        extra_beds_total += extra_bed_cost
        infants_total += infant_cost
        children_with_bed_total += cwb_cost
        children_without_bed_total += cnb_cost
        child_breakfast_total += bf_cost

        # Surcharges
        surcharges = _applicable_surcharges(hotel, on_date=day, pricing_tier=pricing_tier, room_category=room_category)
        night_surcharge = Decimal('0')
        surcharge_details = []
        for s in surcharges:
            if s.surcharge_type == SURCHARGE_TYPE_PERCENTAGE:
                amt = (night_room_cost * _D(s.amount) / Decimal('100'))
            else:
                amt = _D(s.amount) * number_of_rooms
            night_surcharge += amt
            surcharge_details.append({'name': s.name, 'amount': str(_q(amt)), 'type': s.surcharge_type})
        surcharges_total += night_surcharge

        line_total = night_room_cost + extra_bed_cost + infant_cost + cwb_cost + cnb_cost + bf_cost + night_surcharge
        lines.append({
            'date': str(day),
            'weekday': day.weekday(),
            'weekday_label': ['الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد'][day.weekday()],
            'day_type': rate.day_type,
            'season': rate.season.name if rate.season else None,
            'rooms_count': number_of_rooms,
            'base_rate_per_room':       str(_q(_D(rate.base_rate))),
            'rooms_amount':             str(_q(night_room_cost)),
            'extra_beds_amount':        str(_q(extra_bed_cost)),
            'infant_amount':            str(_q(infant_cost)),
            'child_with_bed_amount':    str(_q(cwb_cost)),
            'child_without_bed_amount': str(_q(cnb_cost)),
            'child_breakfast_amount':   str(_q(bf_cost)),
            'surcharges_amount':        str(_q(night_surcharge)),
            'surcharges_detail':        surcharge_details,
            'night_total':              str(_q(line_total)),
        })

    subtotal = (
        rooms_total + extra_beds_total + infants_total
        + children_with_bed_total + children_without_bed_total
        + child_breakfast_total + surcharges_total
    )

    # 3. Margin: prefer per-tier (PricingTierDef.profit_margin_pct), fallback to RoomRate.markup_pct
    if apply_markup:
        if tier_def:
            margin_pct = _D(tier_def.profit_margin_pct)
        elif sample_rate:
            margin_pct = _D(sample_rate.markup_pct)
        else:
            margin_pct = Decimal('0')
    else:
        margin_pct = Decimal('0')
    markup_amount = subtotal * margin_pct / Decimal('100')
    after_markup = subtotal + markup_amount

    # 4. Tax = Hotel.tax_per_night_per_room × rooms × nights
    tax_per_unit = _D(getattr(hotel, 'tax_per_night_per_room', None))
    tax_total = (tax_per_unit * number_of_rooms * nights_count) if apply_tax else Decimal('0')

    grand_total = after_markup + tax_total

    return {
        'nights': nights_count,
        'currency': sample_rate.currency if sample_rate else 'MYR',
        'pricing_tier': pricing_tier,
        'occupancy': occupancy,
        'guests': {
            'adults': adults,
            'children_with_bed': children_with_bed,
            'children_without_bed': children_without_bed,
            'infants': infants,
            'extra_beds': extra_beds,
            'rooms': number_of_rooms,
        },
        'check_in': str(check_in),
        'check_out': str(check_out),
        'lines': lines,
        'totals': {
            'rooms_total':                str(_q(rooms_total)),
            'extra_beds_total':           str(_q(extra_beds_total)),
            'infants_total':              str(_q(infants_total)),
            'children_with_bed_total':    str(_q(children_with_bed_total)),
            'children_without_bed_total': str(_q(children_without_bed_total)),
            'child_breakfast_total':      str(_q(child_breakfast_total)),
            'surcharges_total':           str(_q(surcharges_total)),
            'subtotal':                   str(_q(subtotal)),
            'margin_pct':                 str(margin_pct),
            'markup_amount':              str(_q(markup_amount)),
            'tax_per_unit':               str(_q(tax_per_unit)),
            'tax_total':                  str(_q(tax_total)),
            'grand_total':                str(_q(grand_total)),
        },
    }
