# apps/locations/management/commands/import_geonames.py
"""
Management command to import countries + cities from GeoNames.

Usage:
    python manage.py import_geonames                  # download + import all
    python manage.py import_geonames --countries-only # only countries
    python manage.py import_geonames --min-pop 5000   # only cities with pop >= 5000
"""

import csv
import io
import os
import time
import zipfile
import urllib.request
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings

from apps.locations.models import Country, City


# ─── GeoNames URLs ───────────────────────────────────────────

GEONAMES_BASE         = 'http://download.geonames.org/export/dump'
COUNTRY_INFO_URL      = f'{GEONAMES_BASE}/countryInfo.txt'
CITIES_1000_URL       = f'{GEONAMES_BASE}/cities1000.zip'
ALTERNATE_NAMES_URL   = f'{GEONAMES_BASE}/alternateNamesV2.zip'  # للأسماء العربية

# ─── Continent mapping ───────────────────────────────────────

CONTINENT_NAMES = {
    'AF': 'Africa', 'AS': 'Asia', 'EU': 'Europe',
    'NA': 'North America', 'SA': 'South America',
    'OC': 'Oceania', 'AN': 'Antarctica',
}

# ─── Helper: download file ───────────────────────────────────

def download_file(url, dest):
    """تحميل ملف مع progress bar."""
    print(f'  📥 Downloading {url.split("/")[-1]}...')
    
    def reporthook(chunk, size, total):
        if total > 0:
            pct = min(100, chunk * size * 100 // total)
            mb_done  = chunk * size / 1024 / 1024
            mb_total = total / 1024 / 1024
            print(f'     {pct}% ({mb_done:.1f} / {mb_total:.1f} MB)', end='\r')
    
    urllib.request.urlretrieve(url, dest, reporthook=reporthook)
    print()
    return dest


# ─── Main Command ────────────────────────────────────────────

class Command(BaseCommand):
    help = 'Import countries and cities from GeoNames'

    def add_arguments(self, parser):
        parser.add_argument('--countries-only', action='store_true',
                            help='Import only countries, skip cities')
        parser.add_argument('--min-pop', type=int, default=1000,
                            help='Minimum city population (default: 1000)')
        parser.add_argument('--data-dir', default='/tmp/geonames',
                            help='Directory for downloaded files')

    def handle(self, *args, **opts):
        data_dir = opts['data_dir']
        os.makedirs(data_dir, exist_ok=True)

        # ─── 1. Countries ───────────────────────────────
        self.stdout.write(self.style.SUCCESS('\n═══ Step 1: Countries ═══'))
        country_file = os.path.join(data_dir, 'countryInfo.txt')
        if not os.path.exists(country_file):
            download_file(COUNTRY_INFO_URL, country_file)
        self.import_countries(country_file)

        if opts['countries_only']:
            self.stdout.write(self.style.SUCCESS('\n✅ Done (countries only).'))
            return

        # ─── 2. Cities ──────────────────────────────────
        self.stdout.write(self.style.SUCCESS('\n═══ Step 2: Cities ═══'))
        cities_zip = os.path.join(data_dir, 'cities1000.zip')
        if not os.path.exists(cities_zip):
            download_file(CITIES_1000_URL, cities_zip)
        self.import_cities(cities_zip, min_pop=opts['min_pop'])

        self.stdout.write(self.style.SUCCESS('\n🎉 All done!'))

    # ─── Countries ──────────────────────────────────────

    def import_countries(self, path):
        """
        Parse countryInfo.txt — format (tab-separated):
        #ISO  ISO3  ISO-Numeric  fips  Country  Capital  Area(in sq km)  Population  Continent  tld  CurrencyCode  ...
        """
        count = 0
        with open(path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.startswith('#') or not line.strip():
                    continue
                parts = line.strip().split('\t')
                if len(parts) < 17:
                    continue
                
                iso2       = parts[0].strip()
                iso3       = parts[1].strip()
                country_en = parts[4].strip()
                continent  = parts[8].strip()
                phone_code = parts[12].strip()
                geoname_id = parts[16].strip()

                if not iso2 or not country_en:
                    continue

                # Arabic translation (بسيط — سنضيف GeoNames alternateNames لاحقاً)
                # الآن فقط الإنجليزي كـ name_ar placeholder
                Country.objects.update_or_create(
                    iso2=iso2,
                    defaults={
                        'name'      : country_en,
                        'name_en'   : country_en,
                        'name_ar'   : country_en,  # سنُحدّثها من alternateNames
                        'iso3'      : iso3,
                        'phone_code': (f'+{phone_code}' if phone_code else '')[:50],
                        'continent' : continent,
                        'geoname_id': int(geoname_id) if geoname_id.isdigit() else None,
                    }
                )
                count += 1
                if count % 50 == 0:
                    print(f'  {count} countries...', end='\r')
        
        self.stdout.write(self.style.SUCCESS(f'  ✅ {count} countries imported'))

    # ─── Cities ─────────────────────────────────────────

    def import_cities(self, zip_path, min_pop=1000):
        """
        Parse cities1000.txt — format (tab-separated):
        geonameid  name  asciiname  alternatenames  latitude  longitude  
        feature_class  feature_code  country_code  cc2  admin1_code  admin2_code  
        admin3_code  admin4_code  population  elevation  dem  timezone  modification_date
        """
        # Pre-load countries by iso2 for speed
        countries = {c.iso2: c for c in Country.objects.exclude(iso2='').only('id', 'iso2')}
        
        count   = 0
        skipped = 0
        batch   = []
        BATCH_SIZE = 5000

        with zipfile.ZipFile(zip_path) as z:
            with z.open('cities1000.txt') as raw:
                text = io.TextIOWrapper(raw, encoding='utf-8', newline='')
                reader = csv.reader(text, delimiter='\t')
                
                for row in reader:
                    if len(row) < 19:
                        continue
                    
                    try:
                        geonameid     = int(row[0])
                        name          = row[1].strip()
                        asciiname     = row[2].strip()
                        latitude      = row[4].strip()
                        longitude     = row[5].strip()
                        country_code  = row[8].strip()
                        admin1_code   = row[10].strip()
                        population    = int(row[14] or 0)
                    except (ValueError, IndexError):
                        skipped += 1
                        continue
                    
                    if population < min_pop:
                        skipped += 1
                        continue
                    
                    country = countries.get(country_code)
                    if not country:
                        skipped += 1
                        continue
                    
                    batch.append(City(
                        country=country,
                        name=name,
                        name_en=asciiname,
                        name_ar=name,  # placeholder — GeoNames يدعم i18n لاحقاً
                        admin1=admin1_code,
                        latitude=latitude if latitude else None,
                        longitude=longitude if longitude else None,
                        population=population,
                        geoname_id=geonameid,
                    ))
                    count += 1
                    
                    if len(batch) >= BATCH_SIZE:
                        City.objects.bulk_create(batch, ignore_conflicts=True)
                        print(f'  {count} cities imported, {skipped} skipped...', end='\r')
                        batch = []
                
                # Last batch
                if batch:
                    City.objects.bulk_create(batch, ignore_conflicts=True)
        
        self.stdout.write(self.style.SUCCESS(
            f'  ✅ {count} cities imported ({skipped} skipped, min_pop={min_pop})'
        ))
