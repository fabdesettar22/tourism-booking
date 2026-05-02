# apps/settings_app/models.py

from django.db import models


class SiteSettings(models.Model):
    site_name    = models.CharField(max_length=200, default='You Need Travel', verbose_name="اسم الموقع")
    site_logo    = models.ImageField(
        upload_to='site/', blank=True, null=True,
        verbose_name="شعار الموقع"
    )
    site_email   = models.EmailField(blank=True, verbose_name="البريد الإلكتروني")
    site_phone   = models.CharField(max_length=20, blank=True, verbose_name="الهاتف")
    site_address = models.TextField(blank=True, verbose_name="العنوان")
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name        = "إعدادات الموقع"
        verbose_name_plural = "إعدادات الموقع"

    def __str__(self):
        return self.site_name

    @classmethod
    def get(cls):
        """دائماً يرجع سجل واحد — ينشئه إذا لم يكن موجوداً."""
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

# ═══════════════════════════════════════════════════════════
# HomepageConfig — إعدادات الصفحة الرئيسية (Singleton)
# ═══════════════════════════════════════════════════════════

class HomepageConfig(models.Model):
    """
    إعدادات الصفحة الرئيسية — Singleton (سجل واحد).
    يتحكم الأدمن من لوحة التحكم بكل النصوص والمرئيات.
    """

    # ─── Hero Section ───
    hero_badge        = models.JSONField(
        default=dict,
        verbose_name='شارة Hero (3 لغات)',
        help_text='{"ar": "...", "en": "...", "ms": "..."}',
    )
    hero_title        = models.JSONField(default=dict, verbose_name='عنوان Hero')
    hero_title_highlight = models.JSONField(default=dict, verbose_name='الكلمة المُميَّزة في العنوان')
    hero_subtitle     = models.JSONField(default=dict, verbose_name='عنوان فرعي Hero')
    search_placeholder = models.JSONField(default=dict, verbose_name='نص البحث الافتراضي')

    # ─── Stats Banner (NEW) ───
    stats_visible     = models.BooleanField(default=True, verbose_name='إظهار شريط الإحصائيات')
    stats_customers   = models.PositiveIntegerField(default=2400, verbose_name='عدد العملاء (ك)')
    stats_destinations = models.PositiveIntegerField(default=15,  verbose_name='عدد الوجهات')
    stats_suppliers   = models.PositiveIntegerField(default=120, verbose_name='عدد الموردين')
    stats_partners    = models.PositiveIntegerField(default=50,  verbose_name='عدد الوكالات الشريكة')

    # ─── Section Visibility ───
    show_destinations  = models.BooleanField(default=True,  verbose_name='إظهار الوجهات')
    show_hotels        = models.BooleanField(default=True,  verbose_name='إظهار الفنادق')
    show_services      = models.BooleanField(default=True,  verbose_name='إظهار الخدمات')
    show_trust_section = models.BooleanField(default=True,  verbose_name='إظهار قسم الثقة')
    show_testimonials  = models.BooleanField(default=True,  verbose_name='إظهار آراء العملاء')
    show_supplier_cta  = models.BooleanField(default=True,  verbose_name='إظهار CTA المورد')
    show_categories    = models.BooleanField(default=True,  verbose_name='إظهار شريط الفئات')

    # ─── Section Limits ───
    hotels_limit      = models.PositiveSmallIntegerField(default=8, verbose_name='عدد الفنادق المعروضة')
    services_limit    = models.PositiveSmallIntegerField(default=8, verbose_name='عدد الخدمات المعروضة')

    # ─── Trust Badges (4 badges, customizable) ───
    trust_badge_1_title    = models.JSONField(default=dict, blank=True)
    trust_badge_1_subtitle = models.JSONField(default=dict, blank=True)
    trust_badge_2_title    = models.JSONField(default=dict, blank=True)
    trust_badge_2_subtitle = models.JSONField(default=dict, blank=True)
    trust_badge_3_title    = models.JSONField(default=dict, blank=True)
    trust_badge_3_subtitle = models.JSONField(default=dict, blank=True)
    trust_badge_4_title    = models.JSONField(default=dict, blank=True)
    trust_badge_4_subtitle = models.JSONField(default=dict, blank=True)

    # ─── Audit ───
    updated_at = models.DateTimeField(auto_now=True)
    updated_by = models.ForeignKey(
        'accounts.User',
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='+',
    )

    class Meta:
        verbose_name        = 'إعدادات الصفحة الرئيسية'
        verbose_name_plural = 'إعدادات الصفحة الرئيسية'

    def __str__(self):
        return 'Homepage Configuration'

    @classmethod
    def get_solo(cls):
        """دائماً يُرجع سجلاً واحداً — ينشئه بالقيم الافتراضية إن لم يكن موجوداً."""
        obj, created = cls.objects.get_or_create(pk=1, defaults=cls._defaults())
        return obj

    @staticmethod
    def _defaults():
        return {
            'hero_badge': {'ar': '🇲🇾 ماليزيا تنتظرك', 'en': '🇲🇾 Malaysia Awaits', 'ms': '🇲🇾 Malaysia Menanti'},
            'hero_title': {'ar': 'اكتشف أجمل وجهات', 'en': 'Discover the Best of', 'ms': 'Temui Destinasi Terbaik'},
            'hero_title_highlight': {'ar': 'جنوب شرق آسيا', 'en': 'Southeast Asia', 'ms': 'Asia Tenggara'},
            'hero_subtitle': {
                'ar': 'فنادق فاخرة، تجارب فريدة، وكل ما تحتاج لرحلة لا تُنسى — موثّق MOTAC وحلال 100%',
                'en': 'Luxury hotels, unique experiences & everything for an unforgettable trip — MOTAC verified, 100% Halal-friendly',
                'ms': 'Hotel mewah, pengalaman unik & semua keperluan perjalanan anda — Disahkan MOTAC, 100% Halal',
            },
            'search_placeholder': {
                'ar': 'إلى أين؟ مدينة، فندق، نشاط...',
                'en': 'Where to? City, hotel, activity...',
                'ms': 'Ke mana? Bandar, hotel, aktiviti...',
            },
            'trust_badge_1_title':    {'ar': 'موثّق MOTAC',          'en': 'MOTAC Approved',     'ms': 'Disahkan MOTAC'},
            'trust_badge_1_subtitle': {'ar': 'مرخّص من وزارة السياحة', 'en': 'Licensed by Tourism Ministry', 'ms': 'Berlesen Kementerian'},
            'trust_badge_2_title':    {'ar': 'صديق للحلال',           'en': 'Halal-Friendly',     'ms': 'Mesra Halal'},
            'trust_badge_2_subtitle': {'ar': 'خيارات حلال معتمدة',     'en': 'Halal certified options', 'ms': 'Halal disahkan'},
            'trust_badge_3_title':    {'ar': 'موردون موثوقون',        'en': 'Verified Suppliers', 'ms': 'Pembekal Disahkan'},
            'trust_badge_3_subtitle': {'ar': 'كل مورد مُراجَع يدوياً',  'en': 'Every supplier reviewed', 'ms': 'Setiap disemak'},
            'trust_badge_4_title':    {'ar': 'دعم 3 لغات',           'en': 'Multi-Language',     'ms': 'Sokongan 3 Bahasa'},
            'trust_badge_4_subtitle': {'ar': 'عربي إنجليزي ماليزي',     'en': 'Arabic English Malay', 'ms': 'Arab Inggeris Melayu'},
        }


# ═══════════════════════════════════════════════════════════
# Testimonial — آراء العملاء
# ═══════════════════════════════════════════════════════════

class Testimonial(models.Model):
    """رأي عميل في الصفحة الرئيسية."""
    name           = models.CharField(max_length=150, verbose_name='الاسم')
    location       = models.CharField(max_length=100, verbose_name='البلد/المدينة')
    country_code   = models.CharField(max_length=2, blank=True, verbose_name='كود الدولة (مثل: SA, MY, AE)')
    text           = models.JSONField(
        default=dict,
        verbose_name='الرأي (3 لغات)',
        help_text='{"ar": "...", "en": "...", "ms": "..."}',
    )
    rating         = models.PositiveSmallIntegerField(default=5, verbose_name='التقييم (1-5)')
    avatar         = models.ImageField(upload_to='testimonials/', null=True, blank=True, verbose_name='الصورة الشخصية')
    is_active      = models.BooleanField(default=True, db_index=True, verbose_name='نشط')
    display_order  = models.PositiveIntegerField(default=0, db_index=True, verbose_name='ترتيب العرض')
    created_at     = models.DateTimeField(auto_now_add=True)
    updated_at     = models.DateTimeField(auto_now=True)

    class Meta:
        ordering            = ['display_order', '-created_at']
        verbose_name        = 'رأي عميل'
        verbose_name_plural = 'آراء العملاء'

    def __str__(self):
        return f'{self.name} — {self.location}'


# ═══════════════════════════════════════════════════════════
# Destination — وجهات الصفحة الرئيسية (مدن مع فلتر)
# ═══════════════════════════════════════════════════════════

class Destination(models.Model):
    """
    وجهة تظهر في قسم Featured Destinations على الصفحة الرئيسية.
    عند النقر عليها، تفتح نافذة منبثقة بالفنادق + الخدمات حسب الفلتر.
    """

    # ─── الاسم (3 لغات) ───
    name = models.JSONField(
        default=dict,
        verbose_name='اسم الوجهة (3 لغات)',
        help_text='{"ar": "كوالالمبور", "en": "Kuala Lumpur", "ms": "Kuala Lumpur"}',
    )

    # ─── الصورة ───
    image = models.ImageField(
        upload_to='destinations/',
        verbose_name='صورة الوجهة',
        help_text='يُفضّل 800×600 أو أكبر',
    )

    # ─── الفلتر (يُحدّد ما يظهر في المودال) ───
    city = models.ForeignKey(
        'locations.City',
        on_delete=models.PROTECT,
        related_name='destinations',
        verbose_name='المدينة',
        help_text='المدينة المرتبطة (يُفلتر بها الفنادق والخدمات)',
        null=True, blank=True,
    )
    # حقول قديمة — للتوافق مع البيانات السابقة فقط (تُملأ تلقائياً من city)
    city_name    = models.CharField(max_length=100, blank=True, verbose_name='اسم المدينة (legacy)')
    country_code = models.CharField(max_length=2,   blank=True, verbose_name='كود الدولة (legacy)')

    # ─── إعدادات العرض ───
    display_order = models.PositiveIntegerField(
        default=0, db_index=True,
        verbose_name='ترتيب العرض',
        help_text='الأقل = يظهر أولاً',
    )
    is_active = models.BooleanField(
        default=True, db_index=True,
        verbose_name='نشط',
    )

    # ─── الحجم في الشبكة (asymmetric grid) ───
    SIZE_CHOICES = [
        ('large',  'كبير (يأخذ نصف الشبكة)'),
        ('medium', 'متوسط'),
        ('small',  'صغير'),
    ]
    size = models.CharField(
        max_length=10, choices=SIZE_CHOICES, default='medium',
        verbose_name='حجم البطاقة في الشبكة',
    )

    # ─── الوصف (اختياري — يظهر في المودال) ───
    description = models.JSONField(
        default=dict, blank=True,
        verbose_name='وصف الوجهة (اختياري)',
        help_text='{"ar": "...", "en": "...", "ms": "..."}',
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering            = ['display_order', '-created_at']
        verbose_name        = 'وجهة'
        verbose_name_plural = 'الوجهات'

    def __str__(self):
        return self.name.get('en', '') or self.city_name or f'Destination #{self.pk}'
