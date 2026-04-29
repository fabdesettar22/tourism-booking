# apps/waitlist/models.py

import uuid
from django.db import models


# ── Choices ───────────────────────────────────────────────

class SupplierType(models.TextChoices):
    PROPERTY    = 'PROPERTY',    'عقار'
    TRANSPORT   = 'TRANSPORT',   'نقل'
    RESTAURANT  = 'RESTAURANT',  'مطعم'
    GUIDE       = 'GUIDE',       'مرشد سياحي'
    ACTIVITY    = 'ACTIVITY',    'نشاط وترفيه'
    WELLNESS    = 'WELLNESS',    'سبا وعافية'
    OTHER       = 'OTHER',       'خدمات أخرى'


class PropertyType(models.TextChoices):
    HOTEL         = 'HOTEL',         'فندق'
    GUESTHOUSE    = 'GUESTHOUSE',    'بيت ضيافة'
    BED_BREAKFAST = 'BED_BREAKFAST', 'Bed & Breakfast'
    HOMESTAY      = 'HOMESTAY',      'Homestay'
    HOSTEL        = 'HOSTEL',        'بيت شباب'
    CONDO_HOTEL   = 'CONDO_HOTEL',   'شقة فندقية'
    RESORT        = 'RESORT',        'منتجع'
    CAPSULE_HOTEL = 'CAPSULE_HOTEL', 'فندق كبسول'
    FLOATING      = 'FLOATING',      'بيت عائم'
    MOTEL         = 'MOTEL',         'موتيل'
    LODGE         = 'LODGE',         'لودج'
    RIAD          = 'RIAD',          'رياض'


class TransportType(models.TextChoices):
    BUS         = 'BUS',         'باص سياحي'
    PRIVATE_CAR = 'PRIVATE_CAR', 'سيارة خاصة مع سائق'
    MINIBUS     = 'MINIBUS',     'ميني باص'
    HELICOPTER  = 'HELICOPTER',  'هليكوبتر'
    BOAT        = 'BOAT',        'قارب / يخت'
    FERRY       = 'FERRY',       'فيري'
    MOTORCYCLE  = 'MOTORCYCLE',  'دراجة نارية'
    TAXI        = 'TAXI',        'تاكسي'


class RestaurantType(models.TextChoices):
    TRADITIONAL   = 'TRADITIONAL',   'مطعم تقليدي'
    CAFE          = 'CAFE',          'كافيه'
    FAST_FOOD     = 'FAST_FOOD',     'وجبات سريعة'
    BUFFET        = 'BUFFET',        'بوفيه'
    FLOATING      = 'FLOATING',      'مطعم عائم'
    HEALTHY       = 'HEALTHY',       'مطعم صحي / نباتي'
    ASIAN         = 'ASIAN',         'مطعم آسيوي متخصص'
    GRILLS        = 'GRILLS',        'مطعم مشويات'
    ENTERTAINMENT = 'ENTERTAINMENT', 'مطعم مع عروض ترفيهية'


class GuideSpecialty(models.TextChoices):
    GENERAL     = 'GENERAL',     'مرشد سياحي عام'
    NATURE      = 'NATURE',      'مرشد رحلات طبيعية / مغامرات'
    HISTORICAL  = 'HISTORICAL',  'مرشد تاريخي / ثقافي'
    DIVING      = 'DIVING',      'مرشد غوص وأنشطة بحرية'
    FOOD        = 'FOOD',        'مرشد سياحة غذائية'
    PHOTOGRAPHY = 'PHOTOGRAPHY', 'مرشد تصوير سياحي'
    HALAL       = 'HALAL',       'مرشد سياحة إسلامية / حلال'


class ActivityType(models.TextChoices):
    DIVING      = 'DIVING',      'غوص وأنشطة بحرية'
    CLIMBING    = 'CLIMBING',    'تسلق ومغامرات'
    THEME_PARK  = 'THEME_PARK',  'ملاهي وترفيه'
    SPORTS      = 'SPORTS',      'رياضات'
    CULTURAL    = 'CULTURAL',    'عروض ثقافية وفنية'
    YOGA        = 'YOGA',        'يوغا ومديتيشن'
    CYCLING     = 'CYCLING',     'دراجات هوائية وجولات نشطة'
    FISHING     = 'FISHING',     'صيد سمك'
    ECO_TOURISM = 'ECO_TOURISM', 'سياحة بيئية / طبيعية'


class WellnessType(models.TextChoices):
    SPA         = 'SPA',         'سبا تقليدي'
    SALON       = 'SALON',       'صالون تجميل'
    YOGA_CENTER = 'YOGA_CENTER', 'مركز يوغا وتأمل'
    GYM         = 'GYM',         'صالة رياضية'
    ALTERNATIVE = 'ALTERNATIVE', 'مركز طب بديل / عشبي'
    HAMMAM      = 'HAMMAM',      'حمام مغربي / تقليدي'
    NUTRITION   = 'NUTRITION',   'مركز تغذية وصحة'


class OtherServiceType(models.TextChoices):
    PHOTOGRAPHY = 'PHOTOGRAPHY', 'تصوير فوتوغرافي / فيديو'
    EVENTS      = 'EVENTS',      'تنظيم فعاليات وحفلات'
    SHOPPING    = 'SHOPPING',    'تسوق وحرف يدوية'
    RELIGIOUS   = 'RELIGIOUS',   'خدمات دينية / إسلامية'
    MEDICAL     = 'MEDICAL',     'خدمات طبية سياحية'
    EDUCATIONAL = 'EDUCATIONAL', 'دورات تعليمية سياحية'
    PROTOCOL    = 'PROTOCOL',    'خدمات بروتوكول وترجمة'


class HowDidYouHear(models.TextChoices):
    SOCIAL_MEDIA = 'SOCIAL_MEDIA', 'وسائل التواصل الاجتماعي'
    REFERRAL     = 'REFERRAL',     'توصية من شخص'
    GOOGLE       = 'GOOGLE',       'بحث على Google'
    EVENT        = 'EVENT',        'معرض أو فعالية'
    OTHER        = 'OTHER',        'أخرى'


class SyncMode(models.TextChoices):
    """كيف يُدخل المورد الأسعار والتوفر."""
    MANUAL  = 'MANUAL',  'إدخال يدوي (WhatsApp/Excel)'
    CHANNEL = 'CHANNEL', 'Channel Manager (SiteMinder, Cloudbeds, ...)'
    API     = 'API',     'ربط مباشر بـ API'
    GDS     = 'GDS',     'GDS (Amadeus, Sabre, Hotelbeds)'


class WaitlistStatus(models.TextChoices):
    PENDING   = 'PENDING',   'في الانتظار'
    CONTACTED = 'CONTACTED', 'تم التواصل'
    REGISTERED= 'REGISTERED','مسجل'
    REJECTED  = 'REJECTED',  'مرفوض'


# ── Base Waitlist Model ────────────────────────────────────

class WaitlistBase(models.Model):
    """
    النموذج الأساسي المشترك بين كل أنواع الموردين
    """
    id              = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ref_number      = models.CharField(max_length=20, unique=True, editable=False)

    # ── البيانات المشتركة ──────────────────────────────────
    supplier_type   = models.CharField(max_length=20, choices=SupplierType.choices)
    full_name       = models.CharField(max_length=150)
    email           = models.EmailField()
    phone           = models.CharField(max_length=30)
    company_name    = models.CharField(max_length=200)
    country         = models.CharField(max_length=100, blank=True, verbose_name='الدولة')
    country_code    = models.CharField(max_length=2, blank=True, db_index=True, verbose_name='ISO دولة')
    city            = models.CharField(max_length=100)
    region          = models.CharField(max_length=100, blank=True)
    worked_before   = models.BooleanField(default=False, verbose_name='سبق العمل مع منصات أخرى؟')

    # ── مصدر التسجيل ──────────────────────────────────────
    how_did_you_hear = models.CharField(
        max_length=20,
        choices=HowDidYouHear.choices,
        blank=True
    )
    how_did_you_hear_other = models.CharField(max_length=200, blank=True)

    # ── UTM Parameters ─────────────────────────────────────
    utm_source   = models.CharField(max_length=100, blank=True)
    utm_medium   = models.CharField(max_length=100, blank=True)
    utm_campaign = models.CharField(max_length=100, blank=True)

    # ── بيانات تلقائية ────────────────────────────────────
    ip_address   = models.GenericIPAddressField(null=True, blank=True)
    device_type  = models.CharField(max_length=20, blank=True)  # mobile / desktop / tablet
    status       = models.CharField(
        max_length=20,
        choices=WaitlistStatus.choices,
        default=WaitlistStatus.PENDING
    )
    email_sent   = models.BooleanField(default=False)
    notes        = models.TextField(blank=True)
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    # ── معلومات التكامل (Channel Manager / API) ───────────
    sync_mode = models.CharField(
        max_length=10,
        choices=SyncMode.choices,
        default=SyncMode.MANUAL,
        verbose_name='نمط التزامن',
    )
    channel_name = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='اسم Channel Manager / النظام',
        help_text='مثل: SiteMinder, Cloudbeds, Amadeus'
    )
    api_endpoint = models.URLField(
        blank=True,
        verbose_name='رابط API (إن وُجد)',
    )
    api_credentials = models.JSONField(
        default=dict,
        blank=True,
        verbose_name='بيانات الوصول (مشفّرة لاحقاً)',
    )
    last_sync_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='آخر مزامنة ناجحة',
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.ref_number:
            import random
            import string
            prefix_map = {'PROPERTY':'PRO','TRANSPORT':'TRN','RESTAURANT':'RST','GUIDE':'GDE','ACTIVITY':'ACT','WELLNESS':'WEL','OTHER':'OTH'}
            prefix = prefix_map.get(self.supplier_type, 'MYB')
            suffix = ''.join(random.choices(string.digits, k=6))
            self.ref_number = f"MYB-{prefix}-{suffix}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} — {self.company_name} ({self.ref_number})"


# ── Property Waitlist ──────────────────────────────────────

class PropertyWaitlist(WaitlistBase):
    """
    قائمة انتظار العقارات (فنادق، منتجعات، شقق...)
    """
    property_type  = models.CharField(max_length=20, choices=PropertyType.choices)
    rooms_count    = models.PositiveIntegerField(null=True, blank=True)
    star_rating    = models.PositiveSmallIntegerField(null=True, blank=True)
    listed_online  = models.BooleanField(default=False, verbose_name='مسجل في Booking/Agoda/Airbnb؟')

    # ── المرجع الصحيح للدولة والمدينة (يختاره المورد من قائمة منسدلة) ──
    country_ref = models.ForeignKey(
        'locations.Country',
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='property_waitlist_entries',
        verbose_name='الدولة (مرجع)',
        help_text='يُحدَّد من قائمة منسدلة — لا يُكتب نصاً حراً',
    )
    city_ref = models.ForeignKey(
        'locations.City',
        on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='property_waitlist_entries',
        verbose_name='المدينة (مرجع)',
        help_text='يُحدَّد من قائمة منسدلة — لا يُكتب نصاً حراً',
    )

    # بيانات خاصة بكل نوع (JSON مرن)
    extra_data     = models.JSONField(default=dict, blank=True)

    # وثائق
    property_photo = models.FileField(upload_to='waitlist/property/photos/', null=True, blank=True)
    license_doc    = models.FileField(upload_to='waitlist/property/licenses/', null=True, blank=True)

    # ── الفندق المُنشأ تلقائياً عند الموافقة ──────────────────
    created_hotel = models.OneToOneField(
        'hotels.Hotel',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='source_waitlist',
        verbose_name='الفندق المُنشأ',
        help_text='يُملأ تلقائياً عند الموافقة على الطلب',
    )

    class Meta(WaitlistBase.Meta):
        db_table = 'waitlist_property'
        verbose_name = 'قائمة انتظار — عقار'
        verbose_name_plural = 'قائمة انتظار — عقارات'


# ── Transport Waitlist ─────────────────────────────────────

class TransportWaitlist(WaitlistBase):
    """
    قائمة انتظار خدمات النقل
    """
    transport_type  = models.CharField(max_length=20, choices=TransportType.choices)
    vehicles_count  = models.PositiveIntegerField(null=True, blank=True)
    has_license     = models.BooleanField(default=False, verbose_name='لديه رخصة سياحية؟')

    # بيانات خاصة بكل نوع
    extra_data      = models.JSONField(default=dict, blank=True)

    # وثائق
    vehicle_license = models.FileField(upload_to='waitlist/transport/licenses/', null=True, blank=True)
    tourism_license = models.FileField(upload_to='waitlist/transport/tourism/', null=True, blank=True)

    # ── أسعار النقل (يُدخلها المورد) ──
    price_airport_transfer = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر نقل المطار')
    price_hourly           = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر الساعة')
    price_intercity        = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر الرحلة بين المدن')
    price_full_day         = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر اليوم الكامل')

    # ── مراجع الموقع ──
    country_ref = models.ForeignKey('locations.Country', on_delete=models.PROTECT, null=True, blank=True, related_name='transport_waitlist_entries', verbose_name='الدولة (مرجع)')
    city_ref    = models.ForeignKey('locations.City',    on_delete=models.PROTECT, null=True, blank=True, related_name='transport_waitlist_entries', verbose_name='المدينة (مرجع)')

    # ── العملة ──
    currency = models.CharField(max_length=3, default='MYR', verbose_name='العملة')

    # ── الخدمة المُنشأة تلقائياً ──
    created_service = models.OneToOneField('services.Service', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_transport_waitlist', verbose_name='الخدمة المُنشأة')

    class Meta(WaitlistBase.Meta):
        db_table = 'waitlist_transport'
        verbose_name = 'قائمة انتظار — نقل'
        verbose_name_plural = 'قائمة انتظار — نقل'


# ── Restaurant Waitlist ────────────────────────────────────

class RestaurantWaitlist(WaitlistBase):
    """
    قائمة انتظار المطاعم
    """
    restaurant_type = models.CharField(max_length=20, choices=RestaurantType.choices)
    capacity        = models.PositiveIntegerField(null=True, blank=True)
    is_halal        = models.BooleanField(default=False)

    # بيانات خاصة بكل نوع
    extra_data      = models.JSONField(default=dict, blank=True)

    # وثائق
    restaurant_license = models.FileField(upload_to='waitlist/restaurant/licenses/', null=True, blank=True)
    halal_certificate  = models.FileField(upload_to='waitlist/restaurant/halal/', null=True, blank=True)

    # ── أسعار المطعم (يُدخلها المورد) ──
    price_per_person = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='متوسط سعر الوجبة للشخص')
    price_set_menu   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر القائمة الثابتة')

    # ── مراجع الموقع ──
    country_ref = models.ForeignKey('locations.Country', on_delete=models.PROTECT, null=True, blank=True, related_name='restaurant_waitlist_entries', verbose_name='الدولة (مرجع)')
    city_ref    = models.ForeignKey('locations.City',    on_delete=models.PROTECT, null=True, blank=True, related_name='restaurant_waitlist_entries', verbose_name='المدينة (مرجع)')

    # ── العملة ──
    currency = models.CharField(max_length=3, default='MYR', verbose_name='العملة')

    # ── الخدمة المُنشأة تلقائياً ──
    created_service = models.OneToOneField('services.Service', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_restaurant_waitlist', verbose_name='الخدمة المُنشأة')

    class Meta(WaitlistBase.Meta):
        db_table = 'waitlist_restaurant'
        verbose_name = 'قائمة انتظار — مطعم'
        verbose_name_plural = 'قائمة انتظار — مطاعم'


# ── Guide Waitlist ─────────────────────────────────────────

class GuideWaitlist(WaitlistBase):
    """
    قائمة انتظار المرشدين السياحيين
    """
    specialties      = models.JSONField(default=list)  # قائمة من GuideSpecialty
    languages        = models.JSONField(default=list)  # ['ar', 'en', 'fr', 'ms']
    experience_years = models.PositiveSmallIntegerField(null=True, blank=True)
    regions_covered  = models.JSONField(default=list)
    has_license      = models.BooleanField(default=False)
    accepts_groups   = models.BooleanField(default=True)

    # وثائق
    id_document      = models.FileField(upload_to='waitlist/guide/id/', null=True, blank=True)
    guide_license    = models.FileField(upload_to='waitlist/guide/licenses/', null=True, blank=True)

    # ── أسعار المرشد (يُدخلها المورد) ──
    price_half_day = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر نصف يوم')
    price_full_day = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر اليوم الكامل')
    price_hourly   = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر الساعة')

    # ── مراجع الموقع ──
    country_ref = models.ForeignKey('locations.Country', on_delete=models.PROTECT, null=True, blank=True, related_name='guide_waitlist_entries', verbose_name='الدولة (مرجع)')
    city_ref    = models.ForeignKey('locations.City',    on_delete=models.PROTECT, null=True, blank=True, related_name='guide_waitlist_entries', verbose_name='المدينة (مرجع)')

    # ── العملة ──
    currency = models.CharField(max_length=3, default='MYR', verbose_name='العملة')

    # ── الخدمة المُنشأة تلقائياً ──
    created_service = models.OneToOneField('services.Service', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_guide_waitlist', verbose_name='الخدمة المُنشأة')

    class Meta(WaitlistBase.Meta):
        db_table = 'waitlist_guide'
        verbose_name = 'قائمة انتظار — مرشد'
        verbose_name_plural = 'قائمة انتظار — مرشدون'


# ── Activity Waitlist ──────────────────────────────────────

class ActivityWaitlist(WaitlistBase):
    """
    قائمة انتظار مزودي الأنشطة والترفيه
    """
    activity_types   = models.JSONField(default=list)  # قائمة من ActivityType
    capacity         = models.PositiveIntegerField(null=True, blank=True)
    suitable_kids    = models.BooleanField(default=True)
    suitable_elderly = models.BooleanField(default=False)
    has_insurance    = models.BooleanField(default=False)
    has_license      = models.BooleanField(default=False)

    # وثائق
    activity_license = models.FileField(upload_to='waitlist/activity/licenses/', null=True, blank=True)
    insurance_doc    = models.FileField(upload_to='waitlist/activity/insurance/', null=True, blank=True)

    # ── أسعار النشاط (يُدخلها المورد) ──
    price_per_person = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر النشاط للشخص')
    price_per_group  = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر النشاط للمجموعة')
    min_group_size   = models.PositiveIntegerField(null=True, blank=True, verbose_name='الحد الأدنى للأشخاص')

    # ── مراجع الموقع ──
    country_ref = models.ForeignKey('locations.Country', on_delete=models.PROTECT, null=True, blank=True, related_name='activity_waitlist_entries', verbose_name='الدولة (مرجع)')
    city_ref    = models.ForeignKey('locations.City',    on_delete=models.PROTECT, null=True, blank=True, related_name='activity_waitlist_entries', verbose_name='المدينة (مرجع)')

    # ── العملة ──
    currency = models.CharField(max_length=3, default='MYR', verbose_name='العملة')

    # ── الخدمة المُنشأة تلقائياً ──
    created_service = models.OneToOneField('services.Service', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_activity_waitlist', verbose_name='الخدمة المُنشأة')

    class Meta(WaitlistBase.Meta):
        db_table = 'waitlist_activity'
        verbose_name = 'قائمة انتظار — نشاط'
        verbose_name_plural = 'قائمة انتظار — أنشطة'


# ── Wellness Waitlist ──────────────────────────────────────

class WellnessWaitlist(WaitlistBase):
    """
    قائمة انتظار مراكز السبا والعافية
    """
    wellness_types    = models.JSONField(default=list)  # قائمة من WellnessType
    capacity          = models.PositiveIntegerField(null=True, blank=True)
    is_independent    = models.BooleanField(default=True)
    gender_policy     = models.CharField(
        max_length=20,
        choices=[('MIXED','مختلط'),('SEPARATE','منفصل'),('FEMALE_ONLY','إناث فقط'),('MALE_ONLY','ذكور فقط')],
        default='SEPARATE'
    )
    is_halal_certified = models.BooleanField(default=False)
    has_license        = models.BooleanField(default=False)

    # وثائق
    wellness_license   = models.FileField(upload_to='waitlist/wellness/licenses/', null=True, blank=True)
    staff_certificates = models.FileField(upload_to='waitlist/wellness/certificates/', null=True, blank=True)

    # ── أسعار السبا (يُدخلها المورد) ──
    price_per_session    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر الجلسة')
    session_duration_min = models.PositiveIntegerField(null=True, blank=True, verbose_name='مدة الجلسة (دقيقة)')
    price_package        = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='سعر الباقة')

    # ── مراجع الموقع ──
    country_ref = models.ForeignKey('locations.Country', on_delete=models.PROTECT, null=True, blank=True, related_name='wellness_waitlist_entries', verbose_name='الدولة (مرجع)')
    city_ref    = models.ForeignKey('locations.City',    on_delete=models.PROTECT, null=True, blank=True, related_name='wellness_waitlist_entries', verbose_name='المدينة (مرجع)')

    # ── العملة ──
    currency = models.CharField(max_length=3, default='MYR', verbose_name='العملة')

    # ── الخدمة المُنشأة تلقائياً ──
    created_service = models.OneToOneField('services.Service', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_wellness_waitlist', verbose_name='الخدمة المُنشأة')

    class Meta(WaitlistBase.Meta):
        db_table = 'waitlist_wellness'
        verbose_name = 'قائمة انتظار — سبا وعافية'
        verbose_name_plural = 'قائمة انتظار — سبا وعافية'


# ── Other Services Waitlist ────────────────────────────────

class OtherServiceWaitlist(WaitlistBase):
    """
    قائمة انتظار الخدمات الأخرى
    """
    service_types     = models.JSONField(default=list)  # قائمة من OtherServiceType
    service_description = models.TextField(blank=True)
    target_audience   = models.CharField(
        max_length=20,
        choices=[('INDIVIDUAL','أفراد'),('GROUPS','مجموعات'),('BOTH','كلاهما')],
        default='BOTH'
    )
    has_license       = models.BooleanField(default=False)

    # وثائق
    id_document       = models.FileField(upload_to='waitlist/other/id/', null=True, blank=True)
    service_proof     = models.FileField(upload_to='waitlist/other/proof/', null=True, blank=True)

    # ── أسعار الخدمات الأخرى (يُدخلها المورد) ──
    base_price     = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name='السعر الأساسي')
    price_unit     = models.CharField(
        max_length=20,
        choices=[('person','لكل شخص'),('hour','لكل ساعة'),('day','لكل يوم'),('unit','لكل قطعة'),('group','للمجموعة')],
        default='person',
        blank=True,
        verbose_name='وحدة التسعير'
    )
    pricing_notes  = models.TextField(blank=True, verbose_name='ملاحظات التسعير')

    # ── مراجع الموقع ──
    country_ref = models.ForeignKey('locations.Country', on_delete=models.PROTECT, null=True, blank=True, related_name='other_waitlist_entries', verbose_name='الدولة (مرجع)')
    city_ref    = models.ForeignKey('locations.City',    on_delete=models.PROTECT, null=True, blank=True, related_name='other_waitlist_entries', verbose_name='المدينة (مرجع)')

    # ── العملة ──
    currency = models.CharField(max_length=3, default='MYR', verbose_name='العملة')

    # ── الخدمة المُنشأة تلقائياً ──
    created_service = models.OneToOneField('services.Service', on_delete=models.SET_NULL, null=True, blank=True, related_name='source_other_waitlist', verbose_name='الخدمة المُنشأة')

    class Meta(WaitlistBase.Meta):
        db_table = 'waitlist_other'
        verbose_name = 'قائمة انتظار — خدمات أخرى'
        verbose_name_plural = 'قائمة انتظار — خدمات أخرى'
