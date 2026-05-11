"""محرّك تسعير الجولات السياحية والرحلات النهارية.

نفس منطق `airport_transfers.services` مع اختلاف بسيط: الـ duration يحدد ما
إذا كان الـ multiplier للذهاب والعودة مسموحاً به (لا يُسمح في full_day لأنه
يوم كامل ذهاب وعودة بطبيعته).
"""
from decimal import Decimal, ROUND_HALF_UP


PAX_BUCKETS = [
    (2,  '1_2'),
    (4,  '3_4'),
    (6,  '5_6'),
    (8,  '7_8'),
    (12, '10_12'),
    (14, '14'),
    (40, '40_bus'),
]

DIRECTION_ONE_WAY    = 'one_way'
DIRECTION_ROUND_TRIP = 'round_trip'
VALID_DIRECTIONS = {DIRECTION_ONE_WAY, DIRECTION_ROUND_TRIP}


class TourPricingError(ValueError):
    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)


def resolve_bucket(pax: int) -> str:
    if pax < 1:
        raise TourPricingError('pax_too_low', 'عدد الأفراد يجب أن يكون 1 على الأقل')
    for ceiling, key in PAX_BUCKETS:
        if pax <= ceiling:
            return key
    raise TourPricingError('pax_too_high', 'الحد الأقصى المدعوم 40 شخصاً (حافلة كاملة)')


def quote_tour(
    tour,
    *,
    pax: int,
    direction: str = DIRECTION_ONE_WAY,
    include_tour_guide: bool = False,
) -> dict:
    """يحسب السعر النهائي لجولة محددة.

    direction:
      - one_way    → ضرب 1 (للجولات النهارية بطبيعتها أو نقل اتجاه واحد)
      - round_trip → ضرب 2 (يُسمح فقط للنقل بين المدن أو الجزر؛ لا يُسمح للجولات
                              الكاملة لأنها تتضمن العودة بطبيعتها — يُرفض)

    Returns dict مع التفصيل الكامل + currency='MYR'.
    """
    if direction not in VALID_DIRECTIONS:
        raise TourPricingError(
            'invalid_direction',
            f"الاتجاه غير معروف: {direction}",
        )

    # رفض ذهاب وعودة للجولات اليومية — لأن السعر بالفعل ليوم كامل
    if direction == DIRECTION_ROUND_TRIP and tour.duration in {'full_day', 'half_day'}:
        raise TourPricingError(
            'round_trip_not_applicable',
            'الجولة بطبيعتها يوم كامل — لا يُطبَّق ذهاب وعودة',
        )

    bucket = resolve_bucket(pax)
    base_one_way = getattr(tour, f'price_pax_{bucket}', None)
    if base_one_way is None:
        raise TourPricingError(
            'not_available_for_pax',
            f"لا يوجد سعر منشور لهذه الشريحة ({bucket}) لهذه الجولة",
        )

    margin_pct = getattr(tour, f'margin_pct_{bucket}', Decimal('15'))
    multiplier = Decimal('2') if direction == DIRECTION_ROUND_TRIP else Decimal('1')

    base_myr   = (base_one_way * multiplier).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    profit_myr = (base_myr * (margin_pct / Decimal('100'))).quantize(
        Decimal('0.01'), rounding=ROUND_HALF_UP,
    )

    # ── رسم المرشد + هامش ربحه (حقل مخصص) ────────────────
    guide_myr           = Decimal('0')
    guide_profit_myr    = Decimal('0')
    guide_margin_pct    = getattr(tour, 'tour_guide_margin_pct', None) or Decimal('15')
    if include_tour_guide and tour.tour_guide_fee_myr:
        guide_myr = tour.tour_guide_fee_myr.quantize(
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
