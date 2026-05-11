"""اختبارات محرّك تسعير النقل من/إلى المطار."""
from decimal import Decimal
import pytest

from apps.airport_transfers.services import (
    resolve_bucket,
    quote_airport_transfer,
    PricingError,
    DIRECTION_TO_HOTEL,
    DIRECTION_TO_AIRPORT,
    DIRECTION_ROUND_TRIP,
)


# ── resolve_bucket — حدود الشرائح ───────────────────────

@pytest.mark.parametrize('pax,expected', [
    (1,  '1_2'),
    (2,  '1_2'),
    (3,  '3_4'),
    (4,  '3_4'),
    (5,  '5_6'),
    (8,  '7_8'),
    (9,  '10_12'),
    (12, '10_12'),
    (13, '14'),
    (14, '14'),
    (15, '40_bus'),
    (40, '40_bus'),
])
def test_resolve_bucket_correct(pax, expected):
    assert resolve_bucket(pax) == expected


def test_resolve_bucket_too_low():
    with pytest.raises(PricingError) as exc:
        resolve_bucket(0)
    assert exc.value.code == 'pax_too_low'


def test_resolve_bucket_too_high():
    with pytest.raises(PricingError) as exc:
        resolve_bucket(41)
    assert exc.value.code == 'pax_too_high'


# ── quote_airport_transfer — منطق الحساب ────────────────

class FakeTransfer:
    """نسخة بدون DB — حقول دنيا فقط."""
    def __init__(self, **kw):
        self.price_pax_1_2     = kw.get('price_pax_1_2')
        self.price_pax_3_4     = kw.get('price_pax_3_4')
        self.price_pax_5_6     = kw.get('price_pax_5_6')
        self.price_pax_7_8     = kw.get('price_pax_7_8')
        self.price_pax_10_12   = kw.get('price_pax_10_12')
        self.price_pax_14      = kw.get('price_pax_14')
        self.price_pax_40_bus  = kw.get('price_pax_40_bus')
        self.margin_pct_1_2    = kw.get('margin_pct_1_2',    Decimal('10'))
        self.margin_pct_3_4    = kw.get('margin_pct_3_4',    Decimal('10'))
        self.margin_pct_5_6    = kw.get('margin_pct_5_6',    Decimal('10'))
        self.margin_pct_7_8    = kw.get('margin_pct_7_8',    Decimal('10'))
        self.margin_pct_10_12  = kw.get('margin_pct_10_12',  Decimal('10'))
        self.margin_pct_14     = kw.get('margin_pct_14',     Decimal('10'))
        self.margin_pct_40_bus = kw.get('margin_pct_40_bus', Decimal('10'))
        self.tour_guide_fee_myr = kw.get('tour_guide_fee_myr')


def test_quote_one_way_4_pax_default_margin():
    """KLIA→Bukit Bintang، 4 pax، اتجاه واحد، 10% ربح → 220 MYR."""
    t = FakeTransfer(price_pax_3_4=Decimal('200'))
    r = quote_airport_transfer(t, pax=4, direction=DIRECTION_TO_HOTEL)
    assert r['bucket']      == '3_4'
    assert r['base_myr']    == Decimal('200.00')
    assert r['profit_myr']  == Decimal('20.00')
    assert r['total_myr']   == Decimal('220.00')
    assert r['currency']    == 'MYR'
    assert r['direction_multiplier'] == 1


def test_quote_round_trip_doubles_base():
    """ذهاب وعودة = ضعف الاتجاه الواحد قبل الربح."""
    t = FakeTransfer(price_pax_3_4=Decimal('200'))
    r = quote_airport_transfer(t, pax=4, direction=DIRECTION_ROUND_TRIP)
    assert r['base_myr']   == Decimal('400.00')
    assert r['profit_myr'] == Decimal('40.00')
    assert r['total_myr']  == Decimal('440.00')
    assert r['direction_multiplier'] == 2


def test_quote_with_tour_guide_adds_flat_fee_with_margin():
    """رسم المرشد + هامش الربح عليه (نفس نسبة الشريحة)."""
    t = FakeTransfer(
        price_pax_3_4=Decimal('200'),
        tour_guide_fee_myr=Decimal('250'),
    )
    r = quote_airport_transfer(
        t, pax=4, direction=DIRECTION_ROUND_TRIP, include_tour_guide=True,
    )
    # base: 200×2 = 400, profit 10% = 40
    # guide: 250, guide_profit 10% = 25
    # total: 400 + 40 + 250 + 25 = 715
    assert r['tour_guide_myr']   == Decimal('250.00')
    assert r['guide_profit_myr'] == Decimal('25.00')
    assert r['total_myr']        == Decimal('715.00')


def test_quote_skips_tour_guide_when_not_requested():
    t = FakeTransfer(
        price_pax_3_4=Decimal('200'),
        tour_guide_fee_myr=Decimal('250'),
    )
    r = quote_airport_transfer(t, pax=4, direction=DIRECTION_TO_HOTEL)
    assert r['tour_guide_myr']   == Decimal('0')
    assert r['guide_profit_myr'] == Decimal('0')


def test_quote_returns_400_when_bucket_price_is_null():
    """لو الشريحة المطلوبة سعرها None → خطأ not_available_for_pax."""
    t = FakeTransfer(price_pax_1_2=Decimal('60'))  # only 1-2 set
    with pytest.raises(PricingError) as exc:
        quote_airport_transfer(t, pax=14, direction=DIRECTION_TO_HOTEL)
    assert exc.value.code == 'not_available_for_pax'


def test_quote_invalid_direction():
    t = FakeTransfer(price_pax_1_2=Decimal('60'))
    with pytest.raises(PricingError) as exc:
        quote_airport_transfer(t, pax=2, direction='diagonal')
    assert exc.value.code == 'invalid_direction'


def test_quote_pax_above_40_raises():
    t = FakeTransfer(price_pax_40_bus=Decimal('800'))
    with pytest.raises(PricingError) as exc:
        quote_airport_transfer(t, pax=41, direction=DIRECTION_TO_HOTEL)
    assert exc.value.code == 'pax_too_high'


def test_quote_to_airport_same_as_to_hotel():
    """مطار→فندق = فندق→مطار (نفس مسافة الذهاب الواحد)."""
    t = FakeTransfer(price_pax_3_4=Decimal('200'))
    r1 = quote_airport_transfer(t, pax=4, direction=DIRECTION_TO_HOTEL)
    r2 = quote_airport_transfer(t, pax=4, direction=DIRECTION_TO_AIRPORT)
    assert r1['total_myr'] == r2['total_myr']


def test_quote_custom_margin_percent():
    """نسبة ربح 20% بدلاً من الافتراضية 10%."""
    t = FakeTransfer(
        price_pax_3_4=Decimal('200'),
        margin_pct_3_4=Decimal('20'),
    )
    r = quote_airport_transfer(t, pax=4, direction=DIRECTION_TO_HOTEL)
    # 200 + 20% = 240
    assert r['margin_pct'] == Decimal('20')
    assert r['profit_myr'] == Decimal('40.00')
    assert r['total_myr']  == Decimal('240.00')
