"""
apps/advertising/models.py

النظام الإعلاني الكامل لـ MYBRIDGE.

النماذج الأساسية:
- AdCampaign     : تجميع منطقي للإعلانات (اختياري)
- AdCreative     : الإعلان نفسه (الأساس) — 5 أنواع
- AdPlacement    : أين ومتى يظهر الإعلان (12 موقع + جدولة)
- AdTargeting    : لمن يظهر (لغة/دولة/جهاز/مستخدم/frequency)
- AdEvent        : تتبع كل حدث (view/click/close/dismiss)

الفلسفة:
- Admin (HQ) فقط يضيف الإعلانات في Phase 1
- مجاني داخلياً، لكن hooks موجودة للبيلينج المستقبلي
- استهداف كامل احترافي
- تتبع GDPR-friendly (ip_hash بدلاً من ip)
"""

import uuid
import hashlib

from django.conf import settings
from django.db import models
from django.utils import timezone
from django.utils.translation import gettext_lazy as _


# ═══════════════════════════════════════════════════════════
# Helper: مسارات الصور في Cloudinary / media
# ═══════════════════════════════════════════════════════════

def ad_image_desktop_path(instance, filename):
    ext = filename.split('.')[-1].lower()
    return f'advertising/desktop/{uuid.uuid4()}.{ext}'


def ad_image_mobile_path(instance, filename):
    ext = filename.split('.')[-1].lower()
    return f'advertising/mobile/{uuid.uuid4()}.{ext}'


# ═══════════════════════════════════════════════════════════
# Enums (TextChoices) — كلها بالعربية للأدمن
# ═══════════════════════════════════════════════════════════

class AdType(models.TextChoices):
    """نوع الإعلان."""
    BANNER         = 'BANNER',         'بنر صورة'
    HERO_BANNER    = 'HERO_BANNER',    'بنر رئيسي عريض'
    POPUP          = 'POPUP',          'نافذة منبثقة'
    FEATURED_CARD  = 'FEATURED_CARD',  'بطاقة مميزة'
    CAROUSEL_ITEM  = 'CAROUSEL_ITEM',  'عنصر سلايدر'


class Placement(models.TextChoices):
    """مكان عرض الإعلان (12 موقع)."""
    HOME_HERO_TOP      = 'HOME_HERO_TOP',      'الرئيسية - فوق Hero'
    HOME_HERO_BG       = 'HOME_HERO_BG',       'الرئيسية - خلفية Hero'
    HOME_MIDDLE        = 'HOME_MIDDLE',        'الرئيسية - وسط الصفحة'
    HOME_BOTTOM        = 'HOME_BOTTOM',        'الرئيسية - أسفل الصفحة'
    HOME_SIDEBAR       = 'HOME_SIDEBAR',       'الرئيسية - شريط جانبي'
    HOME_BANNER_FULL   = 'HOME_BANNER_FULL',   'الرئيسية - بنر عريض كامل'
    SEARCH_TOP         = 'SEARCH_TOP',         'صفحة البحث - أعلى النتائج'
    HOTEL_DETAIL_SIDE  = 'HOTEL_DETAIL_SIDE',  'صفحة الفندق - جانبي'
    POPUP_ENTRY        = 'POPUP_ENTRY',        'نافذة دخول الموقع'
    POPUP_EXIT         = 'POPUP_EXIT',         'نافذة قبل المغادرة'
    FOOTER_BANNER      = 'FOOTER_BANNER',      'بنر فوق التذييل'
    DASHBOARD_TOP      = 'DASHBOARD_TOP',      'لوحة الوكالة - أعلى'


class LinkTarget(models.TextChoices):
    SAME_TAB = 'SAME_TAB', 'نفس النافذة'
    NEW_TAB  = 'NEW_TAB',  'نافذة جديدة'


class EventType(models.TextChoices):
    """نوع الحدث المُتتبَّع."""
    VIEW    = 'VIEW',    'مشاهدة'
    CLICK   = 'CLICK',   'نقرة'
    CLOSE   = 'CLOSE',   'إغلاق'
    DISMISS = 'DISMISS', 'تجاهل'


class DeviceType(models.TextChoices):
    MOBILE  = 'mobile',  'هاتف'
    DESKTOP = 'desktop', 'سطح مكتب'
    TABLET  = 'tablet',  'لوحي'


class UserType(models.TextChoices):
    ANONYMOUS = 'anonymous', 'زائر مجهول'
    TOURIST   = 'tourist',   'سائح'
    AGENCY    = 'agency',    'وكالة شريكة'
    SUPPLIER  = 'supplier',  'مورد'
    ADMIN     = 'admin',     'مدير'


# ═══════════════════════════════════════════════════════════
# AdCampaign — تجميع منطقي (اختياري)
# ═══════════════════════════════════════════════════════════

class AdCampaign(models.Model):
    """
    حملة إعلانية — تجميع لعدة إعلانات معاً.
    مفيد لإدارة عدة إعلانات بنفس الهدف (مثلاً: حملة رمضان).
    
    Hooks للبيلينج المستقبلي موجودة لكن NULL في Phase 1.
    """

    uid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True,
        verbose_name='معرّف فريد'
    )

    # ── الأساسيات ─────────────────────────────────────────
    name = models.CharField(
        max_length=200,
        verbose_name='اسم الحملة',
        help_text='للاستخدام الداخلي فقط (لا يظهر للزوار)'
    )
    description = models.TextField(
        blank=True,
        verbose_name='الوصف'
    )

    # ── الجدولة ───────────────────────────────────────────
    start_date = models.DateTimeField(
        default=timezone.now,
        verbose_name='تاريخ البدء',
        db_index=True
    )
    end_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name='تاريخ الانتهاء',
        help_text='اتركه فارغاً للحملات المستمرة'
    )

    # ── الحالة ────────────────────────────────────────────
    is_active = models.BooleanField(
        default=True,
        verbose_name='نشطة',
        db_index=True
    )

    # ── البيلينج (NULL في Phase 1 - hooks مستقبلية) ──────
    budget_total = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        verbose_name='الميزانية الإجمالية',
        help_text='Phase 2 — اتركها فارغة الآن'
    )
    budget_daily = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        verbose_name='الميزانية اليومية',
        help_text='Phase 2 — اتركها فارغة الآن'
    )
    currency = models.CharField(
        max_length=3, blank=True,
        verbose_name='العملة',
        help_text='MYR/USD/EUR'
    )

    # ── Audit ─────────────────────────────────────────────
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_campaigns',
        verbose_name='أنشأها'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name

    class Meta:
        db_table            = 'ad_campaigns'
        verbose_name        = 'حملة إعلانية'
        verbose_name_plural = 'الحملات الإعلانية'
        ordering            = ['-created_at']


# ═══════════════════════════════════════════════════════════
# AdCreative — الإعلان نفسه (الأساس)
# ═══════════════════════════════════════════════════════════

class AdCreative(models.Model):
    """
    الإعلان نفسه — هو ما يراه الزائر.
    
    يحتوي على:
    - النوع (BANNER/POPUP/HERO/FEATURED/CAROUSEL_ITEM)
    - المحتوى متعدد اللغات (JSON: ar/en/ms)
    - الصور (desktop + mobile)
    - الرابط (URL أو ربط مباشر بـ Hotel/Package/Agency)
    - الأولوية والوزن
    """

    uid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True,
        verbose_name='معرّف فريد'
    )

    campaign = models.ForeignKey(
        AdCampaign,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='creatives',
        verbose_name='الحملة',
        help_text='اختياري — يمكن إنشاء إعلانات مستقلة'
    )

    name = models.CharField(
        max_length=200,
        verbose_name='اسم الإعلان (داخلي)',
        help_text='للأدمن فقط - لا يظهر للزوار'
    )

    # ── النوع ─────────────────────────────────────────────
    ad_type = models.CharField(
        max_length=20,
        choices=AdType.choices,
        default=AdType.BANNER,
        db_index=True,
        verbose_name='نوع الإعلان'
    )

    # ── المحتوى متعدد اللغات (JSON) ──────────────────────
    content = models.JSONField(
        default=dict,
        verbose_name='المحتوى (متعدد اللغات)',
        help_text=(
            'صيغة: {"ar": {"title": "...", "description": "...", "button": "..."}, '
            '"en": {...}, "ms": {...}}'
        )
    )

    # ── الصور (Cloudinary) ────────────────────────────────
    image_desktop = models.ImageField(
        upload_to=ad_image_desktop_path,
        verbose_name='صورة (سطح المكتب)',
        help_text='الحجم الموصى به: 1920x600 للبنرات الكبيرة، 1200x300 للبنرات العادية'
    )
    image_mobile = models.ImageField(
        upload_to=ad_image_mobile_path,
        blank=True, null=True,
        verbose_name='صورة (الهاتف)',
        help_text='اختياري — إن تركتها فارغة، تُستخدم صورة سطح المكتب'
    )
    image_alt_text = models.CharField(
        max_length=255, blank=True,
        verbose_name='النص البديل (Alt Text)',
        help_text='مهم لـ SEO وذوي الاحتياجات الخاصة'
    )

    # ── الرابط ────────────────────────────────────────────
    link_url = models.URLField(
        blank=True,
        verbose_name='رابط الإعلان',
        help_text='URL خارجي — أو اترك فارغاً واستخدم الربط الداخلي'
    )
    link_target = models.CharField(
        max_length=10,
        choices=LinkTarget.choices,
        default=LinkTarget.SAME_TAB,
        verbose_name='فتح الرابط في'
    )

    # ── ربط داخلي (اختياري - بدلاً من URL) ─────────────────
    linked_hotel = models.ForeignKey(
        'hotels.Hotel',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ad_creatives',
        verbose_name='فندق مرتبط',
        help_text='اختياري — لربط الإعلان بفندق محدد'
    )
    linked_package = models.ForeignKey(
        'packages.CustomPackage',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ad_creatives',
        verbose_name='باقة مرتبطة',
        help_text='اختياري — يربط بـ CustomPackage'
    )
    linked_agency = models.ForeignKey(
        'accounts.Agency',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ad_creatives',
        verbose_name='وكالة مرتبطة'
    )

    # ── التحكم ────────────────────────────────────────────
    is_active = models.BooleanField(
        default=False,
        db_index=True,
        verbose_name='نشط',
        help_text='عطّله لإيقاف العرض دون حذفه'
    )
    priority = models.PositiveIntegerField(
        default=50,
        verbose_name='الأولوية',
        help_text='0-100 — أعلى = يظهر أولاً'
    )
    weight = models.PositiveIntegerField(
        default=1,
        verbose_name='الوزن (للتدوير)',
        help_text='عند تساوي الأولوية، يُستخدم الوزن للاختيار العشوائي'
    )

    # ── البيلينج (Phase 2 - NULL في Phase 1) ──────────────
    cost = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True,
        verbose_name='التكلفة',
        help_text='Phase 2 — اتركها فارغة الآن'
    )

    # ── Audit ─────────────────────────────────────────────
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='created_creatives',
        verbose_name='أنشأه'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # ── Helpers ───────────────────────────────────────────

    def get_content(self, lang: str = 'en', field: str = 'title') -> str:
        """
        يُرجع المحتوى بالغة المطلوبة، مع fallback إلى en ثم أول لغة متاحة.
        
        Example:
            ad.get_content(lang='ar', field='title')
        """
        if not isinstance(self.content, dict):
            return ''
        
        # الأفضلية: اللغة المطلوبة → en → أول لغة متاحة
        for try_lang in [lang, 'en', 'ar', 'ms']:
            block = self.content.get(try_lang)
            if isinstance(block, dict) and block.get(field):
                return block[field]
        return ''

    def get_link(self) -> str:
        """يُرجع الرابط النهائي (URL أو internal entity link)."""
        if self.link_url:
            return self.link_url
        if self.linked_hotel:
            return f'/hotels/{self.linked_hotel.uid}'
        if self.linked_package:
            return f'/packages/{self.linked_package.id}'
        if self.linked_agency:
            return f'/agencies/{self.linked_agency.id}'
        return '#'

    def __str__(self):
        return f'{self.get_ad_type_display()} — {self.name}'

    class Meta:
        db_table            = 'ad_creatives'
        verbose_name        = 'إعلان'
        verbose_name_plural = 'الإعلانات'
        ordering            = ['-priority', '-created_at']
        indexes = [
            models.Index(fields=['is_active', 'ad_type']),
            models.Index(fields=['-priority']),
        ]


# ═══════════════════════════════════════════════════════════
# AdPlacement — أين ومتى يظهر الإعلان
# ═══════════════════════════════════════════════════════════

class AdPlacement(models.Model):
    """
    موقع عرض الإعلان + الجدولة الزمنية.
    
    إعلان واحد يمكنه أن يظهر في عدة أماكن (1:N).
    مثلاً: نفس البنر في HOME_TOP و SEARCH_TOP.
    
    يدعم:
    - تواريخ البدء والانتهاء
    - Dayparting (ساعات معينة)
    - أيام الأسبوع
    """

    uid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True
    )

    creative = models.ForeignKey(
        AdCreative,
        on_delete=models.CASCADE,
        related_name='placements',
        verbose_name='الإعلان'
    )

    placement_key = models.CharField(
        max_length=30,
        choices=Placement.choices,
        db_index=True,
        verbose_name='موقع العرض'
    )

    # ── الجدولة الزمنية ──────────────────────────────────
    start_date = models.DateTimeField(
        default=timezone.now,
        verbose_name='تاريخ البدء',
        db_index=True
    )
    end_date = models.DateTimeField(
        null=True, blank=True,
        verbose_name='تاريخ الانتهاء',
        help_text='اتركه فارغاً للعرض المستمر'
    )

    # ── Dayparting (ساعات اليوم) ─────────────────────────
    active_hours_start = models.TimeField(
        null=True, blank=True,
        verbose_name='ساعة البدء (يومياً)',
        help_text='مثال: 09:00 — اتركها فارغة للعرض على مدار 24 ساعة'
    )
    active_hours_end = models.TimeField(
        null=True, blank=True,
        verbose_name='ساعة الانتهاء (يومياً)',
        help_text='مثال: 23:00'
    )

    # ── أيام الأسبوع ─────────────────────────────────────
    # JSON list: [0,1,2,3,4,5,6] حيث 0=الإثنين، 6=الأحد
    active_weekdays = models.JSONField(
        default=list,
        blank=True,
        verbose_name='أيام الأسبوع النشطة',
        help_text=(
            'JSON list of integers 0-6 (0=الإثنين, 6=الأحد). '
            'اتركها فارغة [] للعرض كل الأيام.'
        )
    )

    # ── Audit ─────────────────────────────────────────────
    created_at = models.DateTimeField(auto_now_add=True)

    def is_currently_active(self) -> bool:
        """يفحص إذا كان الـ placement نشطاً الآن (تاريخ + ساعة + يوم)."""
        now = timezone.now()
        
        # 1. Date range
        if self.start_date and now < self.start_date:
            return False
        if self.end_date and now > self.end_date:
            return False
        
        # 2. Hours
        current_time = now.time()
        if self.active_hours_start and current_time < self.active_hours_start:
            return False
        if self.active_hours_end and current_time > self.active_hours_end:
            return False
        
        # 3. Weekdays
        if self.active_weekdays and len(self.active_weekdays) > 0:
            today = now.weekday()  # 0=Mon, 6=Sun
            if today not in self.active_weekdays:
                return False
        
        return True

    def __str__(self):
        return f'{self.creative.name} → {self.get_placement_key_display()}'

    class Meta:
        db_table            = 'ad_placements'
        verbose_name        = 'موقع عرض'
        verbose_name_plural = 'مواقع العرض'
        ordering            = ['-created_at']
        indexes = [
            models.Index(fields=['placement_key', 'start_date']),
        ]


# ═══════════════════════════════════════════════════════════
# AdTargeting — لمن يظهر الإعلان (1:1 مع AdCreative)
# ═══════════════════════════════════════════════════════════

class AdTargeting(models.Model):
    """
    استهداف الإعلان: لمن يظهر؟
    
    كل حقل JSON list:
    - ["all"] = للجميع (الافتراضي)
    - ["ar", "en"] = اللغات العربية والإنجليزية فقط
    - ["MY", "SA"] = ماليزيا والسعودية فقط
    - [] = لا أحد (لإيقاف الإعلان)
    """

    creative = models.OneToOneField(
        AdCreative,
        on_delete=models.CASCADE,
        related_name='targeting',
        primary_key=True,
        verbose_name='الإعلان'
    )

    # ── اللغات ───────────────────────────────────────────
    languages = models.JSONField(
        default=list,
        verbose_name='اللغات المستهدفة',
        help_text=(
            'JSON list مثل ["ar", "en", "ms"] أو ["all"] للجميع. '
            'اتركها [] لإيقاف العرض.'
        )
    )

    # ── الدول (ISO 3166-1 alpha-2) ───────────────────────
    countries = models.JSONField(
        default=list,
        verbose_name='الدول المستهدفة',
        help_text='JSON list مثل ["MY", "SA", "AE"] أو ["all"]'
    )

    # ── الأجهزة ──────────────────────────────────────────
    devices = models.JSONField(
        default=list,
        verbose_name='الأجهزة المستهدفة',
        help_text='JSON list من: mobile, desktop, tablet'
    )

    # ── أنواع المستخدمين ─────────────────────────────────
    user_types = models.JSONField(
        default=list,
        verbose_name='أنواع المستخدمين',
        help_text='JSON list: anonymous, tourist, agency, supplier, admin'
    )

    # ── Frequency Capping ────────────────────────────────
    max_views_per_user_day = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name='حد المشاهدات للمستخدم/اليوم',
        help_text='اتركه فارغاً = غير محدود'
    )
    max_views_per_session = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name='حد المشاهدات لكل جلسة',
        help_text='اتركه فارغاً = غير محدود'
    )

    # ── Audit ─────────────────────────────────────────────
    updated_at = models.DateTimeField(auto_now=True)

    def matches(
        self,
        *,
        language: str,
        country: str = None,
        device: str,
        user_type: str,
    ) -> bool:
        """يفحص إذا كان الزائر يطابق الاستهداف. 'all' يعني الجميع."""

        # Language
        if self.languages:
            if 'all' not in self.languages and language not in self.languages:
                return False

        # Country (إن كان معروفاً)
        if self.countries and country:
            if 'all' not in self.countries and country not in self.countries:
                return False

        # Device — نقبل 'all' أيضاً
        if self.devices:
            if 'all' not in self.devices and device not in self.devices:
                return False

        # User type — نقبل 'all' أيضاً
        if self.user_types:
            if 'all' not in self.user_types and user_type not in self.user_types:
                return False

        return True

    def __str__(self):
        return f'استهداف: {self.creative.name}'

    class Meta:
        db_table            = 'ad_targetings'
        verbose_name        = 'استهداف'
        verbose_name_plural = 'الاستهدافات'


# ═══════════════════════════════════════════════════════════
# AdEvent — تتبع كل حدث (view/click/close/dismiss)
# ═══════════════════════════════════════════════════════════

class AdEvent(models.Model):
    """
    سجل لكل حدث على إعلان.
    
    GDPR-friendly:
    - IP يُحفظ كـ SHA256 hash
    - User Agent مقطوع
    - لا يوجد PII
    
    Phase 2: نُجمّع هذه البيانات في AdDailyStats ونحذف القديم.
    """

    uid = models.UUIDField(
        default=uuid.uuid4, editable=False, unique=True
    )

    creative = models.ForeignKey(
        AdCreative,
        on_delete=models.CASCADE,
        related_name='events',
        verbose_name='الإعلان'
    )

    # نُكرر الـ placement_key للسرعة (denormalized)
    placement_key = models.CharField(
        max_length=30,
        choices=Placement.choices,
        db_index=True,
        verbose_name='موقع العرض'
    )

    event_type = models.CharField(
        max_length=10,
        choices=EventType.choices,
        db_index=True,
        verbose_name='نوع الحدث'
    )

    # ── معلومات الزائر (مجهولة) ──────────────────────────
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='ad_events',
        verbose_name='المستخدم'
    )
    session_id = models.CharField(
        max_length=64, blank=True,
        verbose_name='معرّف الجلسة',
        help_text='UUID مُولَّد في الـ frontend'
    )
    ip_hash = models.CharField(
        max_length=64, blank=True,
        verbose_name='IP (مشفّر)',
        help_text='SHA256 hash لحماية الخصوصية'
    )

    # ── السياق ───────────────────────────────────────────
    language    = models.CharField(max_length=2, blank=True, verbose_name='اللغة')
    country     = models.CharField(max_length=2, blank=True, verbose_name='الدولة')
    device_type = models.CharField(
        max_length=10, blank=True,
        choices=DeviceType.choices,
        verbose_name='نوع الجهاز'
    )
    user_agent  = models.CharField(max_length=500, blank=True, verbose_name='User Agent')
    referrer    = models.URLField(blank=True, verbose_name='المصدر')

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    @staticmethod
    def hash_ip(ip: str) -> str:
        """يُشفّر IP بـ SHA256 لحماية الخصوصية."""
        if not ip:
            return ''
        # نضيف salt من SECRET_KEY لمنع rainbow tables
        salt = settings.SECRET_KEY[:16]
        return hashlib.sha256(f'{ip}:{salt}'.encode()).hexdigest()

    def __str__(self):
        return f'{self.event_type} — {self.creative.name} — {self.created_at:%Y-%m-%d %H:%M}'

    class Meta:
        db_table            = 'ad_events'
        verbose_name        = 'حدث إعلاني'
        verbose_name_plural = 'الأحداث الإعلانية'
        ordering            = ['-created_at']
        indexes = [
            models.Index(fields=['creative', 'event_type', '-created_at']),
            models.Index(fields=['placement_key', '-created_at']),
        ]
