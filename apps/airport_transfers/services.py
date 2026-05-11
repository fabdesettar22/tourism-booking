"""محرّك تسعير خدمات النقل من/إلى المطار.

يُحوِّل عدد الأفراد إلى شريحة سعرية، يضرب في مضاعف الاتجاه (1 أو 2)،
يضيف نسبة الربح، ثم رسم المرشد السياحي إن طُلب — والنتيجة سعر بـ MYR.
"""
from decimal import Decimal, ROUND_HALF_UP


# الشرائح: (السقف، اسم الحقل في AirportTransfer)
# ملاحظة: pax > 14 لا يُغطّى إلا بشريحة 40 (Full Bus). نتجاهل الشريحة 14
# لأنها تساوي 14 بالضبط (لا يدخل ضمنها 13 — يدخل في 12).
PAX_BUCKETS = [
    (2,  '1_2'),
    (4,  '3_4'),
    (6,  '5_6'),
    (8,  '7_8'),
    (12, '10_12'),
    (14, '14'),
    (40, '40_bus'),
]

DIRECTION_TO_HOTEL   = 'to_hotel'
DIRECTION_TO_AIRPORT = 'to_airport'
DIRECTION_ROUND_TRIP = 'round_trip'
VALID_DIRECTIONS = {DIRECTION_TO_HOTEL, DIRECTION_TO_AIRPORT, DIRECTION_ROUND_TRIP}


class PricingError(ValueError):
    """خطأ في حساب السعر — يُترجم إلى 400 في الـ API."""
    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)


def resolve_bucket(pax: int) -> str:
    """يُرجع اسم شريحة الحقل المناسبة لعدد الأفراد المُعطى.

    >>> resolve_bucket(1) → '1_2'
    >>> resolve_bucket(4) → '3_4'
    >>> resolve_bucket(13) → '14'
    >>> resolve_bucket(15) → '40_bus'
    >>> resolve_bucket(40) → '40_bus'
    >>> resolve_bucket(41) → PricingError
    """
    if pax < 1:
        raise PricingError('pax_too_low', 'عدد الأفراد يجب أن يكون 1 على الأقل')
    for ceiling, key in PAX_BUCKETS:
        if pax <= ceiling:
            return key
    raise PricingError('pax_too_high', 'الحد الأقصى المدعوم 40 شخصاً (حافلة كاملة)')


def quote_airport_transfer(
    transfer,
    *,
    pax: int,
    direction: str,
    include_tour_guide: bool = False,
) -> dict:
    """يحسب السعر النهائي لخدمة نقل من/إلى مطار.

    Returns:
        dict مع المفاتيح:
        {
          bucket:                 'X_Y',
          base_one_way_myr:       Decimal,    # سعر اتجاه واحد قبل الربح
          direction:              str,
          direction_multiplier:   1 | 2,
          base_myr:               Decimal,    # base_one_way × multiplier
          margin_pct:             Decimal,
          profit_myr:             Decimal,
          tour_guide_myr:         Decimal,    # 0 إن لم يُطلب
          total_myr:              Decimal,    # الإجمالي النهائي
          currency:               'MYR',
        }

    Raises:
        PricingError: لو الاتجاه غير معروف، أو السعر null لهذه الشريحة.
    """
    if direction not in VALID_DIRECTIONS:
        raise PricingError(
            'invalid_direction',
            f"الاتجاه غير معروف: {direction}. القيم المسموحة: {sorted(VALID_DIRECTIONS)}",
        )

    bucket = resolve_bucket(pax)
    base_one_way = getattr(transfer, f'price_pax_{bucket}', None)
    if base_one_way is None:
        raise PricingError(
            'not_available_for_pax',
            f"لا يوجد سعر منشور لهذه الشريحة ({bucket}) لخدمة النقل المطلوبة",
        )

    margin_pct = getattr(transfer, f'margin_pct_{bucket}', Decimal('10'))
    multiplier = Decimal('2') if direction == DIRECTION_ROUND_TRIP else Decimal('1')

    base_myr   = (base_one_way * multiplier).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    profit_myr = (base_myr * (margin_pct / Decimal('100'))).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP,
    )

    # ── رسم المرشد + هامش ربحه (حقل مخصص) ────────────────
    guide_myr           = Decimal('0')
    guide_profit_myr    = Decimal('0')
    guide_margin_pct    = getattr(transfer, 'tour_guide_margin_pct', None) or Decimal('10')
    if include_tour_guide and transfer.tour_guide_fee_myr:
        guide_myr = transfer.tour_guide_fee_myr.quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP,
        )
        guide_profit_myr = (guide_myr * (guide_margin_pct / Decimal('100'))).quantize(
            Decimal('0.01'), rounding=ROUND_HALF_UP,
        )

    total_myr = (base_myr + profit_myr + guide_myr + guide_profit_myr).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP,
    )

    return {
        'bucket':               bucket,
        'base_one_way_myr':     base_one_way,
        'direction':            direction,
        'direction_multiplier': int(multiplier),
        'base_myr':             base_myr,
        'margin_pct':           margin_pct,
        'profit_myr':           profit_myr,
        'tour_guide_myr':       guide_myr,
        'guide_margin_pct':     guide_margin_pct,
        'guide_profit_myr':     guide_profit_myr,
        'total_myr':            total_myr,
        'currency':             'MYR',
    }
