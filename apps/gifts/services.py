"""محرّك تسعير الهدايا.

أبسط من airport_transfers/tours: لا شرائح pax ولا اتجاه. السعر يعتمد على
quantity فقط، وتُطبَّق نسبة ربح واحدة.
"""
from decimal import Decimal, ROUND_HALF_UP


class GiftPricingError(ValueError):
    def __init__(self, code: str, message: str):
        self.code = code
        super().__init__(message)


def quote_gift(gift, *, quantity: int = 1) -> dict:
    if quantity < 1:
        raise GiftPricingError('quantity_too_low', 'الكمية يجب أن تكون 1 على الأقل')

    unit       = Decimal(str(gift.base_price)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    base       = (unit * Decimal(quantity)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    margin_pct = gift.profit_margin_pct
    profit     = (base * (margin_pct / Decimal('100'))).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
    total      = (base + profit).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    return {
        'quantity':       quantity,
        'unit_price_myr': unit,
        'base_myr':       base,
        'margin_pct':     margin_pct,
        'profit_myr':     profit,
        'total_myr':      total,
        'currency':       'MYR',
    }
