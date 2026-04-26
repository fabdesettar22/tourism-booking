# apps/locations/management/commands/import_cities_arabic.py
"""
Update City.name_ar with Arabic names from GeoNames alternateNamesV2.

Usage:
    python manage.py import_cities_arabic
    python manage.py import_cities_arabic --skip-download  # if already downloaded

Memory-efficient: streams the file, never loads it all.
"""

import os
import csv
import io
import zipfile
import urllib.request
from django.core.management.base import BaseCommand
from apps.locations.models import City, Country


GEONAMES_URL = 'http://download.geonames.org/export/dump/alternateNamesV2.zip'


def download_file(url, dest):
    """Download with progress bar."""
    print(f'  📥 Downloading {url.split("/")[-1]}...')
    print(f'     ⚠️  Large file (~400 MB) — be patient...')
    
    last_pct = [-1]
    def reporthook(chunk, size, total):
        if total > 0:
            pct = min(100, chunk * size * 100 // total)
            if pct != last_pct[0] and pct % 5 == 0:  # كل 5%
                mb_done  = chunk * size / 1024 / 1024
                mb_total = total / 1024 / 1024
                print(f'     {pct}% ({mb_done:.0f} / {mb_total:.0f} MB)')
                last_pct[0] = pct
    
    urllib.request.urlretrieve(url, dest, reporthook=reporthook)
    print('  ✅ Download complete')
    return dest


class Command(BaseCommand):
    help = 'Import Arabic names for cities + countries from GeoNames alternateNamesV2'

    def add_arguments(self, parser):
        parser.add_argument('--skip-download', action='store_true',
                            help='Skip download (use existing file)')
        parser.add_argument('--data-dir', default='/tmp/geonames',
                            help='Directory for downloaded files')

    def handle(self, *args, **opts):
        data_dir  = opts['data_dir']
        os.makedirs(data_dir, exist_ok=True)
        zip_path  = os.path.join(data_dir, 'alternateNamesV2.zip')

        # ─── 1. Download ────────────────────────────────
        if not opts['skip_download'] or not os.path.exists(zip_path):
            self.stdout.write(self.style.SUCCESS('\n═══ Step 1: Download alternateNamesV2.zip ═══'))
            download_file(GEONAMES_URL, zip_path)

        # ─── 2. Build geoname_id → arabic_name dict ─────
        self.stdout.write(self.style.SUCCESS('\n═══ Step 2: Extract Arabic names ═══'))
        
        # نجمع الأسماء العربية لكل geoname_id
        # نُفضّل: isPreferredName (col 4) > بقية
        ar_names = {}      # geoname_id (int) → arabic name
        ar_preferred = {}  # geoname_id → has preferred Arabic? (للـ priority)
        
        scanned = 0
        found   = 0
        
        with zipfile.ZipFile(zip_path) as z:
            with z.open('alternateNamesV2.txt') as raw:
                text = io.TextIOWrapper(raw, encoding='utf-8', newline='')
                reader = csv.reader(text, delimiter='\t')
                
                for row in reader:
                    scanned += 1
                    if scanned % 500000 == 0:
                        print(f'  {scanned:,} rows scanned, {found:,} Arabic names found...', end='\r')
                    
                    if len(row) < 4:
                        continue
                    
                    try:
                        geoname_id    = int(row[1])
                        isolanguage   = row[2].strip()
                        name          = row[3].strip()
                        is_preferred  = (len(row) > 4 and row[4].strip() == '1')
                        is_historic   = (len(row) > 7 and row[7].strip() == '1')
                    except (ValueError, IndexError):
                        continue
                    
                    # نريد فقط العربية، غير تاريخية
                    if isolanguage != 'ar' or is_historic or not name:
                        continue
                    
                    # إن لم يوجد اسم بعد، أضفه
                    # إن وُجد، استبدله فقط إذا الجديد preferred والقديم ليس
                    if geoname_id not in ar_names:
                        ar_names[geoname_id]      = name
                        ar_preferred[geoname_id]  = is_preferred
                        found += 1
                    elif is_preferred and not ar_preferred.get(geoname_id, False):
                        ar_names[geoname_id]      = name
                        ar_preferred[geoname_id]  = True
        
        print()
        self.stdout.write(self.style.SUCCESS(
            f'  ✅ {scanned:,} rows scanned, {len(ar_names):,} unique Arabic names extracted'
        ))

        # ─── 3. Update Cities ───────────────────────────
        self.stdout.write(self.style.SUCCESS('\n═══ Step 3: Update Cities ═══'))
        
        BATCH_SIZE = 5000
        updated_cities = 0
        batch = []
        
        cities_with_geoname = City.objects.exclude(geoname_id__isnull=True).only('id', 'geoname_id', 'name_ar')
        total_cities = cities_with_geoname.count()
        
        for city in cities_with_geoname.iterator(chunk_size=5000):
            ar = ar_names.get(city.geoname_id)
            if ar and ar != city.name_ar:
                city.name_ar = ar
                batch.append(city)
                
                if len(batch) >= BATCH_SIZE:
                    City.objects.bulk_update(batch, ['name_ar'])
                    updated_cities += len(batch)
                    print(f'  {updated_cities:,} / {total_cities:,} cities updated...', end='\r')
                    batch = []
        
        if batch:
            City.objects.bulk_update(batch, ['name_ar'])
            updated_cities += len(batch)
        
        print()
        self.stdout.write(self.style.SUCCESS(
            f'  ✅ {updated_cities:,} cities updated with Arabic names'
        ))

        # ─── 4. Update Countries (bonus) ────────────────
        self.stdout.write(self.style.SUCCESS('\n═══ Step 4: Update Countries (bonus) ═══'))
        
        updated_countries = 0
        countries_with_geoname = Country.objects.exclude(geoname_id__isnull=True)
        
        # نُحدّث فقط الدول التي لا تزال name_ar = name_en (أي لم تُترجم في step 1)
        for country in countries_with_geoname:
            ar = ar_names.get(country.geoname_id)
            if ar and country.name_ar == country.name_en:
                country.name_ar = ar
                country.save(update_fields=['name_ar'])
                updated_countries += 1
        
        self.stdout.write(self.style.SUCCESS(
            f'  ✅ {updated_countries} additional countries updated'
        ))

        self.stdout.write(self.style.SUCCESS('\n🎉 All done!'))
