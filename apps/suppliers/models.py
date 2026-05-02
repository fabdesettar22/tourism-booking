# apps/suppliers/models.py

import uuid
from django.db import models
from apps.accounts.models import User


# ═══════════════════════════════════════════════════════
# CHOICES
# ═══════════════════════════════════════════════════════

class SupplierType(models.TextChoices):
    PROPERTY    = "PROPERTY",    "عقارات"
    TRANSPORT   = "TRANSPORT",   "نقل"
    RESTAURANT  = "RESTAURANT",  "مطاعم"
    GUIDE       = "GUIDE",       "مرشد سياحي"
    ACTIVITY    = "ACTIVITY",    "أنشطة"
    WELLNESS    = "WELLNESS",    "صحة وعافية"
    HALAL       = "HALAL",       "خدمات حلال"
    AIRLINE     = "AIRLINE",     "شركة طيران"
    TOUR        = "TOUR",        "شركة جولات"


class SupplierStatus(models.TextChoices):
    PENDING   = "PENDING",   "معلق للمراجعة"
    APPROVED  = "APPROVED",  "معتمد"
    SUSPENDED = "SUSPENDED", "موقوف"
    REJECTED  = "REJECTED",  "مرفوض"


class ContentStatus(models.TextChoices):
    DRAFT          = "DRAFT",          "مسودة"
    PENDING_REVIEW = "PENDING_REVIEW", "بانتظار المراجعة"
    APPROVED       = "APPROVED",       "معتمد"
    REJECTED       = "REJECTED",       "مرفوض"


class Currency(models.TextChoices):
    MYR = "MYR", "Malaysian Ringgit"
    USD = "USD", "US Dollar"
    EUR = "EUR", "Euro"
    SGD = "SGD", "Singapore Dollar"
    AED = "AED", "UAE Dirham"
    SAR = "SAR", "Saudi Riyal"
    DZD = "DZD", "Algerian Dinar"


class HotelType(models.TextChoices):
    HOTEL         = "HOTEL",         "فندق"
    GUESTHOUSE    = "GUESTHOUSE",    "بيت ضيافة"
    BED_BREAKFAST = "BED_BREAKFAST", "Bed and Breakfast"
    HOMESTAY      = "HOMESTAY",      "Homestay"
    HOSTEL        = "HOSTEL",        "بيت شباب"
    CONDO_HOTEL   = "CONDO_HOTEL",   "شقة فندقية"
    CAPSULE_HOTEL = "CAPSULE_HOTEL", "فندق كبسول"
    COUNTRY_HOUSE = "COUNTRY_HOUSE", "بيت ريفي"
    FARM_STAY     = "FARM_STAY",     "مزرعة سياحية"
    INN           = "INN",           "نزل"
    MOTEL         = "MOTEL",         "موتيل"
    RESORT        = "RESORT",        "منتجع"
    RIAD          = "RIAD",          "رياض"
    LODGE         = "LODGE",         "لودج"
    FLOATING      = "FLOATING",      "بيت عائم"


class HotelsCount(models.TextChoices):
    SINGLE   = "SINGLE",   "فندق واحد"
    MULTIPLE = "MULTIPLE", "فنادق متعددة"


class BookingType(models.TextChoices):
    INSTANT = "INSTANT", "حجز فوري"
    REQUEST = "REQUEST", "طلب حجز"


class OwnerType(models.TextChoices):
    INDIVIDUAL = "INDIVIDUAL", "فرد"
    BUSINESS   = "BUSINESS",   "شركة"


class PetsPolicy(models.TextChoices):
    YES        = "YES",        "مسموح"
    ON_REQUEST = "ON_REQUEST", "عند الطلب"
    NO         = "NO",         "غير مسموح"


class ParkingType(models.TextChoices):
    FREE    = "FREE",    "مجاني"
    PAID    = "PAID",    "مدفوع"
    NO      = "NO",      "لا يوجد"


class ParkingLocation(models.TextChoices):
    ON_SITE  = "ON_SITE",  "في الموقع"
    OFF_SITE = "OFF_SITE", "خارج الموقع"


class RoomUnitType(models.TextChoices):
    TWIN         = "TWIN",         "توأم (Twin)"
    DOUBLE       = "DOUBLE",       "مزدوج (Double)"
    SINGLE       = "SINGLE",       "مفرد (Single)"
    TRIPLE       = "TRIPLE",       "ثلاثي (Triple)"
    QUAD         = "QUAD",         "رباعي (Quad)"
    SUITE        = "SUITE",        "جناح (Suite)"
    JUNIOR_SUITE = "JUNIOR_SUITE", "جناح صغير"
    FAMILY       = "FAMILY",       "عائلي (Family)"
    STUDIO       = "STUDIO",       "استوديو"
    DELUXE       = "DELUXE",       "ديلوكس"
    SUPERIOR     = "SUPERIOR",     "سوبيريور"
    CONNECTING   = "CONNECTING",   "غرفة متصلة"
    PENTHOUSE    = "PENTHOUSE",    "بنتهاوس"


class BedType(models.TextChoices):
    SINGLE   = "SINGLE",   "سرير مفرد (35-51 بوصة)"
    FULL     = "FULL",     "سرير كامل (52-59 بوصة)"
    QUEEN    = "QUEEN",    "سرير كوين (60-70 بوصة)"
    KING     = "KING",     "سرير كينج (71-81 بوصة)"
    BUNK     = "BUNK",     "سرير بطابقين"
    SOFA_BED = "SOFA_BED", "أريكة سرير"
    FUTON    = "FUTON",    "سرير فوتون"


class PricePlanType(models.TextChoices):
    STANDARD       = "STANDARD",       "قياسي"
    NON_REFUNDABLE = "NON_REFUNDABLE", "غير قابل للاسترداد"
    WEEKLY         = "WEEKLY",         "أسبوعي"


class CancellationFeeType(models.TextChoices):
    FIRST_NIGHT = "FIRST_NIGHT", "تكلفة الليلة الأولى"
    FULL_AMOUNT = "FULL_AMOUNT", "100% من السعر"


class AvailabilityStart(models.TextChoices):
    ASAP          = "ASAP",          "في أقرب وقت ممكن"
    SPECIFIC_DATE = "SPECIFIC_DATE", "تاريخ محدد"


class InvoiceNameType(models.TextChoices):
    USER_NAME    = "USER_NAME",    "اسم المستخدم"
    PROPERTY_NAME = "PROPERTY_NAME", "اسم العقار"
    LEGAL_NAME   = "LEGAL_NAME",   "اسم قانوني"


# ═══════════════════════════════════════════════════════
# SUPPLIER — المورد الرئيسي (Base Model)
# ═══════════════════════════════════════════════════════

class Supplier(models.Model):
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user                = models.OneToOneField(
        User, on_delete=models.PROTECT,
        related_name="supplier_profile"
    )
    supplier_type       = models.CharField(
        max_length=20, choices=SupplierType.choices,
        db_index=True
    )
    status              = models.CharField(
        max_length=20, choices=SupplierStatus.choices,
        default=SupplierStatus.PENDING, db_index=True
    )
    is_trusted          = models.BooleanField(default=False)
    company_name        = models.CharField(max_length=255)
    company_name_en     = models.CharField(max_length=255, blank=True)
    registration_number = models.CharField(max_length=100, blank=True)
    country             = models.CharField(max_length=100)
    city                = models.CharField(max_length=100, blank=True)
    address             = models.TextField(blank=True)
    phone               = models.CharField(max_length=30)
    email               = models.EmailField()
    website             = models.URLField(blank=True)
    default_currency    = models.CharField(
        max_length=3, choices=Currency.choices,
        default=Currency.MYR
    )
    trade_license       = models.FileField(
        upload_to="suppliers/documents/trade/",
        null=True, blank=True
    )
    contract_document   = models.FileField(
        upload_to="suppliers/documents/contracts/",
        null=True, blank=True
    )
    approved_at         = models.DateTimeField(null=True, blank=True)
    approved_by         = models.ForeignKey(
        User, null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name="approved_suppliers"
    )
    rejection_reason    = models.TextField(blank=True)
    notes               = models.TextField(blank=True)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    # 🆕 ربط بـ Waitlist والكيان المُنشأ تلقائياً عند الموافقة
    waitlist_id         = models.UUIDField(
        null=True, blank=True, db_index=True,
        verbose_name="معرّف طلب Waitlist الأصلي"
    )
    created_hotel       = models.OneToOneField(
        'hotels.Hotel',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='waitlist_supplier',
        verbose_name="الفندق المُنشأ"
    )
    created_service     = models.OneToOneField(
        'services.Service',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='waitlist_supplier',
        verbose_name="الخدمة المُنشأة"
    )

    class Meta:
        db_table = "supplier"
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['supplier_type', 'status']),
            models.Index(fields=['is_trusted', 'status']),
        ]

    def __str__(self):
        return f"{self.company_name} [{self.get_supplier_type_display()}]"

    @property
    def is_approved(self):
        return self.status == SupplierStatus.APPROVED


# ═══════════════════════════════════════════════════════
# HOTEL SUPPLIER — بروفايل الفندق الكامل
# ═══════════════════════════════════════════════════════

class HotelSupplier(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier       = models.OneToOneField(
        Supplier, on_delete=models.CASCADE,
        related_name="hotel_profile"
    )
    content_status = models.CharField(
        max_length=20, choices=ContentStatus.choices,
        default=ContentStatus.DRAFT, db_index=True
    )

    # ── Step 0: نوع الفندق ───────────────────────────
    hotel_type     = models.CharField(
        max_length=20, choices=HotelType.choices,
        default=HotelType.HOTEL
    )
    hotels_count   = models.CharField(
        max_length=10, choices=HotelsCount.choices,
        default=HotelsCount.SINGLE
    )

    # ── Step 1: المعلومات الأساسية ───────────────────
    hotel_name     = models.CharField(max_length=255)
    star_rating    = models.CharField(
        max_length=3,
        choices=[('0','غير متوفر'),('1','⭐'),('2','⭐⭐'),('3','⭐⭐⭐'),('4','⭐⭐⭐⭐'),('5','⭐⭐⭐⭐⭐')],
        default='0'
    )
    is_chain       = models.BooleanField(default=False)
    chain_name     = models.CharField(max_length=255, blank=True)

    # ── الموقع ───────────────────────────────────────
    address        = models.TextField(blank=True)
    address_unit   = models.CharField(max_length=100, blank=True)
    country        = models.CharField(max_length=100, default="Malaysia")
    city           = models.CharField(max_length=100, blank=True)
    postal_code    = models.CharField(max_length=20, blank=True)
    latitude       = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude      = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)

    # ── Channel Manager ───────────────────────────────
    has_channel_manager  = models.BooleanField(default=False)
    channel_manager_name = models.CharField(max_length=100, blank=True)

    # ── Step 2: الخدمات ───────────────────────────────
    # الإفطار
    breakfast_available = models.BooleanField(default=False)
    breakfast_included  = models.BooleanField(default=False)
    breakfast_price     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    breakfast_currency  = models.CharField(max_length=3, choices=Currency.choices, default=Currency.MYR)
    breakfast_types     = models.JSONField(default=list)
    # ["CONTINENTAL","HALAL","BUFFET","ASIAN","AMERICAN","FULL_ENGLISH","ITALIAN","VEGAN","GLUTEN_FREE","KOSHER","A_LA_CARTE"]

    # موقف السيارات
    parking_available   = models.CharField(
        max_length=10, choices=ParkingType.choices,
        default=ParkingType.NO
    )
    parking_price       = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    parking_price_unit  = models.CharField(max_length=10, default="DAY", blank=True)  # HOUR / DAY
    parking_reservation = models.BooleanField(default=False)
    parking_location    = models.CharField(
        max_length=10, choices=ParkingLocation.choices,
        default=ParkingLocation.ON_SITE, blank=True
    )
    parking_private     = models.BooleanField(default=True)

    # ── اللغات ───────────────────────────────────────
    spoken_languages = models.JSONField(default=list)
    # ["en","ar","fr","ms","zh"]

    # ── قواعد المنزل ─────────────────────────────────
    checkin_from        = models.TimeField(null=True, blank=True)
    checkin_until       = models.TimeField(null=True, blank=True)
    checkout_from       = models.TimeField(null=True, blank=True)
    checkout_until      = models.TimeField(null=True, blank=True)
    children_allowed    = models.BooleanField(default=True)
    pets_policy         = models.CharField(
        max_length=15, choices=PetsPolicy.choices,
        default=PetsPolicy.ON_REQUEST
    )
    pets_free           = models.BooleanField(default=True)

    # ── الأوصاف ───────────────────────────────────────
    description_property     = models.TextField(blank=True, max_length=1200)
    host_name                = models.CharField(max_length=80, blank=True)
    host_bio                 = models.TextField(blank=True, max_length=1200)
    description_neighborhood = models.TextField(blank=True, max_length=1200)

    # ── Step 3: الأسعار ────────────────────────────────
    booking_type        = models.CharField(
        max_length=10, choices=BookingType.choices,
        default=BookingType.INSTANT
    )

    # سياسة الإلغاء (على مستوى الفندق)
    cancellation_deadline_days = models.PositiveSmallIntegerField(default=1)
    # 1 / 5 / 7 / 14 / 30
    cancellation_fee_type = models.CharField(
        max_length=15, choices=CancellationFeeType.choices,
        default=CancellationFeeType.FIRST_NIGHT
    )
    accidental_booking_protection = models.BooleanField(default=True)

    # أسعار الأطفال (على مستوى الفندق)
    children_pricing_enabled = models.BooleanField(default=True)
    infant_age_from          = models.PositiveSmallIntegerField(default=0)
    infant_age_to            = models.PositiveSmallIntegerField(default=2)
    infant_price             = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    infant_price_type        = models.CharField(max_length=10, default="FREE", blank=True)
    # FREE / FIXED / PERCENTAGE

    # أسعار الأطفال الكبار
    children_age_from = models.PositiveSmallIntegerField(default=3)
    children_age_to   = models.PositiveSmallIntegerField(default=17)
    children_price    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    children_price_type = models.CharField(max_length=10, default="FREE", blank=True)

    # خصم الإطلاق
    launch_discount_enabled  = models.BooleanField(default=False)
    launch_discount_pct      = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    launch_discount_bookings = models.PositiveSmallIntegerField(default=3)
    launch_discount_days     = models.PositiveSmallIntegerField(default=90)

    # ── التوفر ────────────────────────────────────────
    availability_start      = models.CharField(
        max_length=15, choices=AvailabilityStart.choices,
        default=AvailabilityStart.ASAP
    )
    availability_start_date = models.DateField(null=True, blank=True)
    availability_window     = models.PositiveSmallIntegerField(default=365)
    calendar_sync_enabled   = models.BooleanField(default=False)
    calendar_sync_url       = models.URLField(blank=True)
    allow_long_stays        = models.BooleanField(default=True)
    max_nights              = models.PositiveSmallIntegerField(default=90)

    # ── Step 4: الخطوات النهائية ─────────────────────
    payment_method     = models.CharField(
        max_length=20,
        default="ONLINE_PLATFORM",
        blank=True
    )
    # ONLINE_PLATFORM / AT_PROPERTY

    # الفاتورة
    invoice_name_type  = models.CharField(
        max_length=20, choices=InvoiceNameType.choices,
        default=InvoiceNameType.PROPERTY_NAME
    )
    invoice_legal_name    = models.CharField(max_length=255, blank=True)
    invoice_same_address  = models.BooleanField(default=True)
    invoice_address       = models.TextField(blank=True)

    # بيانات العقد
    owner_type           = models.CharField(
        max_length=12, choices=OwnerType.choices,
        default=OwnerType.INDIVIDUAL
    )
    # Individual
    contract_first_name  = models.CharField(max_length=100, blank=True)
    contract_middle_name = models.CharField(max_length=100, blank=True)
    contract_last_name   = models.CharField(max_length=100, blank=True)
    contract_email       = models.EmailField(blank=True)
    contract_phone       = models.CharField(max_length=30, blank=True)
    contract_country     = models.CharField(max_length=100, blank=True)
    contract_address1    = models.CharField(max_length=255, blank=True)
    contract_address2    = models.CharField(max_length=255, blank=True)
    contract_city        = models.CharField(max_length=100, blank=True)
    contract_zip         = models.CharField(max_length=20, blank=True)
    # Business إضافي
    business_legal_name  = models.CharField(max_length=255, blank=True)
    business_country     = models.CharField(max_length=100, blank=True)
    business_address1    = models.CharField(max_length=255, blank=True)
    business_address2    = models.CharField(max_length=255, blank=True)
    business_city        = models.CharField(max_length=100, blank=True)
    business_zip         = models.CharField(max_length=20, blank=True)

    # الموافقة القانونية
    license_confirmed    = models.BooleanField(default=False)
    terms_accepted       = models.BooleanField(default=False)
    terms_accepted_at    = models.DateTimeField(null=True, blank=True)
    open_immediately     = models.BooleanField(default=True)

    # المنصات الخارجية
    listed_on            = models.JSONField(default=list)
    # ["airbnb","tripadvisor","vrbo","agoda","other"]

    # عمولة المنصة
    platform_commission_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=17
    )

    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # ─── Refs لربط HotelSupplier بـ Hotel و City ───
    city_ref = models.ForeignKey(
        'locations.City',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='hotel_suppliers',
        verbose_name='المدينة (مرجع)',
        help_text='ربط بـ City object الفعلي (للبحث في DB)',
    )
    created_hotel = models.OneToOneField(
        'hotels.Hotel',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='source_supplier',
        verbose_name='الفندق المُنشأ',
        help_text='الفندق المُنشأ تلقائياً عند الموافقة',
    )


    class Meta:
        db_table = "supplier_hotel"
        indexes  = [
            models.Index(fields=['country', 'city', 'is_active']),
            models.Index(fields=['content_status']),
            models.Index(fields=['hotel_type', 'star_rating']),
        ]

    def __str__(self):
        return f"{self.hotel_name} — {self.city}"

    @property
    def registration_complete(self):
        return (
            bool(self.hotel_name) and
            bool(self.address) and
            self.room_types.filter(is_active=True).exists() and
            self.images.filter(is_active=True).count() >= 5 and
            self.terms_accepted
        )


# ═══════════════════════════════════════════════════════
# HOTEL AMENITY — مرافق الفندق
# ═══════════════════════════════════════════════════════

class AmenityCategory(models.TextChoices):
    GENERAL       = "GENERAL",       "عام"
    FOOD          = "FOOD",          "طعام وشراب"
    WELLNESS      = "WELLNESS",      "صحة وعافية"
    TRANSPORT     = "TRANSPORT",     "نقل"
    BUSINESS      = "BUSINESS",      "أعمال"
    OUTDOOR       = "OUTDOOR",       "خارجي"
    ENTERTAINMENT = "ENTERTAINMENT", "ترفيه"
    FAMILY        = "FAMILY",        "عائلي"
    SAFETY        = "SAFETY",        "أمان"
    ACCESSIBILITY = "ACCESSIBILITY", "إمكانية الوصول"


class AmenityType(models.TextChoices):
    HOTEL_ONLY = "HOTEL_ONLY", "للفنادق فقط"
    ALL        = "ALL",        "للجميع"


class HotelAmenity(models.Model):
    """قائمة المرافق الجاهزة للاختيار منها"""
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name_en      = models.CharField(max_length=100)
    name_ar      = models.CharField(max_length=100)
    name_fr      = models.CharField(max_length=100, blank=True)
    name_ms      = models.CharField(max_length=100, blank=True)
    category     = models.CharField(max_length=20, choices=AmenityCategory.choices)
    amenity_type = models.CharField(
        max_length=15, choices=AmenityType.choices,
        default=AmenityType.HOTEL_ONLY
    )
    icon         = models.CharField(max_length=50, blank=True)
    is_active    = models.BooleanField(default=True)
    sort_order   = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "hotel_amenity"
        ordering = ['category', 'sort_order']

    def __str__(self):
        return f"{self.name_en} ({self.get_category_display()})"


class HotelPropertyAmenity(models.Model):
    """ربط الفندق بالمرافق التي يملكها"""
    hotel   = models.ForeignKey(
        HotelSupplier, on_delete=models.CASCADE,
        related_name="property_amenities"
    )
    amenity = models.ForeignKey(
        HotelAmenity, on_delete=models.CASCADE
    )

    class Meta:
        db_table        = "hotel_property_amenity"
        unique_together = [("hotel", "amenity")]


# ═══════════════════════════════════════════════════════
# HOTEL ROOM TYPE — غرف الفندق
# ═══════════════════════════════════════════════════════

class HotelRoomType(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel           = models.ForeignKey(
        HotelSupplier, on_delete=models.CASCADE,
        related_name="room_types"
    )
    content_status  = models.CharField(
        max_length=20, choices=ContentStatus.choices,
        default=ContentStatus.DRAFT
    )

    # نوع الغرفة
    room_unit_type  = models.CharField(
        max_length=20, choices=RoomUnitType.choices,
        default=RoomUnitType.DOUBLE
    )
    room_count      = models.PositiveSmallIntegerField(default=1)

    # الأسرة — JSONField لأن كل غرفة قد تحتوي أنواع متعددة
    # مثال: [{"type": "KING", "count": 1}, {"type": "SOFA_BED", "count": 1}]
    beds            = models.JSONField(default=list)

    # الضيوف
    max_guests      = models.PositiveSmallIntegerField(default=2)
    exclude_infants = models.BooleanField(default=False)

    # المساحة
    area_sqm        = models.DecimalField(
        max_digits=7, decimal_places=2,
        null=True, blank=True
    )
    area_unit       = models.CharField(
        max_length=6, default="SQM",
        choices=[("SQM","متر مربع"),("SQFT","قدم مربع")]
    )

    # التدخين
    smoking_allowed = models.BooleanField(default=False)

    # الحمام
    bathroom_private = models.BooleanField(default=True)
    bathroom_items   = models.JSONField(default=list)
    # ["SHOWER","TOILET","HAIRDRYER","BATHTUB","FREE_TOILETRIES",
    #  "BIDET","SLIPPERS","BATHROBE","SPA_TUB","TOILET_PAPER"]

    # مرافق الغرفة
    room_amenities   = models.JSONField(default=list)
    # General: ["AC","TV","LINENS","DESK","WAKE_UP","TOWELS",
    #   "WARDROBE","HEATING","FAN","SAFE","GROUND_FLOOR"]
    # Outdoors: ["BALCONY","TERRACE","VIEW"]
    # Food: ["KETTLE","COFFEE_MAKER","DINING_AREA","MICROWAVE"]

    # اسم الغرفة
    room_name        = models.CharField(
        max_length=20, choices=RoomUnitType.choices,
        default=RoomUnitType.DOUBLE
    )
    room_custom_name = models.CharField(max_length=100, blank=True)

    # السعر — سعر التكلفة فقط
    cost_price_per_night = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True
    )
    cost_currency        = models.CharField(
        max_length=3, choices=Currency.choices,
        default=Currency.MYR
    )

    is_active  = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "hotel_room_type"
        indexes  = [
            models.Index(fields=['hotel', 'is_active']),
            models.Index(fields=['content_status']),
        ]

    def __str__(self):
        return f"{self.hotel.hotel_name} — {self.get_room_unit_type_display()} x{self.room_count}"

    @property
    def total_beds(self):
        return sum(b.get('count', 0) for b in self.beds)


# ═══════════════════════════════════════════════════════
# ROOM OCCUPANCY PRICE — السعر حسب الإشغال
# ═══════════════════════════════════════════════════════

class RoomOccupancyPrice(models.Model):
    """سعر مختلف حسب عدد الضيوف في الغرفة"""
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_type    = models.ForeignKey(
        HotelRoomType, on_delete=models.CASCADE,
        related_name="occupancy_prices"
    )
    guests_count = models.PositiveSmallIntegerField()
    discount_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=0
    )
    final_price  = models.DecimalField(max_digits=12, decimal_places=2)
    is_active    = models.BooleanField(default=True)

    class Meta:
        db_table        = "hotel_room_occupancy_price"
        unique_together = [("room_type", "guests_count")]
        ordering        = ["-guests_count"]


# ═══════════════════════════════════════════════════════
# HOTEL PRICE PLAN — خطط الأسعار
# ═══════════════════════════════════════════════════════

class HotelPricePlan(models.Model):
    """
    خطط الأسعار على مستوى الفندق كله.
    تطبق على جميع الغرف.
    """
    id           = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel        = models.ForeignKey(
        HotelSupplier, on_delete=models.CASCADE,
        related_name="price_plans"
    )
    plan_type    = models.CharField(
        max_length=20, choices=PricePlanType.choices,
        default=PricePlanType.STANDARD
    )
    is_enabled   = models.BooleanField(default=True)
    discount_pct = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=0,
        help_text="النسبة المئوية للخصم عن السعر القياسي"
    )
    min_nights   = models.PositiveSmallIntegerField(
        default=1,
        help_text="الحد الأدنى للليالي لتطبيق هذه الخطة"
    )
    # سياسة الإلغاء الخاصة بهذه الخطة
    cancellation_free_days = models.PositiveSmallIntegerField(default=0)
    # 0 = لا إلغاء مجاني
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table        = "hotel_price_plan"
        unique_together = [("hotel", "plan_type")]

    def __str__(self):
        return f"{self.hotel.hotel_name} — {self.get_plan_type_display()}"


# ═══════════════════════════════════════════════════════
# PROPERTY IMAGE — صور الفندق
# ═══════════════════════════════════════════════════════

class PropertyImage(models.Model):
    id          = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel       = models.ForeignKey(
        HotelSupplier, on_delete=models.CASCADE,
        related_name="images"
    )
    image       = models.ImageField(
        upload_to="suppliers/hotels/images/%Y/%m/"
    )
    is_main     = models.BooleanField(default=False)
    order       = models.PositiveSmallIntegerField(default=0)
    is_active   = models.BooleanField(default=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "hotel_image"
        ordering = ['order', '-uploaded_at']

    def save(self, *args, **kwargs):
        # إذا كانت هذه الصورة الرئيسية، أزل الرئيسية من الأخريات
        if self.is_main:
            PropertyImage.objects.filter(
                hotel=self.hotel, is_main=True
            ).exclude(pk=self.pk).update(is_main=False)
        super().save(*args, **kwargs)


# ═══════════════════════════════════════════════════════
# SUPPLIER WAITLIST — قائمة انتظار الموردين الآخرين
# ═══════════════════════════════════════════════════════

class WaitlistSupplierType(models.TextChoices):
    TRANSPORT   = "TRANSPORT",   "نقل"
    RESTAURANT  = "RESTAURANT",  "مطاعم"
    GUIDE       = "GUIDE",       "مرشد سياحي"
    ACTIVITY    = "ACTIVITY",    "أنشطة"
    WELLNESS    = "WELLNESS",    "صحة وعافية"
    HALAL       = "HALAL",       "خدمات حلال"
    ENTERTAINMENT = "ENTERTAINMENT", "ترفيه"
    SERVICES    = "SERVICES",    "خدمات داعمة"
    OTHER       = "OTHER",       "أخرى"


class SupplierWaitlist(models.Model):
    """
    قائمة انتظار الموردين الذين سجّلوا اهتمامهم
    قبل إطلاق بوابتهم الخاصة.
    """
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier_type  = models.CharField(
        max_length=20, choices=WaitlistSupplierType.choices,
        db_index=True
    )
    # المعلومات الأساسية فقط
    full_name      = models.CharField(max_length=150)
    company_name   = models.CharField(max_length=255)
    sub_type       = models.CharField(
        max_length=100, blank=True,
        help_text="النوع الفرعي: Car Rental, Airport Transfer..."
    )
    phone          = models.CharField(max_length=30)
    email          = models.EmailField(db_index=True)
    # حقل إضافي حسب النوع
    extra_info     = models.JSONField(
        default=dict, blank=True,
        help_text="معلومات إضافية خاصة بكل نوع"
    )
    # مثال للمرشد: {"languages": "Arabic, French", "certification": "MFTG"}
    # مثال للمطعم: {"halal_certified": true, "jakim_number": "..."}

    # إدارة
    is_contacted   = models.BooleanField(
        default=False,
        help_text="هل تم التواصل معه؟"
    )
    contacted_at   = models.DateTimeField(null=True, blank=True)
    notes          = models.TextField(blank=True)
    created_at     = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "supplier_waitlist"
        ordering = ['-created_at']
        indexes  = [
            models.Index(fields=['supplier_type', 'is_contacted']),
        ]

    def __str__(self):
        return f"{self.full_name} — {self.get_supplier_type_display()} ({self.email})"


# ═══════════════════════════════════════════════════════
# LEGACY MODELS — محفوظة للتوافق مع الكود القديم
# ═══════════════════════════════════════════════════════

class MealPlan(models.TextChoices):
    ROOM_ONLY     = "RO", "Room Only"
    BED_BREAKFAST = "BB", "Bed & Breakfast"
    HALF_BOARD    = "HB", "Half Board"
    FULL_BOARD    = "FB", "Full Board"
    ALL_INCLUSIVE = "AI", "All Inclusive"


class RoomTypeSupplier(models.Model):
    """محفوظ للتوافق — استخدم HotelRoomType بدلاً منه"""
    id            = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    hotel         = models.ForeignKey(
        HotelSupplier, on_delete=models.CASCADE,
        related_name="old_room_types"
    )
    name          = models.CharField(max_length=100)
    description   = models.TextField(blank=True)
    max_occupancy = models.PositiveSmallIntegerField(default=2)
    bed_config    = models.CharField(max_length=100, blank=True)
    total_rooms   = models.PositiveSmallIntegerField(default=1)
    amenities     = models.JSONField(default=list)
    images        = models.JSONField(default=list)
    is_active     = models.BooleanField(default=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supplier_room_type"

    def __str__(self):
        return f"{self.hotel.hotel_name} — {self.name}"


class RoomRateSupplier(models.Model):
    """محفوظ للتوافق"""
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    room_type        = models.ForeignKey(
        RoomTypeSupplier, on_delete=models.CASCADE,
        related_name="rates"
    )
    season_name      = models.CharField(max_length=100)
    date_from        = models.DateField(db_index=True)
    date_to          = models.DateField(db_index=True)
    meal_plan        = models.CharField(max_length=2, choices=MealPlan.choices, default=MealPlan.ROOM_ONLY)
    cost_price       = models.DecimalField(max_digits=12, decimal_places=2)
    cost_price_child = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cost_price_infant = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency         = models.CharField(max_length=3, choices=Currency.choices, default=Currency.MYR)
    available_rooms  = models.PositiveSmallIntegerField(default=0)
    min_nights       = models.PositiveSmallIntegerField(default=1)
    is_active        = models.BooleanField(default=True)
    content_status   = models.CharField(max_length=20, choices=ContentStatus.choices, default=ContentStatus.DRAFT)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supplier_room_rate"


class VehicleType(models.TextChoices):
    SEDAN = "SEDAN", "Sedan"
    MPV   = "MPV",   "MPV"
    VAN   = "VAN",   "Van"
    BUS   = "BUS",   "Bus"


class TransferRouteSupplier(models.Model):
    id                         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier                   = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="transfer_routes")
    origin                     = models.CharField(max_length=255)
    destination                = models.CharField(max_length=255)
    country                    = models.CharField(max_length=100)
    estimated_duration_minutes = models.PositiveSmallIntegerField(null=True, blank=True)
    is_active                  = models.BooleanField(default=True)
    content_status             = models.CharField(max_length=20, choices=ContentStatus.choices, default=ContentStatus.DRAFT)
    created_at                 = models.DateTimeField(auto_now_add=True)
    updated_at                 = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supplier_transfer_route"


class TransferRateSupplier(models.Model):
    id             = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    route          = models.ForeignKey(TransferRouteSupplier, on_delete=models.CASCADE, related_name="rates")
    vehicle_type   = models.CharField(max_length=20, choices=VehicleType.choices)
    cost_price     = models.DecimalField(max_digits=12, decimal_places=2)
    currency       = models.CharField(max_length=3, choices=Currency.choices, default=Currency.MYR)
    is_active      = models.BooleanField(default=True)
    content_status = models.CharField(max_length=20, choices=ContentStatus.choices, default=ContentStatus.DRAFT)
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        db_table        = "supplier_transfer_rate"
        unique_together = [("route", "vehicle_type")]


class TourSupplier(models.Model):
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier        = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="tours")
    content_status  = models.CharField(max_length=20, choices=ContentStatus.choices, default=ContentStatus.DRAFT)
    name            = models.CharField(max_length=255)
    country         = models.CharField(max_length=100)
    city            = models.CharField(max_length=100, blank=True)
    duration_days   = models.PositiveSmallIntegerField()
    duration_nights = models.PositiveSmallIntegerField()
    description     = models.TextField(blank=True)
    itinerary       = models.JSONField(default=list)
    inclusions      = models.JSONField(default=list)
    exclusions      = models.JSONField(default=list)
    images          = models.JSONField(default=list)
    min_pax         = models.PositiveSmallIntegerField(default=1)
    max_pax         = models.PositiveSmallIntegerField(null=True, blank=True)
    is_active       = models.BooleanField(default=True)
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supplier_tour"


class TourRateSupplier(models.Model):
    id                    = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tour                  = models.ForeignKey(TourSupplier, on_delete=models.CASCADE, related_name="rates")
    season_name           = models.CharField(max_length=100)
    date_from             = models.DateField()
    date_to               = models.DateField()
    cost_price_per_person = models.DecimalField(max_digits=12, decimal_places=2)
    cost_price_child      = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency              = models.CharField(max_length=3, choices=Currency.choices, default=Currency.MYR)
    is_active             = models.BooleanField(default=True)
    content_status        = models.CharField(max_length=20, choices=ContentStatus.choices, default=ContentStatus.DRAFT)
    created_at            = models.DateTimeField(auto_now_add=True)
    updated_at            = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supplier_tour_rate"


class CabinClass(models.TextChoices):
    ECONOMY         = "ECONOMY",         "Economy"
    PREMIUM_ECONOMY = "PREMIUM_ECONOMY", "Premium Economy"
    BUSINESS        = "BUSINESS",        "Business"
    FIRST           = "FIRST",           "First Class"


class FlightRouteSupplier(models.Model):
    id               = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    supplier         = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name="flight_routes")
    origin_city      = models.CharField(max_length=100)
    origin_code      = models.CharField(max_length=3)
    destination_city = models.CharField(max_length=100)
    destination_code = models.CharField(max_length=3)
    airline_name     = models.CharField(max_length=100)
    airline_code     = models.CharField(max_length=5, blank=True)
    is_active        = models.BooleanField(default=True)
    content_status   = models.CharField(max_length=20, choices=ContentStatus.choices, default=ContentStatus.DRAFT)
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supplier_flight_route"
        indexes  = [models.Index(fields=['origin_code', 'destination_code'])]


class FlightRateSupplier(models.Model):
    id                  = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    route               = models.ForeignKey(FlightRouteSupplier, on_delete=models.CASCADE, related_name="rates")
    cabin_class         = models.CharField(max_length=20, choices=CabinClass.choices, default=CabinClass.ECONOMY)
    season_name         = models.CharField(max_length=100)
    date_from           = models.DateField()
    date_to             = models.DateField()
    cost_price_adult    = models.DecimalField(max_digits=12, decimal_places=2)
    cost_price_child    = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    cost_price_infant   = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    currency            = models.CharField(max_length=3, choices=Currency.choices, default=Currency.MYR)
    available_seats     = models.PositiveSmallIntegerField(default=0)
    baggage_included_kg = models.PositiveSmallIntegerField(default=0)
    is_active           = models.BooleanField(default=True)
    content_status      = models.CharField(max_length=20, choices=ContentStatus.choices, default=ContentStatus.DRAFT)
    created_at          = models.DateTimeField(auto_now_add=True)
    updated_at          = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "supplier_flight_rate"
        indexes  = [models.Index(fields=['route', 'date_from', 'date_to'])]
