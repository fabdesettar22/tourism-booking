"""إدخال بيانات كتيب أسعار YOUNEED TRAVEL & TOUR 2026.

idempotent — يمكن إعادة تشغيله بأمان عبر update_or_create.

Usage:
    python manage.py import_youneed_2026
    python manage.py import_youneed_2026 --dry-run
"""
from datetime import date
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.hotels.models import Hotel
from apps.locations.models import City
from apps.hotel_rates.models import (
    RoomCategory, HotelSeason, HotelSeasonDateRange, RoomRate,
    HotelSurcharge, RoomInclusion,
)


# ─── City id resolution ───────────────────────────────────
# (مأخوذ من Locations DB الموجود — Malaysia ISO2='MY')
CITIES = {
    'KL':            92843,  # Kuala Lumpur
    'PENANG':        92832,  # George Town
    'LANGKAWI':      92624,  # Kuah
    'MELAKA':        92778,  # Malacca
    'PORT_DICKSON':  92794,
    'SEPANG':        92795,
    'GENTING':       93124,  # Bentong Town (Pahang)
    'TERENGGANU':    92695,  # Cukai
}


def D(v):
    """Decimal helper."""
    if v is None:
        return None
    return Decimal(str(v))


class Command(BaseCommand):
    help = 'Import YOUNEED 2026 hotel rate sheet (29 hotels)'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be created')

    def handle(self, *args, **opts):
        self.dry = opts['dry_run']
        self.stdout.write(self.style.WARNING(f'{"[DRY RUN] " if self.dry else ""}Starting import...'))

        # Resolve cities
        self.cities = {k: City.objects.get(id=v) for k, v in CITIES.items()}

        with transaction.atomic():
            self._counters = {'hotels': 0, 'categories': 0, 'seasons': 0, 'ranges': 0, 'rates': 0, 'surcharges': 0, 'inclusions': 0}

            # ═══ KUALA LUMPUR (10 hotels) ═══
            self.import_grand_mercure_kl()
            self.import_royal_signature_bukit_bintang()
            self.import_royale_chulan_kl()
            self.import_sunway_putra_kl()
            self.import_seri_pacific_kl()
            self.import_the_face_style()
            self.import_the_face_suite()
            self.import_kl_journal()
            self.import_hotel_maya_kl()
            self.import_park_royal_collectionz()
            self.import_ibis_style_klcc()

            # ═══ PENANG (1) ═══
            self.import_mercure_penang()

            # ═══ LANGKAWI (9) ═══
            self.import_mercure_langkawi()
            self.import_dash_resort()
            self.import_camar_resort()
            self.import_tanjung_rhu()
            self.import_adya_kuah()
            self.import_wings_croske()
            self.import_hotel_sena()
            self.import_frangipani()
            self.import_resort_world_langkawi()

            # ═══ SEPANG (1) ═══
            self.import_holiday_inn_sepang()

            # ═══ MELAKA (2) ═══
            self.import_holiday_inn_melaka()
            self.import_ibis_style_melaka()

            # ═══ PORT DICKSON (2) ═══
            self.import_avillion()
            self.import_thistle_pd()

            # ═══ GENTING HIGHLAND (2) ═══
            self.import_swiss_garden_genting()
            self.import_resort_world_genting()

            # ═══ TERENGGANU (1) ═══
            self.import_resort_world_kijal()

            if self.dry:
                self.stdout.write(self.style.WARNING('[DRY RUN] Rolling back...'))
                transaction.set_rollback(True)

        self.stdout.write(self.style.SUCCESS('\n✅ Import complete:'))
        for k, v in self._counters.items():
            self.stdout.write(f'  {k}: {v}')

    # ─── Helper methods ──────────────────────────────────

    def hotel(self, *, name, city_key, chain='', default_margin=Decimal('8'), stars=4):
        h, created = Hotel.objects.update_or_create(
            name=name,
            defaults={
                'city': self.cities[city_key],
                'hotel_chain': chain,
                'default_margin_pct': default_margin,
                'rate_currency': 'MYR',
                'stars': stars,
            },
        )
        if created:
            self._counters['hotels'] += 1
        return h

    def category(self, hotel, *, name, base_type='room', view_type='standard', pax=2, max_occupancy=2, bed_config='', is_package=False, sort_order=0):
        c, created = RoomCategory.objects.update_or_create(
            hotel=hotel, name=name, view_type=view_type, pax=pax,
            defaults={
                'base_type': base_type,
                'max_occupancy': max_occupancy,
                'bed_config': bed_config,
                'is_package': is_package,
                'sort_order': sort_order,
                'is_active': True,
            },
        )
        if created:
            self._counters['categories'] += 1
        return c

    def season(self, hotel, *, name, season_type='flat', sort_order=0, notes='', date_ranges=None):
        s, created = HotelSeason.objects.update_or_create(
            hotel=hotel, name=name,
            defaults={'season_type': season_type, 'sort_order': sort_order, 'notes': notes, 'is_active': True},
        )
        if created:
            self._counters['seasons'] += 1
        # Reset ranges (idempotent)
        if date_ranges:
            HotelSeasonDateRange.objects.filter(season=s).delete()
            for sd, ed, label in date_ranges:
                HotelSeasonDateRange.objects.create(season=s, start_date=sd, end_date=ed, label=label or '')
                self._counters['ranges'] += 1
        return s

    def rate(self, category, *, season=None, tier='fit', day_type='all', occupancy='double',
             base_rate, rate_with_breakfast=None, extra_bed=None, kid_bf=None,
             kid_bf_free=False, kid_bf_age=None, tax_inclusive=True, markup=Decimal('8'),
             notes=''):
        kwargs = {
            'room_category': category,
            'season': season,
            'pricing_tier': tier,
            'day_type': day_type,
            'occupancy': occupancy,
        }
        defaults = {
            'base_rate': D(base_rate),
            'rate_with_breakfast': D(rate_with_breakfast),
            'extra_bed_price': D(extra_bed),
            'kid_breakfast_price': D(kid_bf),
            'kid_breakfast_free': kid_bf_free,
            'kid_breakfast_age_limit': kid_bf_age,
            'tax_inclusive': tax_inclusive,
            'markup_pct': markup,
            'currency': 'MYR',
            'notes': notes,
            'is_active': True,
        }
        r, created = RoomRate.objects.update_or_create(**kwargs, defaults=defaults)
        if created:
            self._counters['rates'] += 1
        return r

    def surcharge(self, hotel, *, name, surcharge_type='fixed', amount,
                  weekday=None, date_start=None, date_end=None, applies_to_tier=''):
        s, created = HotelSurcharge.objects.update_or_create(
            hotel=hotel, name=name, weekday=weekday, date_start=date_start,
            defaults={
                'surcharge_type': surcharge_type,
                'amount': D(amount),
                'date_end': date_end or date_start,
                'applies_to_tier': applies_to_tier,
                'is_active': True,
            },
        )
        if created:
            self._counters['surcharges'] += 1
        return s

    def inclusion(self, category, *, label, quantity=1, unit='pax', sort_order=0):
        i, created = RoomInclusion.objects.update_or_create(
            room_category=category, label=label, sort_order=sort_order,
            defaults={'quantity': quantity, 'unit': unit},
        )
        if created:
            self._counters['inclusions'] += 1
        return i

    # ═══════════════════════════════════════════════════════
    # KUALA LUMPUR
    # ═══════════════════════════════════════════════════════

    def import_grand_mercure_kl(self):
        h = self.hotel(name='Grand Mercure Kuala Lumpur', city_key='KL', chain='Mercure', stars=4)
        rooms = {
            'Superior Room':   {'fit': 350, 'git': 310},
            'Deluxe Room':     {'fit': 420},
            'Family Room':     {'fit': 850},
            'Executive':       {'fit': 700, 'git': 650},
        }
        for name, prices in rooms.items():
            cat = self.category(h, name=name)
            for tier, p in prices.items():
                self.rate(cat, tier=tier, base_rate=p, extra_bed=150, kid_bf=40)

    def import_royal_signature_bukit_bintang(self):
        h = self.hotel(name='Royal Signature Bukit Bintang', city_key='KL', stars=4)
        for name, prices in {
            'Deluxe':         {'fit': 320, 'git': 310},
            'Executive King': {'fit': 540},
        }.items():
            cat = self.category(h, name=name)
            for tier, p in prices.items():
                self.rate(cat, tier=tier, base_rate=p, extra_bed=150, kid_bf=40)

    def import_royale_chulan_kl(self):
        h = self.hotel(name='Royale Chulan Kuala Lumpur', city_key='KL', stars=5)
        # Standard rooms
        for name, prices in {
            'Superior': {'fit': 285, 'git': 270},
            'Studio':   {'fit': 300},
            'Deluxe':   {'fit': 330, 'git': 290},
            'Premier':  {'fit': 375},
        }.items():
            cat = self.category(h, name=name)
            for tier, p in prices.items():
                self.rate(cat, tier=tier, base_rate=p, extra_bed=150, kid_bf=40)
        # Suites (FIT only)
        for name, p, base, mp in [
            ('Executive Suite',          650, 'suite',     2),
            ('Premier Suite',            870, 'suite',     2),
            ('1 Bedroom Apartment',      390, 'apartment', 2),
            ('2 Bedroom Apartment',      495, 'apartment', 4),
            ('2 Bedroom Exec Apartment', 720, 'apartment', 4),
        ]:
            cat = self.category(h, name=name, base_type=base, pax=mp, max_occupancy=mp)
            self.rate(cat, tier='fit', base_rate=p, kid_bf=40)

    def import_sunway_putra_kl(self):
        h = self.hotel(name='Sunway Putra Kuala Lumpur', city_key='KL', stars=4)
        cat = self.category(h, name='Superior')
        self.rate(cat, tier='fit', base_rate=310, extra_bed=160, kid_bf=40)
        self.rate(cat, tier='git_normal', base_rate=290, extra_bed=160, kid_bf=40)
        self.rate(cat, tier='git_series', base_rate=270, extra_bed=160, kid_bf=40)
        for name, p in [('Deluxe', 370), ('Executive Room', 450)]:
            cat = self.category(h, name=name)
            self.rate(cat, tier='fit', base_rate=p, extra_bed=160, kid_bf=40)

    def import_seri_pacific_kl(self):
        h = self.hotel(name='Seri Pacific Kuala Lumpur', city_key='KL', stars=4)
        rooms = {
            'Superior':         [('fit_normal', 310), ('fit_promo', 290), ('git_normal', 270), ('git_series', 250)],
            'Deluxe':           [('fit_normal', 340), ('fit_promo', 320), ('git_normal', 300), ('git_series', 290)],
            'Club':             [('fit_normal', 490), ('fit_promo', 470), ('git_normal', 450)],
            'Executive Suite':  [('fit_normal', 670), ('fit_promo', 680), ('git_normal', 650)],
        }
        for name, tier_prices in rooms.items():
            base = 'suite' if 'Suite' in name else 'room'
            cat = self.category(h, name=name, base_type=base)
            for tier, p in tier_prices:
                self.rate(cat, tier=tier, base_rate=p, extra_bed=110, kid_bf=40)

    def import_the_face_style(self):
        # The Face Style — Infinity Pool with KLCC View — Hotel Room Low Zone
        h = self.hotel(name='The Face Style KLCC', city_key='KL', stars=4)
        rooms = [
            # name, ro, rwb, view, base_type, pax
            ('Superior King',          350, 440, 'klcc', 'room', 2),
            ('Deluxe Twin',            400, 490, 'klcc', 'room', 2),
            ('Deluxe King',            400, 490, 'klcc', 'room', 2),
            ('Junior Premier King',    460, 550, 'klcc', 'room', 2),
            ('Premier King',           490, 580, 'klcc', 'room', 2),
            ('Executive Deluxe King',  410, 500, 'klcc', 'room', 2),
            ('Executive Deluxe',       440, 530, 'city', 'room', 2),
            ('Grand Premier King',     520, 610, 'klcc', 'room', 2),
            # Suites
            ('One Bedroom Superior',   650, 740, 'klcc', 'suite', 2),
            ('Two Bedroom Superior',   1240, 1420, 'klcc', 'suite', 4),
            ('Two Bedrooms Deluxe',    1340, 1520, 'klcc', 'suite', 4),
        ]
        for name, ro, rwb, view, bt, pax in rooms:
            cat = self.category(h, name=name, base_type=bt, view_type=view, pax=pax, max_occupancy=pax)
            self.rate(cat, tier='fit', base_rate=ro, rate_with_breakfast=rwb, extra_bed=130)

    def import_the_face_suite(self):
        # The Face Suite — Infinity Pool KL Tower View
        h = self.hotel(name='The Face Suite KL Tower', city_key='KL', stars=4)
        rooms = [
            ('One Bedroom Superior',   410, 500, 2),
            ('One Bedroom Deluxe',     440, 530, 2),
            ('One Bedroom Premier',    490, 490, 2),
            ('Two Bedroom Superior',   480, 660, 4),
            ('Two Bedrooms Deluxe',    530, 710, 4),
            ('Two Bedrooms Premier',   630, 810, 4),
        ]
        for name, ro, rwb, pax in rooms:
            cat = self.category(h, name=name, base_type='suite', view_type='kl_tower', pax=pax, max_occupancy=pax)
            self.rate(cat, tier='fit', base_rate=ro, rate_with_breakfast=rwb, extra_bed=130)

    def import_kl_journal(self):
        h = self.hotel(name='The Kuala Lumpur Journal', city_key='KL', stars=4)
        normal = self.season(h, name='Normal Season', season_type='normal', sort_order=1)
        peak   = self.season(h, name='Peak Season',   season_type='peak',   sort_order=2)
        for name, np_, pp in [('Deluxe King', 360, 460), ('Deluxe Triple', 420, 520)]:
            cat = self.category(h, name=name, pax=3 if 'Triple' in name else 2)
            self.rate(cat, season=normal, tier='fit', base_rate=np_, extra_bed=150, kid_bf=40)
            self.rate(cat, season=peak,   tier='fit', base_rate=pp,  extra_bed=150, kid_bf=40)

    def import_hotel_maya_kl(self):
        h = self.hotel(name='Hotel Maya Kuala Lumpur', city_key='KL', stars=4)
        for name, p, notes in [
            ('Deluxe',        360, ''),
            ('Heritage',      410, ''),
            ('Premiere',      440, ''),
            ('Grand Premier', 600, '4 breakfast included'),
        ]:
            cat = self.category(h, name=name)
            self.rate(cat, tier='fit', base_rate=p, kid_bf=30, notes=notes)

    def import_park_royal_collectionz(self):
        h = self.hotel(name='Park Royal Collectionz Bukit Bintang', city_key='KL', stars=5)
        for name, prices in {
            'Urban Deluxe':       {'fit': 490, 'git': 460},
            'Lifestyle Premiere': {'fit': 540, 'git': 500},
        }.items():
            cat = self.category(h, name=name)
            for tier, p in prices.items():
                self.rate(cat, tier=tier, base_rate=p, extra_bed=160, kid_bf=35)

    def import_ibis_style_klcc(self):
        h = self.hotel(name='Ibis Style KLCC', city_key='KL', chain='Ibis Style', stars=3)
        cat = self.category(h, name='Deluxe Double')
        # FIT weekday 370++ / weekend 450++; GIT weekday 330++ / weekend 385++
        for tier, wd, we in [('fit', 370, 450), ('git', 330, 385)]:
            self.rate(cat, tier=tier, day_type='weekday', base_rate=wd, extra_bed=110, kid_bf=45, kid_bf_age=12, tax_inclusive=False)
            self.rate(cat, tier=tier, day_type='weekend', base_rate=we, extra_bed=110, kid_bf=45, kid_bf_age=12, tax_inclusive=False)

    # ═══════════════════════════════════════════════════════
    # PENANG
    # ═══════════════════════════════════════════════════════

    def import_mercure_penang(self):
        h = self.hotel(name='Mercure Penang Beachfront', city_key='PENANG', chain='Mercure', stars=4)
        for view, fit_p, git_p in [('hill', 290, 270), ('sea', 360, 310)]:
            cat = self.category(h, name='Superior', view_type=view)
            for occ in ('single', 'double'):
                self.rate(cat, tier='fit', occupancy=occ, base_rate=fit_p, extra_bed=150, kid_bf_free=True, kid_bf_age=6)
                self.rate(cat, tier='git', occupancy=occ, base_rate=git_p, extra_bed=150, kid_bf_free=True, kid_bf_age=6)

    # ═══════════════════════════════════════════════════════
    # LANGKAWI
    # ═══════════════════════════════════════════════════════

    def import_mercure_langkawi(self):
        h = self.hotel(name='Mercure Langkawi', city_key='LANGKAWI', chain='Mercure', stars=4)
        cat = self.category(h, name='Superior Twin/King', bed_config='Twin / King')
        self.rate(cat, tier='git', base_rate=480)

    def import_dash_resort(self):
        h = self.hotel(name='Dash Resort Langkawi Beachfront', city_key='LANGKAWI', stars=4)
        # 4 seasons with multi-disjoint date ranges
        low = self.season(h, name='Low Season', season_type='low', sort_order=1, date_ranges=[
            (date(2026, 2, 17), date(2026, 4, 30), ''),
            (date(2026, 9, 1),  date(2026, 10, 31), ''),
        ])
        shoulder = self.season(h, name='Shoulder Season', season_type='shoulder', sort_order=2, date_ranges=[
            (date(2026, 1, 5),   date(2026, 1, 28), ''),
            (date(2026, 5, 1),   date(2026, 5, 16), ''),
            (date(2026, 11, 1),  date(2026, 11, 30), ''),
        ])
        high = self.season(h, name='High Season', season_type='high', sort_order=3, date_ranges=[
            (date(2026, 1, 29),  date(2026, 2, 16), ''),
            (date(2026, 5, 28),  date(2026, 8, 31), ''),
            (date(2026, 12, 1),  date(2026, 12, 20), ''),
        ])
        peak = self.season(h, name='Peak Season', season_type='peak', sort_order=4, date_ranges=[
            (date(2026, 1, 1),   date(2026, 1, 4), ''),
            (date(2026, 5, 17),  date(2026, 5, 27), ''),
            (date(2026, 12, 21), date(2026, 12, 31), ''),
        ])
        rooms = [
            # name, view, [(low_wd, low_we), (sh_wd, sh_we), (hi_wd, hi_we), peak]
            ('Dash Superior King',     'standard', [(490, 520), (520, 550), (550, 580), 610]),
            ('Dash Superior Twin',     'standard', [(490, 520), (520, 550), (550, 580), 610]),
            ('Dash Superior Garden',   'garden',   [(580, 610), (650, 680), (670, 700), 840]),
            ('Dash Deluxe Garden',     'garden',   [(670, 700), (730, 760), (800, 830), 870]),
            ('Dash Premium Pool',      'pool',     [(860, 890), (920, 950), (1040, 1070), 1140]),
            ('Dash Premium Jacuzzi',   'sea',      [(1160, 1190), (1240, 1270), (1340, 1370), 1420]),
        ]
        seasons_list = [(low, 0), (shoulder, 1), (high, 2)]
        for rname, view, prices in rooms:
            cat = self.category(h, name=rname, view_type=view, bed_config='King' if 'King' in rname else 'Twin' if 'Twin' in rname else '')
            # 3 seasons × 2 day_types
            for s_obj, idx in seasons_list:
                wd, we = prices[idx]
                self.rate(cat, season=s_obj, tier='fit', day_type='weekday', base_rate=wd, extra_bed=150, kid_bf=35)
                self.rate(cat, season=s_obj, tier='fit', day_type='weekend', base_rate=we, extra_bed=150, kid_bf=35)
            # Peak: flat rate
            self.rate(cat, season=peak, tier='fit', day_type='all', base_rate=prices[3], extra_bed=150, kid_bf=35)

    def import_camar_resort(self):
        h = self.hotel(name='Camar Resort Langkawi Beachfront', city_key='LANGKAWI', stars=4)
        rooms = [
            ('Pool Wing Deluxe',   'pool',    500, None),
            ('Lagoon Room',        'lagoon',  550, None),
            ('Family Suite',       'pool',    1200, 200),
            ('Beach Wing Deluxe',  'garden',  500, 200),
            ('Premier Villa',      'garden',  550, 200),
            ('Junior Suite',       'beach',   700, 200),
        ]
        for name, view, p, eb in rooms:
            base = 'suite' if 'Suite' in name else 'villa' if 'Villa' in name else 'room'
            pax = 3 if 'Family' in name else 2
            cat = self.category(h, name=name, base_type=base, view_type=view, pax=pax, max_occupancy=pax)
            self.rate(cat, tier='fit', base_rate=p, extra_bed=eb, kid_bf=50)

    def import_tanjung_rhu(self):
        h = self.hotel(name='Tanjung Rhu Resort Langkawi', city_key='LANGKAWI', stars=5)
        promo  = self.season(h, name='Tactical Promo', season_type='tactical_promo', sort_order=1, notes='Tactical Promo Rate (until 30 June 2027)')
        normal = self.season(h, name='Normal Season',  season_type='normal',         sort_order=2)
        high   = self.season(h, name='High Season',    season_type='high',           sort_order=3)
        suites = [
            ('Damai Suite',        680,  850,  1150),
            ('Cahaya Suite',       720,  900,  1200),
            ('Bayu Suria Suite',   840,  1050, 1350),
            ('Bayu Senja Suite',   960,  1200, 1500),
            ('Bayu Family Suite',  1120, 1400, 1700),
        ]
        for name, p1, p2, p3 in suites:
            pax = 4 if 'Family' in name else 2
            cat = self.category(h, name=name, base_type='suite', pax=pax, max_occupancy=pax)
            self.rate(cat, season=promo,  tier='fit', base_rate=p1, extra_bed=150, kid_bf=30)
            self.rate(cat, season=normal, tier='fit', base_rate=p2, extra_bed=150, kid_bf=30)
            self.rate(cat, season=high,   tier='fit', base_rate=p3, extra_bed=150, kid_bf=30)

    def import_adya_kuah(self):
        h = self.hotel(name='Adya Kuah Hotel', city_key='LANGKAWI', stars=4)
        normal = self.season(h, name='Normal Season', season_type='normal', sort_order=1)
        high   = self.season(h, name='High Season',   season_type='high',   sort_order=2)
        rooms = [
            ('Superior Room',  'room',  280, 310),
            ('Deluxe Room',    'room',  290, 320),
            ('Executive',      'room',  380, 420),
            ('Junior Suite',   'suite', 780, 810),
            ('Premier Suite',  'suite', 1020, 1080),
            ('Perdana Suite',  'suite', 1780, 1850),
        ]
        for name, bt, np_, pp in rooms:
            cat = self.category(h, name=name, base_type=bt)
            self.rate(cat, season=normal, tier='fit', base_rate=np_, extra_bed=130, kid_bf=30)
            self.rate(cat, season=high,   tier='fit', base_rate=pp,  extra_bed=130, kid_bf=30)

    def import_wings_croske(self):
        h = self.hotel(name='Wings by Croske Langkawi', city_key='LANGKAWI', stars=4)
        rooms = [
            ('Deluxe Room',       'room',  338, 308, 100, 30),
            ('Family 2 Bedrooms', 'room',  960, 890, 100, 30),
            ('Junior Suite',      'suite', 1590, 1290, 200, 530),
        ]
        for name, bt, fp, gp, eb, kb in rooms:
            pax = 4 if 'Family' in name else 2
            cat = self.category(h, name=name, base_type=bt, pax=pax, max_occupancy=pax)
            self.rate(cat, tier='fit', base_rate=fp, extra_bed=eb, kid_bf=kb)
            self.rate(cat, tier='git', base_rate=gp, extra_bed=eb, kid_bf=kb)

    def import_hotel_sena(self):
        h = self.hotel(name='Hotel Sena Langkawi', city_key='LANGKAWI', stars=3)
        rooms = [
            ('Standard Twin/King',  'standard', 'room', 150, 2),
            ('Deluxe Twin/King',    'standard', 'room', 160, 2),
            ('Family Street View',  'street',   'room', 345, 4),
            ('Family Runaway',      'runaway',  'room', 380, 4),
        ]
        for name, view, bt, p, pax in rooms:
            cat = self.category(h, name=name, base_type=bt, view_type=view, pax=pax, max_occupancy=pax)
            self.rate(cat, tier='fit', base_rate=p, kid_bf=20)

    def import_frangipani(self):
        h = self.hotel(name='The Frangipani Langkawi', city_key='LANGKAWI', stars=4)
        low = self.season(h, name='Low Season', season_type='low', sort_order=1, notes='April - June, September, March')
        peak = self.season(h, name='Peak Season', season_type='peak', sort_order=2, notes='July - August, October, November - December')
        super_peak = self.season(h, name='Super Peak Season', season_type='super_peak', sort_order=3, notes='18 Dec - January, February')
        rooms = [
            # name, base_type, view, pax, low, peak, super_peak
            ('Deluxe',                'room',  'standard', 2, 443, 544, 612),
            ('Family Room',           'room',  'standard', 4, 888, 1088, 1224),
            ('Family Deluxe Room',    'room',  'standard', 4, 888, 1088, 1224),
            ('Deluxe Triple',         'room',  'standard', 3, 572, 720, 740),
            ('Deluxe Sea View',       'room',  'sea',      2, 493, 593, 661),
            ('Garden Villa Triple',   'villa', 'garden',   3, 660, 760, 828),
            ('Garden Villa Premier',  'villa', 'garden',   2, 598, 698, 766),
            ('Beach Facing Villa',    'villa', 'beach',    2, 700, 800, 868),
            ('Beach Villa Premier',   'villa', 'beach',    2, 802, 902, 996),
            ('Quad Beach Villa',      'villa', 'beach',    4, 1050, 1200, 1302),
            ('Family Beach Suite',    'suite', 'beach',    4, 1400, 1534, 1693),
        ]
        for name, bt, view, pax, l, p, sp in rooms:
            cat = self.category(h, name=name, base_type=bt, view_type=view, pax=pax, max_occupancy=pax)
            self.rate(cat, season=low,        tier='fit', base_rate=l, rate_with_breakfast=l, extra_bed=150, kid_bf=30)
            self.rate(cat, season=peak,       tier='fit', base_rate=p, rate_with_breakfast=p, extra_bed=150, kid_bf=30)
            self.rate(cat, season=super_peak, tier='fit', base_rate=sp, rate_with_breakfast=sp, extra_bed=150, kid_bf=30)

    def import_resort_world_langkawi(self):
        h = self.hotel(name='Resort World Langkawi', city_key='LANGKAWI', chain='Resort World', stars=4)
        rooms = [
            ('Standard Seaview',   'sea',      302, 352),
            ('Premier Room',       'standard', 298, 348),
            ('Premier Seaview',    'sea',      322, 372),
        ]
        for name, view, wd, we in rooms:
            cat = self.category(h, name=name, view_type=view)
            self.rate(cat, tier='fit', day_type='weekday', base_rate=wd, extra_bed=150, kid_bf=30, tax_inclusive=False)
            self.rate(cat, tier='fit', day_type='weekend', base_rate=we, extra_bed=150, kid_bf=30, tax_inclusive=False)

    # ═══════════════════════════════════════════════════════
    # SEPANG
    # ═══════════════════════════════════════════════════════

    def import_holiday_inn_sepang(self):
        h = self.hotel(name='Holiday Inn Sepang', city_key='SEPANG', chain='Holiday Inn', stars=4)
        cat1 = self.category(h, name='Standard (1 Breakfast)', sort_order=1)
        self.rate(cat1, tier='fit', base_rate=310, extra_bed=150, kid_bf=40, tax_inclusive=False, notes='1 breakfast')
        cat2 = self.category(h, name='Standard (2 Breakfast)', sort_order=2)
        self.rate(cat2, tier='fit', base_rate=330, extra_bed=150, kid_bf=40, tax_inclusive=False, notes='2 breakfast')

    # ═══════════════════════════════════════════════════════
    # MELAKA
    # ═══════════════════════════════════════════════════════

    def import_holiday_inn_melaka(self):
        h = self.hotel(name='Holiday Inn Melaka', city_key='MELAKA', chain='Holiday Inn', stars=4)
        cat = self.category(h, name='Deluxe Double')
        for tier, wd, we in [('fit', 370, 450), ('git', 330, 385)]:
            self.rate(cat, tier=tier, day_type='weekday', base_rate=wd, extra_bed=110, kid_bf=45, kid_bf_age=12, tax_inclusive=False)
            self.rate(cat, tier=tier, day_type='weekend', base_rate=we, extra_bed=110, kid_bf=45, kid_bf_age=12, tax_inclusive=False)

    def import_ibis_style_melaka(self):
        h = self.hotel(name='Ibis Style Melaka', city_key='MELAKA', chain='Ibis Style', stars=3)
        # Standard, Superior, Family (with breakfast for family) — weekday/weekend
        rooms = [
            ('Standard', 'room', 2, 270, 270, 100),
            ('Superior', 'room', 2, 290, 320, 100),
            ('Family',   'room', 3, 570, 620, 150),  # Family includes breakfast
        ]
        for name, bt, pax, wd, we, eb in rooms:
            cat = self.category(h, name=name, base_type=bt, pax=pax, max_occupancy=pax)
            note = 'Family rate includes breakfast' if name == 'Family' else ''
            self.rate(cat, tier='fit', day_type='weekday', base_rate=wd, extra_bed=eb, kid_bf=46, kid_bf_age=12, notes=note)
            self.rate(cat, tier='fit', day_type='weekend', base_rate=we, extra_bed=eb, kid_bf=46, kid_bf_age=12, notes=note)

    # ═══════════════════════════════════════════════════════
    # PORT DICKSON
    # ═══════════════════════════════════════════════════════

    def import_avillion(self):
        h = self.hotel(name='Avillion Port Dickson', city_key='PORT_DICKSON', chain='Avillion', stars=4)
        for name, eb, wd, we in [
            ('Garden Chalet',         100, 310, 410),
            ('Water Chalet',          150, 340, 440),
            ('Premium Water Chalet',  150, 540, 640),
        ]:
            cat = self.category(h, name=name, base_type='chalet')
            self.rate(cat, tier='fit', day_type='weekday', base_rate=wd, extra_bed=eb, kid_bf=20)
            self.rate(cat, tier='fit', day_type='weekend', base_rate=we, extra_bed=eb, kid_bf=20)

    def import_thistle_pd(self):
        h = self.hotel(name='Thistle Port Dickson', city_key='PORT_DICKSON', stars=4)
        for name, view, wd, we in [
            ('Deluxe Room',     'standard', 260, 306),
            ('Deluxe Seafront', 'sea',      296, 347),
        ]:
            cat = self.category(h, name=name, view_type=view)
            self.rate(cat, tier='fit', day_type='weekday', base_rate=wd, extra_bed=106, kid_bf=30)
            self.rate(cat, tier='fit', day_type='weekend', base_rate=we, extra_bed=106, kid_bf=30)

    # ═══════════════════════════════════════════════════════
    # GENTING HIGHLAND
    # ═══════════════════════════════════════════════════════

    def import_swiss_garden_genting(self):
        h = self.hotel(name='Swiss Garden Hotel & Residence Genting Highland', city_key='GENTING', chain='Swiss Garden', stars=4)
        for name, wd, we in [
            ('Deluxe Room',         260, 300),
            ('Executive 2 Bedroom', 350, 400),
            ('Premier 2 Bedroom',   450, 500),
        ]:
            pax = 4 if '2 Bedroom' in name else 2
            cat = self.category(h, name=name, pax=pax, max_occupancy=pax)
            self.rate(cat, tier='fit', day_type='weekday', base_rate=wd, extra_bed=150, kid_bf=30)
            self.rate(cat, tier='fit', day_type='weekend', base_rate=we, extra_bed=150, kid_bf=30)

    def import_resort_world_genting(self):
        h = self.hotel(name='Resort World Genting Highland', city_key='GENTING', chain='Resort World', stars=5)
        # Package rooms (each is_package=True with inclusions)
        packages = [
            # name, price, breakfast_pax, has_skyway
            ('Standard Tower 1',     200, 2, True),
            ('Deluxe Tower 2',       200, 2, True),
            ('Y5 Deluxe Tower 3',    261, 2, True),
            ('Y5 Triple Tower 3',    318, 3, True),
            ('Superior Deluxe Tower 2', 367, 2, False),
        ]
        for name, p, bf_pax, has_skyway in packages:
            pax = 3 if 'Triple' in name else 2
            cat = self.category(h, name=name, base_type='package', is_package=True, pax=pax, max_occupancy=pax)
            self.rate(cat, tier='fit', base_rate=p)
            self.inclusion(cat, label='Night Stay', quantity=1, unit='night', sort_order=0)
            self.inclusion(cat, label='Buffet Breakfast', quantity=bf_pax, unit='pax', sort_order=1)
            if has_skyway:
                self.inclusion(cat, label='Return Skyway Transfer', quantity=bf_pax, unit='pax', sort_order=2)

        # Surcharges
        # +RM100 every Saturday
        self.surcharge(h, name='Saturday Surcharge', amount=100, weekday=5)
        # +RM100 specific dates
        peak_dates_100 = [
            (date(2026, 5, 1),   '1 May 2026'),
            (date(2026, 5, 31),  '31 May 2026'),
            (date(2026, 11, 8),  '8 Nov 2026'),
            (date(2026, 12, 25), '25 Dec 2026'),
            (date(2026, 12, 31), '31 Dec 2026'),
            (date(2027, 1, 1),   '1 Jan 2027'),
        ]
        for d, label in peak_dates_100:
            self.surcharge(h, name=f'Peak Date Surcharge — {label}', amount=100, date_start=d, date_end=d)
        # +RM250 CNY range
        self.surcharge(h, name='CNY Peak Surcharge', amount=250, date_start=date(2027, 2, 6), date_end=date(2027, 2, 10))
        # +RM250 Hari Raya range
        self.surcharge(h, name='Hari Raya Peak Surcharge', amount=250, date_start=date(2027, 3, 10), date_end=date(2027, 3, 12))

    # ═══════════════════════════════════════════════════════
    # TERENGGANU
    # ═══════════════════════════════════════════════════════

    def import_resort_world_kijal(self):
        h = self.hotel(name='Resort World Kijal Terengganu Beachfront', city_key='TERENGGANU', chain='Resort World', stars=4)
        for name, view, wd, we in [
            ('Deluxe Room',     'standard', 270, 320),
            ('Premier Seaview', 'sea',      348, 398),
        ]:
            cat = self.category(h, name=name, view_type=view)
            self.rate(cat, tier='fit', day_type='weekday', base_rate=wd, extra_bed=150, kid_bf=30, tax_inclusive=False)
            self.rate(cat, tier='fit', day_type='weekend', base_rate=we, extra_bed=150, kid_bf=30, tax_inclusive=False)
