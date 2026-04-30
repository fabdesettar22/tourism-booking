# You Need Travel — CLAUDE.md
# السياق الكامل للمشروع من الصفر إلى آخر حالة

## 🚀 كيف تبدأ في Claude Code
```bash
cd ~/Desktop/tourism_booking
source venv/bin/activate
python manage.py runserver          # Backend على port 8000
cd frontend && npm run dev          # Frontend على port 5173
```

---

## 1. هوية المشروع

| الخاصية | القيمة |
|---|---|
| **الاسم** | You Need Travel |
| **النطاق** | `mybridge.my` |
| **النوع** | B2B2C Travel Platform — ماليزيا |
| **المرحلة** | MVP |
| **Backend** | Django 6.x + DRF + PostgreSQL 16 + SimpleJWT + Celery |
| **Frontend** | React + TypeScript + Vite + Tailwind CSS |
| **DB** | PostgreSQL — `tourism_db` / user: `tourism_user` / pass: `tourism_pass_2026` |
| **Email** | Hostinger Business Email — `smtp.hostinger.com:587` STARTTLS |
| **المسار المحلي** | `~/Desktop/tourism_booking` |
| **GitHub** | `https://github.com/fabdesettar22/tourism-booking.git` |
| **i18n** | ar / en / ms — مع دعم RTL كامل |

### الأطراف الثلاثة
1. **HQ** = "You Need Travel" (الوكالة الأم — أنت)
2. **Partner Agencies** = وكالات شريكة (كل واحدة tenant مستقل)
3. **End Customer** = السائح النهائي

---

## 2. بروتوكول التواصل (يجب الالتزام به دائماً)

- **لا مقدمات، لا حشو.** تصرف كمهندس برمجيات محترف.
- **اعتراض فوري** إن كان الحل يخل بالسلامة المحاسبية أو معمارية العزل → `## اعتراض تقني قبل البدء`
- **Schema Diagram أولاً** (ASCII) قبل أي كود.
- **الكود الكامل** — لا snippets، لا `# ... rest of code`.
- **لغة التواصل:** العربية للشرح، الإنجليزية للكود.
- **اسأل قبل كتابة View:** method، path، auth، input، output، status codes.

---

## 3. الضوابط الحتمية (Non-Negotiable)

```
❌ FloatField للأسعار           → ✅ DecimalField(max_digits=12, decimal_places=2)
❌ بدون currency field          → ✅ كل صف مالي يحمل currency صريح (ISO 4217)
❌ N+1 queries                  → ✅ select_related / prefetch_related دائماً
❌ منطق في View                 → ✅ كل شيء في services.py
❌ ORM مباشرة في View           → ✅ استدعاء service فقط
❌ CASCADE على FK للـ Tenant    → ✅ PROTECT
❌ django-tenants                → ✅ Shared DB + tenant_id FK
```

**العملات المدعومة:** MYR (افتراضي), USD, SAR, AED, SGD, EUR

---

## 4. هيكل المشروع

```
tourism_booking/
├── apps/
│   ├── accounts/           # User, Auth, JWT
│   ├── advertising/        # SponsoredHotelCard
│   ├── agencies/           # Agency business logic
│   ├── bookings/           # Booking, BookingItem ❌ لم يُبنَ
│   ├── hero_hotels/        # Featured hotels على Homepage
│   ├── hotels/             # Hotel + HotelPhoto ✅
│   ├── locations/          # Country (252), City (144,827)
│   ├── notifications/      # Email/SMS/push
│   ├── packages/           # Package, PackageItem ❌ لم يُبنَ
│   ├── pricing/            # 3-layer markup ❌ لم يُبنَ
│   ├── providers/          # GDS integrations (مستقبلي)
│   ├── rooms/              # Room types ❌ لم يُبنَ
│   ├── services/           # Service + ServiceCategory + ServicePhoto ✅
│   ├── settings_app/       # Runtime settings
│   ├── suppliers/          # Supplier onboarding (signal مُعطَّل)
│   ├── waitlist/           # ✅ مكتمل بالكامل (7 أنواع)
│   └── waitlist_agency/    # Agency waitlist
├── config/
│   ├── settings.py
│   ├── urls.py
│   └── celery.py
├── core/                   # ❌ لم يُبنَ (TenantAwareManager, TenantMiddleware)
├── tenants/                # Tenant, TenantConfiguration, TenantAwareModel
└── frontend/src/
    ├── features/           # hotels, services, advertising, destinations, tours...
    ├── pages/              # public, admin, auth, waitlist
    ├── i18n/               # translations (ar/en/ms)
    ├── hooks/              # useLanguage (RTL switcher)
    └── components/
        ├── admin/
        │   └── ActivationCard.tsx  ✅ مكوّن تفعيل الخدمة مع العمولة
        └── forms/
            └── CountryCityPicker.tsx  ✅ قائمة منسدلة للدول/المدن
```

---

## 5. Migrations المُطبَّقة حتى الآن

```
accounts: 0001_initial
advertising: 0001, 0002
hotels: 0001-0005 (0004: commission_percentage, 0005: HotelPhoto)
locations: 0001-0002 (252 دولة، 144,827 مدينة)
services: 0001-0005 (0003: nullable fields, 0004: commission_percentage, 0005: ServicePhoto)
suppliers: 0001-0003
waitlist: 0001-0007 (0007: WaitlistPhoto)
```

---

## 6. نظام Waitlist → Auto-Creation (القلب الأساسي للمشروع)

### التدفق الكامل:
```
المورد يسجّل من نموذج التسجيل
  ↓ يختار الدولة/المدينة من قائمة منسدلة (country_ref, city_ref)
  ↓ يُدخل أسعاره (حسب النوع)
  ↓ يرفع صوراً متعددة + يحدد الصورة الرئيسية
  ↓ يكتب وصفاً
  ↓ POST /api/v1/waitlist/{type}/
  ↓ يصله إيميل تأكيد
       ↓
أنت تراجع الطلب في لوحة التحكم
  ↓ POST /api/v1/waitlist/admin/{type}/{id}/approve/
       ↓ (تلقائياً — Signal)
Hotel أو Service يُنشأ (is_active=False)
الصور تُنسَخ إلى HotelPhoto/ServicePhoto
       ↓
أنت تحدد عمولتك (commission_percentage)
  ↓ PATCH /api/v1/hotels/{id}/ أو /api/v1/services/{id}/
       ↓
تضغط "تفعيل"
  ↓ POST /api/v1/hotels/{id}/activate/
       ↓ (يتحقق: image + description + commission موجودة)
السعر النهائي = base_price + (base_price × commission%)
يظهر للسائح
```

### أنواع الـ Waitlist (7 أنواع):
| النوع | Model | حقول السعر | الـ Service Type |
|---|---|---|---|
| `property` | `PropertyWaitlist` | — (عبر الغرف لاحقاً) | → `Hotel` |
| `transport` | `TransportWaitlist` | price_airport_transfer, price_hourly, price_intercity, price_full_day | → `Service(transport)` |
| `restaurant` | `RestaurantWaitlist` | price_per_person, price_set_menu | → `Service(meal)` |
| `guide` | `GuideWaitlist` | price_half_day, price_full_day, price_hourly | → `Service(tour)` |
| `activity` | `ActivityWaitlist` | price_per_person, price_per_group, min_group_size | → `Service(activity)` |
| `wellness` | `WellnessWaitlist` | price_per_session, session_duration_min, price_package | → `Service(other)` |
| `other` | `OtherServiceWaitlist` | base_price, price_unit, pricing_notes | → `Service(other)` |

---

## 7. حقول مهمة في كل Model

### WaitlistBase (أب مشترك):
```python
id = UUIDField(primary_key=True)
ref_number = CharField  # مثلاً: MYB-PRO-311429
supplier_type = CharField(choices=SupplierType)
status = CharField(choices=['PENDING','APPROVED','REJECTED'])
country_ref = FK('locations.Country', PROTECT, null=True)
city_ref = FK('locations.City', PROTECT, null=True)
currency = CharField(default='MYR')
```

### PropertyWaitlist (إضافي):
```python
created_hotel = OneToOneField('hotels.Hotel', SET_NULL, null=True)
property_type, rooms_count, star_rating, listed_online
```

### كل Waitlist خدمة (إضافي):
```python
created_service = OneToOneField('services.Service', SET_NULL, null=True)
# + حقول السعر الخاصة بكل نوع
```

### Hotel:
```python
city = FK('locations.City', CASCADE)
name, address, stars (1-5, default=3)
description, image (الصورة الرئيسية)
commission_percentage = DecimalField(null=True)
is_active = BooleanField(default=False)
# Properties محسوبة:
is_ready_for_activation  # = image AND description AND commission
missing_for_activation   # ['image', 'description', 'commission_percentage']
```

### Service:
```python
city = FK('locations.City', CASCADE)
category = FK('ServiceCategory', SET_NULL, null=True)
name, description, image
service_type = CharField(choices=['transport','tour','activity','meal','other'...])
base_price = DecimalField(null=True)
currency = CharField(default='MYR')
commission_percentage = DecimalField(null=True)
is_active = BooleanField(default=False)
# Properties محسوبة:
commission_amount  # = base_price * commission% / 100
final_price        # = base_price + commission_amount
is_ready_for_activation
missing_for_activation
```

### WaitlistPhoto:
```python
content_type = FK(ContentType)  # GenericFK
object_id = UUIDField           # أي Waitlist
image = ImageField(upload_to='waitlist/photos/%Y/%m/')
is_primary = BooleanField(default=False)
order = PositiveSmallIntegerField(default=0)
caption = CharField(blank=True)
```

### HotelPhoto / ServicePhoto:
```python
hotel/service = FK(Hotel/Service, CASCADE)
image = ImageField
is_primary = BooleanField  # عند الحفظ، يُحدَّث Hotel/Service.image
order, caption, uploaded_at
```

---

## 8. APIs الجاهزة

### Locations (Public — AllowAny):
```
GET /api/v1/locations/countries/                    # 252 دولة
GET /api/v1/locations/countries/?search=malaysia
GET /api/v1/locations/cities/?country_code=MY       # مدن الدولة
GET /api/v1/locations/cities/?country_code=MY&q=kua # autocomplete
GET /api/v1/locations/cities/?country_id=161
```

### Waitlist (Public — AllowAny):
```
POST /api/v1/waitlist/property/
POST /api/v1/waitlist/transport/
POST /api/v1/waitlist/restaurant/
POST /api/v1/waitlist/guide/
POST /api/v1/waitlist/activity/
POST /api/v1/waitlist/wellness/
POST /api/v1/waitlist/other/
```

### Waitlist Photos (Public — AllowAny):
```
POST   /api/v1/waitlist/photos/upload/
GET    /api/v1/waitlist/photos/?content_type=propertywaitlist&object_id={uuid}
DELETE /api/v1/waitlist/photos/{id}/delete/
POST   /api/v1/waitlist/photos/{id}/set-primary/
```

### Waitlist Admin (IsAdminUser):
```
GET  /api/v1/waitlist/admin/pending/
POST /api/v1/waitlist/admin/{type}/{uuid}/approve/
POST /api/v1/waitlist/admin/{type}/{uuid}/reject/
```

### Hotels (IsAuthenticated / IsAdminUser):
```
GET    /api/v1/hotels/              # list
POST   /api/v1/hotels/              # create
GET    /api/v1/hotels/{id}/         # detail
PATCH  /api/v1/hotels/{id}/         # update (commission_percentage هنا)
POST   /api/v1/hotels/{id}/activate/
POST   /api/v1/hotels/{id}/deactivate/
```

### Services (IsAuthenticated / IsAdminUser):
```
GET    /api/v1/services/
GET    /api/v1/services/?city=&category=&service_type=
POST   /api/v1/services/
PATCH  /api/v1/services/{id}/
POST   /api/v1/services/{id}/activate/
POST   /api/v1/services/{id}/deactivate/
GET    /api/v1/services/categories/
```

---

## 9. Signals الموجودة (apps/waitlist/signals.py)

```python
# PropertyWaitlist → Hotel
pre_save:  track_old_status (dispatch_uid='waitlist_property_track_old_status')
post_save: create_hotel_on_approval (dispatch_uid='waitlist_property_create_hotel_on_approval')

# TransportWaitlist → Service(transport)
pre_save + post_save: transport_track_old_status / transport_create_service_on_approval

# RestaurantWaitlist → Service(meal)
# GuideWaitlist → Service(tour)
# ActivityWaitlist → Service(activity)
# WellnessWaitlist → Service(other)
# OtherServiceWaitlist → Service(other)

# دالة مساعدة لنقل الصور:
def _copy_waitlist_photos(waitlist_instance, 'hotel'|'service', target_obj)
```

**المنطق:** PENDING → APPROVED + city_ref موجود → ينشئ Hotel/Service + ينقل WaitlistPhoto → HotelPhoto/ServicePhoto

---

## 10. ServiceCategories (6 فئات افتراضية في DB):
```
transport  / restaurant / guide / activity / wellness / other
```

---

## 11. Frontend — المكوّنات الجاهزة

```
frontend/src/
├── pages/waitlist/WaitlistFormPage.tsx   # 853 سطر — نموذج التسجيل الكامل
│   ├── SUBTYPES config (7 أنواع، 17 حقل سعر)
│   ├── CountryCityPicker (قائمة منسدلة)
│   ├── حقول الأسعار حسب النوع
│   └── WaitlistPhotoUploader (رفع صور متعددة بعد الإرسال)
│
├── pages/waitlist/SupplierTypePage.tsx   # صفحة اختيار نوع المورد
│
├── features/hotels/HotelsManagement.tsx  # 739 سطر — لوحة إدارة الفنادق
│   └── ActivationCard مُدمَج في كل بطاقة
│
├── features/tours/ServicesManagement.tsx # 965 سطر — لوحة إدارة الخدمات
│   └── ActivationCard مُدمَج في كل بطاقة
│
└── components/
    ├── admin/ActivationCard.tsx          # 267 سطر — مكوّن العمولة والتفعيل
    └── forms/CountryCityPicker.tsx       # 401 سطر — قائمة منسدلة 3 لغات
```

### ActivationCard Props:
```tsx
<ActivationCard
  itemId={hotel.id}          // ID الفندق أو الخدمة
  itemType="hotel"|"service"
  isActive={bool}
  basePrice={number|null}    // للخدمات فقط
  currency="MYR"
  commissionPercentage={number|null}
  isReadyForActivation={bool}
  missingForActivation={string[]}  // ['image','description','commission_percentage']
  onUpdate={() => {}}        // callback بعد التحديث
  lang="ar"|"en"|"ms"
/>
```

---

## 12. حالة التطوير (April 2026)

### ✅ مكتمل بالكامل:

**Backend:**
- Waitlist: 7 models + 7 serializers + signals + views + URLs
- أسعار متعددة لكل نوع (17 حقل سعر إجمالاً)
- country_ref + city_ref (FK صحيح لا نص حر) على كل الـ Waitlists
- created_hotel / created_service (OneToOne) على كل الـ Waitlists
- Signal ذكي: PENDING→APPROVED → ينشئ Hotel/Service تلقائياً
- Signal ينقل الصور تلقائياً (WaitlistPhoto → HotelPhoto/ServicePhoto)
- Hotel: commission_percentage + properties محسوبة + activate/deactivate
- Service: commission_percentage + properties محسوبة + activate/deactivate
- WaitlistPhoto: GenericFK + upload/delete/set-primary APIs
- HotelPhoto: جدول صور الفنادق الدائمة
- ServicePhoto: جدول صور الخدمات الدائمة
- Locations: CountryViewSet + CityViewSet (AllowAny, search, autocomplete)
- ActivationCard.tsx: مكوّن Frontend للعمولة والتفعيل
- Approve View: transaction.atomic + ValidationError handling

**Frontend:**
- WaitlistFormPage: قائمة منسدلة للدول/المدن + حقول الأسعار + رفع الصور
- HotelsManagement + ServicesManagement: ActivationCard مُدمَج
- i18n: 3 لغات (ar/en/ms) مع RTL كامل

**Git:**
- Commit: `057e893a` (feat(photos): multi-photo upload system)
- كل الكود على GitHub

### ❌ لم يُبنَ بعد (بالأولوية):

1. **صفحة العرض للسائح** — عرض الفنادق والخدمات المُفعَّلة للعموم
2. **Gallery في صفحة التفاصيل** — عرض صور متعددة للسائح
3. **حقل وصف في نموذج التسجيل** — المورد يكتب وصفاً أثناء التسجيل
4. **Multi-tenancy layer** — `core/managers.py`, `core/middleware.py`
5. **JWT مع tenant_id claim** — Custom token serializer
6. **Booking domain** — Customer, Booking, BookingItem
7. **Financial domain** — Wallet, Invoice, Payment, AuditLog
8. **Pricing service** — 3-layer calculation
9. **Featured Hotels layer** — projection على Hotel
10. **Email migration** — Hostinger Business Email (port 587 STARTTLS)

---

## 13. قرارات معمارية محسومة

| القرار | السبب |
|---|---|
| Shared DB + tenant_id FK (لا django-tenants) | HQ يحتاج cross-tenant queries للإحصائيات |
| is_active=False عند إنشاء Hotel/Service | يجبر الأدمن على المراجعة قبل الظهور للسائح |
| commission_percentage على كل Hotel/Service | المرونة: كل مورد له عمولة مختلفة |
| شرط (image + description + commission) للتفعيل | يضمن جودة المحتوى للسائح |
| WaitlistPhoto GenericFK (لا 7 جداول) | يوفر جدولاً واحداً لكل أنواع الـ Waitlist |
| AllowAny على photo upload | المورد لا يملك حساباً — يرفع الصور أثناء التسجيل |
| PropertyWaitlist.city_ref إجباري للموافقة | يمنع إنشاء فنادق بدون ربط جغرافي صحيح |

---

## 14. معلومات DB

```bash
# اتصال:
psql -U tourism_user -d tourism_db

# جداول مهمة:
waitlist_property      # PropertyWaitlist
waitlist_transport     # TransportWaitlist
waitlist_restaurant    # RestaurantWaitlist
waitlist_guide         # GuideWaitlist
waitlist_activity      # ActivityWaitlist
waitlist_wellness      # WellnessWaitlist
waitlist_other         # OtherServiceWaitlist
waitlist_photo         # WaitlistPhoto (GenericFK)
hotels_hotel           # Hotel
hotel_photo            # HotelPhoto
services_service       # Service
service_photo          # ServicePhoto
services_servicecategory  # 6 فئات: transport/restaurant/guide/activity/wellness/other
locations_country      # 252 دولة
locations_city         # 144,827 مدينة
```

---

## 15. خصوصيات ماليزيا

| المعرّف | الوصف |
|---|---|
| SSM | رقم تسجيل الشركة (`Tenant.ssm_registration_no`) |
| MOTAC | رخصة وزارة السياحة (`Tenant.motac_license_no`) |
| SST | رقم ضريبي (`Tenant.sst_number`) |
| APAD | رخصة النقل |
| JAKIM | شهادة حلال |

- Timezone: `Asia/Kuala_Lumpur`
- العملة الافتراضية: `MYR`

---

## 16. Enums المهمة في Waitlist

```python
RestaurantType: TRADITIONAL, CAFE, FAST_FOOD, BUFFET, FLOATING, HEALTHY, ASIAN, GRILLS, ENTERTAINMENT
GuideSpecialty: GENERAL, NATURE, HISTORICAL, DIVING, FOOD, PHOTOGRAPHY, HALAL
ActivityType: DIVING, CLIMBING, THEME_PARK, SPORTS, CULTURAL, YOGA, CYCLING, FISHING, ECO_TOURISM
WellnessType: SPA, SALON, YOGA_CENTER, GYM, ALTERNATIVE, HAMMAM, NUTRITION
OtherServiceType: PHOTOGRAPHY, EVENTS, SHOPPING, RELIGIOUS, MEDICAL, EDUCATIONAL, PROTOCOL
TransportType: BUS, PRIVATE_CAR, MINIBUS, HELICOPTER, BOAT, FERRY, MOTORCYCLE, TAXI
PropertyType: HOTEL, GUESTHOUSE, BED_BREAKFAST, HOMESTAY, HOSTEL, CONDO_HOTEL, RESORT, CAPSULE_HOTEL, FLOATING, MOTEL
```

---

## 17. ContentType Names للصور

```python
# عند رفع صورة لـ Waitlist معيّن:
content_type_map = {
    'property':   'propertywaitlist',
    'transport':  'transportwaitlist',
    'restaurant': 'restaurantwaitlist',
    'guide':      'guidewaitlist',
    'activity':   'activitywaitlist',
    'wellness':   'wellnesswaitlist',
    'other':      'otherservicewaitlist',
}
```

---

## 18. اختبار سريع (من Shell)

```python
# اختبار الموافقة على PropertyWaitlist:
from apps.waitlist.models import PropertyWaitlist
from apps.locations.models import Country, City
from decimal import Decimal

malaysia = Country.objects.get(iso2='MY')
kl = City.objects.filter(country=malaysia, name__icontains='kuala lumpur').first()

p = PropertyWaitlist.objects.create(
    supplier_type='PROPERTY',
    full_name='test', email='t@t.com', phone='+60123456789',
    company_name='Test Hotel',
    country='Malaysia', country_code='MY', city='KL',
    sync_mode='MANUAL', property_type='HOTEL',
    country_ref=malaysia, city_ref=kl,
)
p.status = 'APPROVED'
p.save()
p.refresh_from_db()
print(p.created_hotel)  # يجب أن يكون Hotel object
```

---

## 19. قائمة المراجعة عند إضافة Feature جديدة

1. هل تخص وكالة محددة؟ → `TenantAwareModel`
2. حقول مالية؟ → `Decimal` + `currency`
3. ارسم Schema Diagram
4. اكتب Models (كامل الملف)
5. أضف indexes
6. اسأل عن تفاصيل كل endpoint
7. اكتب Serializer (validation فقط)
8. اكتب Service (`@transaction.atomic`)
9. اكتب View (thin)
10. أضف URLs
11. سجّل في admin.py
12. أضف AuditLog (إن كان جدول مالي)
13. اكتب قائمة اختبار يدوي

---

**آخر commit:** `057e893a` — feat(photos): multi-photo upload system
**آخر تحديث:** April 30, 2026
