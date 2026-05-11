"""بيانات تجريبية: 6 مطارات + 5 خدمات نقل من كتالوج YOUNEED 2026."""
from decimal import Decimal
from django.db import migrations


# ── المطارات الـ6 ────────────────────────────────────────
AIRPORTS = [
    # (code, name, city_name_hint)
    ('KLIA',  'Kuala Lumpur International Airport',         'Sepang'),
    ('KLIA2', 'Kuala Lumpur International Airport Term. 2', 'Sepang'),
    ('SZB',   'Sultan Abdul Aziz Shah Airport (Subang)',    'Subang Jaya'),
    ('PEN',   'Penang International Airport',               'Bayan Lepas'),
    ('LGK',   'Langkawi International Airport',             'Langkawi'),
    ('TGG',   'Sultan Mahmud Airport',                      'Kuala Terengganu'),
]


# ── 5 خدمات نقل من PDF صفحة 1 ─────────────────────────────
# (airport_code, hotel_city_hint, prices_dict, tour_guide)
TRANSFERS = [
    {
        'airport': 'KLIA',
        'hotel_city': 'Kuala Lumpur',
        'prices': {
            'price_pax_1_2':    Decimal('150'),
            'price_pax_3_4':    Decimal('200'),
            'price_pax_5_6':    Decimal('250'),
            'price_pax_7_8':    Decimal('300'),
            'price_pax_10_12':  Decimal('400'),
            'price_pax_14':     Decimal('450'),
            'price_pax_40_bus': Decimal('800'),
        },
        'tour_guide': Decimal('250'),
        'name': 'KLIA / KLIA2 → Bukit Bintang',
    },
    {
        'airport': 'SZB',
        'hotel_city': 'Kuala Lumpur',
        'prices': {
            'price_pax_1_2':    Decimal('60'),
            'price_pax_3_4':    Decimal('70'),
            'price_pax_5_6':    Decimal('80'),
            'price_pax_7_8':    Decimal('120'),
            'price_pax_10_12':  Decimal('150'),
            'price_pax_40_bus': Decimal('800'),
        },
        'tour_guide': None,
        'name': 'Subang Airport → Bukit Bintang',
    },
    {
        'airport': 'PEN',
        'hotel_city': 'George Town',
        'prices': {
            'price_pax_1_2':    Decimal('70'),
            'price_pax_3_4':    Decimal('90'),
            'price_pax_5_6':    Decimal('130'),
            'price_pax_7_8':    Decimal('200'),
            'price_pax_10_12':  Decimal('300'),
        },
        'tour_guide': None,
        'name': 'Penang Airport → Penang Island',
    },
    {
        'airport': 'LGK',
        'hotel_city': 'Langkawi',
        'prices': {
            'price_pax_1_2':    Decimal('40'),
            'price_pax_3_4':    Decimal('50'),
            'price_pax_5_6':    Decimal('70'),
            'price_pax_7_8':    Decimal('100'),
            'price_pax_10_12':  Decimal('200'),
            'price_pax_14':     Decimal('300'),
        },
        'tour_guide': Decimal('150'),
        'name': 'Langkawi Airport → Hotel Transfer',
    },
    {
        'airport': 'TGG',
        'hotel_city': 'Kuala Terengganu',
        'prices': {
            'price_pax_1_2':    Decimal('130'),
            'price_pax_3_4':    Decimal('160'),
            'price_pax_5_6':    Decimal('200'),
            'price_pax_7_8':    Decimal('270'),
            'price_pax_10_12':  Decimal('350'),
        },
        'tour_guide': None,
        'name': 'Kuala Terengganu Airport → Marang Kapas Jetty',
    },
]


def seed_airports(apps, schema_editor):
    Airport = apps.get_model('services', 'Airport')
    City    = apps.get_model('locations', 'City')

    for code, name, city_hint in AIRPORTS:
        city = City.objects.filter(name__iexact=city_hint).first()
        Airport.objects.update_or_create(
            code=code,
            defaults={
                'name':      name,
                'city':      city,
                'is_active': True,
            },
        )


def seed_transfers(apps, schema_editor):
    """ينشئ Service + AirportTransfer لكل مسار. يتجاوز بصمت لو لم يوجد فندق مطابق."""
    Airport         = apps.get_model('services', 'Airport')
    AirportTransfer = apps.get_model('services', 'AirportTransfer')
    Service         = apps.get_model('services', 'Service')
    Hotel           = apps.get_model('hotels',   'Hotel')
    City            = apps.get_model('locations', 'City')

    for spec in TRANSFERS:
        airport = Airport.objects.filter(code=spec['airport']).first()
        if not airport:
            continue
        # نختار أول فندق نشط في المدينة المطلوبة (إن وُجد)
        hotel = (
            Hotel.objects.filter(city__name__iexact=spec['hotel_city']).first()
            or Hotel.objects.filter(city__name__icontains=spec['hotel_city']).first()
        )
        if not hotel:
            # لا فندق متطابق — نتجاوز هذا الصف، يربطه الأدمن يدوياً لاحقاً
            continue

        # تجنّب التكرار إن أُعيد تشغيل الـ migration
        if AirportTransfer.objects.filter(airport=airport, hotel=hotel).exists():
            continue

        svc = Service.objects.create(
            name=spec['name'],
            city=hotel.city,
            service_type='transport',
            currency='MYR',
            is_optional=True,
            is_active=True,
        )
        AirportTransfer.objects.create(
            service=svc,
            airport=airport,
            hotel=hotel,
            tour_guide_fee_myr=spec['tour_guide'],
            **spec['prices'],
        )


def unseed(apps, schema_editor):
    AirportTransfer = apps.get_model('services', 'AirportTransfer')
    Airport         = apps.get_model('services', 'Airport')
    AirportTransfer.objects.all().delete()
    Airport.objects.filter(code__in=[a[0] for a in AIRPORTS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('services', '0007_airport_airporttransfer'),
        ('hotels',   '0001_initial'),
        ('locations', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_airports, reverse_code=unseed),
        migrations.RunPython(seed_transfers, reverse_code=migrations.RunPython.noop),
    ]
