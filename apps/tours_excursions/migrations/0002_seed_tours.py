"""بيانات تجريبية: 18 جولة من كتالوج YOUNEED 2026 (صفحات 1-2)."""
from decimal import Decimal
from django.db import migrations


# (tour_type, duration, origin_text, destination_text, prices, tour_guide, name)
TOURS = [
    # ── جولات المدن (City Tours) ─────────────────────────
    ('city_tour', 'full_day', 'Bukit Bintang', 'Kuala Lumpur City Tour',
     {'price_pax_1_2': 300, 'price_pax_3_4': 350, 'price_pax_5_6': 400,
      'price_pax_7_8': 600, 'price_pax_10_12': 750, 'price_pax_40_bus': 1000},
     350, 'KL City Tour Full Day'),
    ('city_tour', 'full_day', 'Penang Hotels', 'Penang City Tour',
     {'price_pax_1_2': 500, 'price_pax_3_4': 560, 'price_pax_5_6': 560,
      'price_pax_7_8': 720, 'price_pax_10_12': 850},
     None, 'Penang City Tour Full Day'),
    ('city_tour', 'full_day', 'Langkawi Hotels', 'Langkawi City Tour',
     {'price_pax_1_2': 240, 'price_pax_3_4': 280, 'price_pax_5_6': 320,
      'price_pax_7_8': 400, 'price_pax_10_12': 500, 'price_pax_40_bus': 1000},
     300, 'Langkawi City Tour'),

    # ── جولات نهارية (Day Trips) ─────────────────────────
    ('day_trip', 'full_day', 'Bukit Bintang', 'Sunway Lagoon',
     {'price_pax_1_2': 40, 'price_pax_3_4': 50, 'price_pax_5_6': 60,
      'price_pax_7_8': 70, 'price_pax_10_12': 130},
     None, 'Sunway Lagoon Day Trip'),
    ('day_trip', 'full_day', 'Bukit Bintang', 'Cameron Highlands',
     {'price_pax_1_2': 450, 'price_pax_3_4': 600, 'price_pax_5_6': 800,
      'price_pax_7_8': 950, 'price_pax_10_12': 1200},
     None, 'Cameron Day Trip'),
    ('day_trip', 'full_day', 'Bukit Bintang', 'Legoland Johor',
     {'price_pax_1_2': 750, 'price_pax_3_4': 850, 'price_pax_5_6': 950,
      'price_pax_7_8': 1200, 'price_pax_10_12': 1400},
     None, 'Legoland Johor Day Trip'),
    ('day_trip', 'full_day', 'Kuala Lumpur', 'Kuala Selangor / Sekinchan',
     {'price_pax_1_2': 450, 'price_pax_3_4': 550, 'price_pax_5_6': 750,
      'price_pax_7_8': 900, 'price_pax_10_12': 1200},
     None, 'KL Countryside Full Day'),
    ('day_trip', 'half_day', 'Bukit Bintang', 'Putrajaya',
     {'price_pax_1_2': 300, 'price_pax_3_4': 400, 'price_pax_5_6': 550,
      'price_pax_7_8': 650, 'price_pax_10_12': 800},
     None, 'Putrajaya Half Day Tour'),

    # ── ترانسفرات بين المدن (Inter-city) ──────────────────
    ('inter_city', 'one_way', 'Bukit Bintang', 'I-City Shah Alam',
     {'price_pax_1_2': 90, 'price_pax_3_4': 120, 'price_pax_5_6': 160,
      'price_pax_7_8': 200, 'price_pax_10_12': 300},
     None, 'BB → I-City Shah Alam'),
    ('inter_city', 'one_way', 'Bukit Bintang', 'Gamoda Rawang',
     {'price_pax_1_2': 140, 'price_pax_3_4': 170, 'price_pax_5_6': 220,
      'price_pax_7_8': 300, 'price_pax_10_12': 400},
     None, 'BB → Gamoda Rawang'),
    ('inter_city', 'one_way', 'Bukit Bintang', 'Melaka',
     {'price_pax_1_2': 260, 'price_pax_3_4': 300, 'price_pax_5_6': 350,
      'price_pax_7_8': 400, 'price_pax_10_12': 500},
     None, 'BB → Melaka'),
    ('inter_city', 'one_way', 'Bukit Bintang', 'Port Dickson',
     {'price_pax_1_2': 260, 'price_pax_3_4': 300, 'price_pax_5_6': 350,
      'price_pax_7_8': 400, 'price_pax_10_12': 500},
     None, 'BB → Port Dickson'),
    ('inter_city', 'one_way', 'Melaka', 'Port Dickson',
     {'price_pax_1_2': 150, 'price_pax_3_4': 200, 'price_pax_5_6': 250,
      'price_pax_7_8': 300, 'price_pax_10_12': 400},
     None, 'Melaka → Port Dickson'),
    ('inter_city', 'one_way', 'Bukit Bintang', 'Genting Highland',
     {'price_pax_1_2': 250, 'price_pax_3_4': 350, 'price_pax_5_6': 400,
      'price_pax_7_8': 450, 'price_pax_10_12': 550, 'price_pax_40_bus': 1300},
     None, 'BB → Genting Highland'),
    ('inter_city', 'one_way', 'Bukit Bintang', 'Ipoh',
     {'price_pax_1_2': 550, 'price_pax_3_4': 650, 'price_pax_5_6': 750,
      'price_pax_7_8': 950, 'price_pax_10_12': 1200},
     None, 'BB → Ipoh'),
    ('inter_city', 'one_way', 'Bukit Bintang', 'Penang',
     {'price_pax_1_2': 500, 'price_pax_3_4': 600, 'price_pax_5_6': 750,
      'price_pax_7_8': 900, 'price_pax_10_12': 1200},
     None, 'BB → Penang'),

    # ── ترانسفرات إلى الجزر (Island Jetty) ────────────────
    ('island_jetty', 'one_way', 'Bukit Bintang', 'Jetty Pangkor Island',
     {'price_pax_1_2': 600, 'price_pax_3_4': 750, 'price_pax_5_6': 850,
      'price_pax_7_8': 1000, 'price_pax_10_12': 1200},
     None, 'BB → Jetty Pangkor Island'),
    ('island_jetty', 'one_way', 'Bukit Bintang', 'Jetty Kapas Island',
     {'price_pax_1_2': 1100, 'price_pax_3_4': 1300, 'price_pax_5_6': 1500,
      'price_pax_7_8': 1700, 'price_pax_10_12': 2000},
     None, 'BB → Jetty Kapas Island'),
]


def seed_tours(apps, schema_editor):
    Tour    = apps.get_model('tours_excursions', 'Tour')
    Service = apps.get_model('services', 'Service')
    City    = apps.get_model('locations', 'City')

    # نختار أي مدينة افتراضية للـ Service.city (Service.city إجباري)
    default_city = City.objects.filter(name__iexact='Kuala Lumpur').first() \
                or City.objects.first()

    for tour_type, duration, origin, dest, prices, guide, name in TOURS:
        if Tour.objects.filter(destination_text=dest, tour_type=tour_type).exists():
            continue
        svc = Service.objects.create(
            name=name, city=default_city, service_type='tour',
            currency='MYR', is_optional=True, is_active=True,
        )
        Tour.objects.create(
            service=svc,
            tour_type=tour_type, duration=duration,
            origin_text=origin, destination_text=dest,
            tour_guide_fee_myr=Decimal(str(guide)) if guide else None,
            **{k: Decimal(str(v)) for k, v in prices.items()},
        )


def unseed(apps, schema_editor):
    Tour = apps.get_model('tours_excursions', 'Tour')
    Tour.objects.all().delete()


class Migration(migrations.Migration):

    dependencies = [
        ('tours_excursions', '0001_initial'),
        ('services',         '0006_service_custom_fields'),
        ('locations',        '0001_initial'),
    ]

    operations = [
        migrations.RunPython(seed_tours, reverse_code=unseed),
    ]
