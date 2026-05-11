"""نماذج تسعير الفنادق المتقدمة — YOUNEED 2026.

تطبيق مستقل يحتوي على فئات الغرف، المواسم متعددة المدى، الأسعار المصفوفية
(فئة × موسم × طبقة تسعير × يوم × إشغال)، الرسوم الإضافية، ومحتويات الباقات.

يتكامل مع apps.hotels.Hotel كجذر، ويعمل بالتوازي مع apps.pricing (الإصدار القديم
الذي يبقى لغرض توافق Booking).
"""
from decimal import Decimal

from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


# ═══════════════════════════════════════════════════════════
# Choice constants
# ═══════════════════════════════════════════════════════════

BASE_TYPE_ROOM      = 'room'
BASE_TYPE_SUITE     = 'suite'
BASE_TYPE_VILLA     = 'villa'
BASE_TYPE_CHALET    = 'chalet'
BASE_TYPE_APARTMENT = 'apartment'
BASE_TYPE_BUNGALOW  = 'bungalow'
BASE_TYPE_PACKAGE   = 'package'
BASE_TYPE_CHOICES = [
    (BASE_TYPE_ROOM,      'غرفة'),
    (BASE_TYPE_SUITE,     'جناح'),
    (BASE_TYPE_VILLA,     'فيلا'),
    (BASE_TYPE_CHALET,    'شاليه'),
    (BASE_TYPE_APARTMENT, 'شقة'),
    (BASE_TYPE_BUNGALOW,  'بنغلو'),
    (BASE_TYPE_PACKAGE,   'باقة'),
]

VIEW_TYPE_STANDARD   = 'standard'
VIEW_TYPE_SEA        = 'sea'
VIEW_TYPE_HILL       = 'hill'
VIEW_TYPE_GARDEN     = 'garden'
VIEW_TYPE_POOL       = 'pool'
VIEW_TYPE_CITY       = 'city'
VIEW_TYPE_KLCC       = 'klcc'
VIEW_TYPE_KL_TOWER   = 'kl_tower'
VIEW_TYPE_BEACH      = 'beach'
VIEW_TYPE_LAGOON     = 'lagoon'
VIEW_TYPE_BEACHFRONT = 'beachfront'
VIEW_TYPE_RUNAWAY    = 'runaway'
VIEW_TYPE_STREET     = 'street'
VIEW_TYPE_OTHER      = 'other'
VIEW_TYPE_CHOICES = [
    (VIEW_TYPE_STANDARD,   'قياسي'),
    (VIEW_TYPE_SEA,        'إطلالة بحر'),
    (VIEW_TYPE_HILL,       'إطلالة تل'),
    (VIEW_TYPE_GARDEN,     'إطلالة حديقة'),
    (VIEW_TYPE_POOL,       'إطلالة مسبح'),
    (VIEW_TYPE_CITY,       'إطلالة مدينة'),
    (VIEW_TYPE_KLCC,       'إطلالة KLCC'),
    (VIEW_TYPE_KL_TOWER,   'إطلالة برج كوالالمبور'),
    (VIEW_TYPE_BEACH,      'إطلالة شاطئ'),
    (VIEW_TYPE_LAGOON,     'إطلالة بحيرة'),
    (VIEW_TYPE_BEACHFRONT, 'مواجه للشاطئ'),
    (VIEW_TYPE_RUNAWAY,    'إطلالة ممر'),
    (VIEW_TYPE_STREET,     'إطلالة شارع'),
    (VIEW_TYPE_OTHER,      'أخرى'),
]

PRICING_TIER_FIT        = 'fit'
PRICING_TIER_FIT_NORMAL = 'fit_normal'
PRICING_TIER_FIT_PROMO  = 'fit_promo'
PRICING_TIER_GIT        = 'git'
PRICING_TIER_GIT_NORMAL = 'git_normal'
PRICING_TIER_GIT_SERIES = 'git_series'
PRICING_TIER_CHOICES = [
    (PRICING_TIER_FIT,        'FIT'),
    (PRICING_TIER_FIT_NORMAL, 'FIT — Normal'),
    (PRICING_TIER_FIT_PROMO,  'FIT — Promo'),
    (PRICING_TIER_GIT,        'GIT'),
    (PRICING_TIER_GIT_NORMAL, 'GIT — Normal'),
    (PRICING_TIER_GIT_SERIES, 'GIT — Series'),
]

DAY_TYPE_ALL     = 'all'
DAY_TYPE_WEEKDAY = 'weekday'
DAY_TYPE_WEEKEND = 'weekend'
DAY_TYPE_CHOICES = [
    (DAY_TYPE_ALL,     'كل الأيام'),
    (DAY_TYPE_WEEKDAY, 'أيام الأسبوع'),
    (DAY_TYPE_WEEKEND, 'عطلة نهاية الأسبوع'),
]

SEASON_TYPE_FLAT           = 'flat'
SEASON_TYPE_LOW            = 'low'
SEASON_TYPE_SHOULDER       = 'shoulder'
SEASON_TYPE_NORMAL         = 'normal'
SEASON_TYPE_HIGH           = 'high'
SEASON_TYPE_PEAK           = 'peak'
SEASON_TYPE_SUPER_PEAK     = 'super_peak'
SEASON_TYPE_TACTICAL_PROMO = 'tactical_promo'
SEASON_TYPE_CHOICES = [
    (SEASON_TYPE_FLAT,           'سعر ثابت'),
    (SEASON_TYPE_LOW,            'موسم منخفض'),
    (SEASON_TYPE_SHOULDER,       'موسم متوسط'),
    (SEASON_TYPE_NORMAL,         'عادي'),
    (SEASON_TYPE_HIGH,           'موسم مرتفع'),
    (SEASON_TYPE_PEAK,           'ذروة'),
    (SEASON_TYPE_SUPER_PEAK,     'ذروة قصوى'),
    (SEASON_TYPE_TACTICAL_PROMO, 'عرض تكتيكي'),
]

SURCHARGE_TYPE_FIXED      = 'fixed'
SURCHARGE_TYPE_PERCENTAGE = 'percentage'
SURCHARGE_TYPE_CHOICES = [
    (SURCHARGE_TYPE_FIXED,      'مبلغ ثابت'),
    (SURCHARGE_TYPE_PERCENTAGE, 'نسبة مئوية'),
]

OCCUPANCY_SINGLE = 'single'
OCCUPANCY_DOUBLE = 'double'
OCCUPANCY_TRIPLE = 'triple'
OCCUPANCY_QUAD   = 'quad'
OCCUPANCY_CHOICES = [
    (OCCUPANCY_SINGLE, 'فردي'),
    (OCCUPANCY_DOUBLE, 'زوجي'),
    (OCCUPANCY_TRIPLE, 'ثلاثي'),
    (OCCUPANCY_QUAD,   'رباعي'),
]

WEEKDAY_CHOICES = [
    (0, 'الإثنين'),
    (1, 'الثلاثاء'),
    (2, 'الأربعاء'),
    (3, 'الخميس'),
    (4, 'الجمعة'),
    (5, 'السبت'),
    (6, 'الأحد'),
]


# ═══════════════════════════════════════════════════════════
# RoomCategory
# ═══════════════════════════════════════════════════════════

class RoomCategory(models.Model):
    """فئة غرفة في فندق — Superior King, Deluxe Sea View, Family Suite..."""

    hotel = models.ForeignKey(
        'hotels.Hotel', on_delete=models.CASCADE,
        related_name='room_categories', verbose_name='الفندق',
    )

    name = models.CharField(max_length=120, verbose_name='اسم الفئة')
    name_ar = models.CharField(max_length=120, blank=True, default='', verbose_name='الاسم بالعربية')

    base_type = models.CharField(
        max_length=20, choices=BASE_TYPE_CHOICES,
        default=BASE_TYPE_ROOM, verbose_name='النوع الأساسي',
    )
    view_type = models.CharField(
        max_length=20, choices=VIEW_TYPE_CHOICES,
        default=VIEW_TYPE_STANDARD, verbose_name='نوع الإطلالة',
    )
    view_custom = models.CharField(
        max_length=80, blank=True, default='',
        verbose_name='إطلالة مخصصة',
    )

    pax = models.PositiveSmallIntegerField(default=2, verbose_name='عدد الأشخاص')
    max_occupancy = models.PositiveSmallIntegerField(default=2, verbose_name='أقصى إشغال')
    bed_config = models.CharField(max_length=60, blank=True, default='', verbose_name='تركيب الأسرّة')
    quantity_in_hotel = models.PositiveIntegerField(
        default=1, verbose_name='عدد الغرف من هذا النوع في الفندق',
    )
    max_extra_beds = models.PositiveSmallIntegerField(
        default=0, verbose_name='أقصى عدد أسرّة إضافية',
    )
    max_child_beds = models.PositiveSmallIntegerField(
        default=0, verbose_name='أقصى عدد أسرّة أطفال',
    )

    is_package = models.BooleanField(default=False, verbose_name='باقة شاملة')

    description = models.TextField(blank=True, default='', verbose_name='الوصف')
    image = models.ImageField(
        upload_to='room_categories/%Y/%m/',
        blank=True, null=True, verbose_name='الصورة',
    )

    is_active = models.BooleanField(default=True, db_index=True, verbose_name='نشط')
    sort_order = models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hotel_rates_room_category'
        ordering = ['hotel', 'sort_order', 'name']
        verbose_name        = 'فئة غرفة'
        verbose_name_plural = 'فئات الغرف'
        indexes = [
            models.Index(fields=['hotel', 'is_active']),
            models.Index(fields=['hotel', 'base_type']),
            models.Index(fields=['hotel', 'view_type']),
        ]
        constraints = [
            models.UniqueConstraint(
                fields=['hotel', 'name', 'view_type', 'pax'],
                name='uniq_room_category_per_hotel',
            ),
        ]

    def __str__(self):
        view = self.get_view_type_display() if self.view_type != VIEW_TYPE_STANDARD else ''
        suffix = f' — {self.pax}pax' if self.pax != 2 else ''
        return f'{self.hotel.name} — {self.name}{(" " + view) if view else ""}{suffix}'


# ═══════════════════════════════════════════════════════════
# HotelSeason + HotelSeasonDateRange
# ═══════════════════════════════════════════════════════════

class HotelSeason(models.Model):
    """موسم تسعيري لفندق — يربط اسم/نوع الموسم بفترات زمنية متعددة."""

    hotel = models.ForeignKey(
        'hotels.Hotel', on_delete=models.CASCADE,
        related_name='hotel_seasons', verbose_name='الفندق',
    )
    name = models.CharField(max_length=80, verbose_name='اسم الموسم')
    season_type = models.CharField(
        max_length=20, choices=SEASON_TYPE_CHOICES,
        default=SEASON_TYPE_FLAT, verbose_name='نوع الموسم',
    )
    sort_order = models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')
    notes = models.CharField(max_length=200, blank=True, default='', verbose_name='ملاحظات')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hotel_rates_season'
        ordering = ['hotel', 'sort_order', 'name']
        verbose_name        = 'موسم فندق'
        verbose_name_plural = 'مواسم الفنادق'
        indexes = [
            models.Index(fields=['hotel', 'season_type']),
            models.Index(fields=['hotel', 'is_active']),
        ]
        constraints = [
            models.UniqueConstraint(fields=['hotel', 'name'], name='uniq_season_name_per_hotel'),
        ]

    def __str__(self):
        return f'{self.hotel.name} — {self.name}'


class HotelSeasonDateRange(models.Model):
    """نطاق تاريخي ضمن موسم — يدعم Dash Resort الذي له 2-3 نطاقات منفصلة لكل موسم."""

    season = models.ForeignKey(
        HotelSeason, on_delete=models.CASCADE,
        related_name='date_ranges', verbose_name='الموسم',
    )
    start_date = models.DateField(verbose_name='من تاريخ')
    end_date   = models.DateField(verbose_name='إلى تاريخ')
    label = models.CharField(max_length=60, blank=True, default='', verbose_name='تسمية النطاق')

    class Meta:
        db_table = 'hotel_rates_season_date_range'
        ordering = ['season', 'start_date']
        verbose_name        = 'نطاق تاريخي للموسم'
        verbose_name_plural = 'نطاقات تاريخية للمواسم'
        indexes = [
            models.Index(fields=['season', 'start_date', 'end_date']),
            models.Index(fields=['start_date', 'end_date']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=models.Q(end_date__gte=models.F('start_date')),
                name='season_range_end_after_start',
            ),
        ]

    def __str__(self):
        return f'{self.season.name}: {self.start_date} → {self.end_date}'


# ═══════════════════════════════════════════════════════════
# RoomRate
# ═══════════════════════════════════════════════════════════

class RoomRate(models.Model):
    """صف تسعيري واحد لفئة غرفة — موسم × طبقة × يوم × إشغال."""

    room_category = models.ForeignKey(
        RoomCategory, on_delete=models.CASCADE,
        related_name='rates', verbose_name='فئة الغرفة',
    )
    season = models.ForeignKey(
        HotelSeason, on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='rates', verbose_name='الموسم',
        help_text='NULL = سعر ثابت طوال السنة',
    )
    pricing_tier = models.CharField(
        max_length=80,
        default=PRICING_TIER_FIT, db_index=True, verbose_name='طبقة التسعير',
        help_text='اسم الطبقة كما هو في PricingTierDef.name (نص حر)',
    )
    day_type = models.CharField(
        max_length=10, choices=DAY_TYPE_CHOICES,
        default=DAY_TYPE_ALL, verbose_name='نوع اليوم',
    )
    occupancy = models.CharField(
        max_length=10, choices=OCCUPANCY_CHOICES,
        default=OCCUPANCY_DOUBLE, verbose_name='الإشغال',
    )

    base_rate = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='السعر الأساسي لليلة')
    rate_with_breakfast = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name='سعر مع الإفطار',
    )
    extra_bed_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name='سعر سرير إضافي',
    )
    child_with_bed_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name='سعر طفل بسرير',
    )
    child_without_bed_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name='سعر طفل بدون سرير',
    )
    infant_bed_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name='سعر سرير الرضيع',
    )
    kid_breakfast_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name='سعر فطور طفل',
    )
    kid_breakfast_free = models.BooleanField(default=False, verbose_name='فطور أطفال مجاني')
    kid_breakfast_age_limit = models.PositiveSmallIntegerField(
        null=True, blank=True, verbose_name='الحد العمري للمجانية',
    )

    tax_inclusive = models.BooleanField(default=True, verbose_name='يشمل الضريبة')
    markup_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('10'),
        validators=[MinValueValidator(Decimal('0')), MaxValueValidator(Decimal('100'))],
        verbose_name='نسبة الربح %',
    )
    currency = models.CharField(max_length=3, default='MYR', verbose_name='العملة')

    notes = models.CharField(max_length=200, blank=True, default='', verbose_name='ملاحظات')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hotel_rates_room_rate'
        ordering = ['room_category', 'season', 'pricing_tier', 'day_type', 'occupancy']
        verbose_name        = 'تسعيرة غرفة'
        verbose_name_plural = 'تسعيرات الغرف'
        indexes = [
            models.Index(fields=['room_category', 'season', 'pricing_tier']),
            models.Index(fields=['room_category', 'is_active']),
            models.Index(fields=['pricing_tier', 'day_type']),
        ]
        constraints = [
            # Two partial uniques: PostgreSQL treats NULL as distinct, so we split on
            # season IS NULL (flat rates) vs season IS NOT NULL (seasonal rates).
            models.UniqueConstraint(
                fields=['room_category', 'season', 'pricing_tier', 'day_type', 'occupancy'],
                condition=models.Q(season__isnull=False),
                name='uniq_rate_matrix_cell_seasonal',
            ),
            models.UniqueConstraint(
                fields=['room_category', 'pricing_tier', 'day_type', 'occupancy'],
                condition=models.Q(season__isnull=True),
                name='uniq_rate_matrix_cell_flat',
            ),
            models.CheckConstraint(condition=models.Q(base_rate__gte=0), name='rate_base_non_negative'),
        ]

    def __str__(self):
        season = self.season.name if self.season else 'Flat'
        return (
            f'{self.room_category} | {season} | {self.get_pricing_tier_display()} | '
            f'{self.get_day_type_display()} = {self.base_rate} {self.currency}'
        )


# ═══════════════════════════════════════════════════════════
# HotelSurcharge
# ═══════════════════════════════════════════════════════════

class HotelSurcharge(models.Model):
    """رسوم إضافية على السعر — مرتبطة بأيام معينة أو نطاقات تاريخية أو يوم أسبوع.

    أمثلة:
      • Resort World Genting: +RM100 كل سبت → weekday=5, amount=100
      • Resort World Genting: +RM250 ل CNY 6-10 Feb 2027 → date_start/end + amount=250
    """

    hotel = models.ForeignKey(
        'hotels.Hotel', on_delete=models.CASCADE,
        related_name='surcharges', verbose_name='الفندق',
    )
    room_category = models.ForeignKey(
        RoomCategory, on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='surcharges', verbose_name='فئة غرفة',
    )

    name = models.CharField(max_length=120, verbose_name='التسمية')
    surcharge_type = models.CharField(
        max_length=12, choices=SURCHARGE_TYPE_CHOICES,
        default=SURCHARGE_TYPE_FIXED, verbose_name='نوع الرسم',
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='المبلغ / النسبة')

    weekday = models.SmallIntegerField(
        choices=WEEKDAY_CHOICES, null=True, blank=True, verbose_name='يوم الأسبوع',
    )
    date_start = models.DateField(null=True, blank=True, verbose_name='من تاريخ')
    date_end = models.DateField(null=True, blank=True, verbose_name='إلى تاريخ')

    applies_to_tier = models.CharField(
        max_length=20, choices=PRICING_TIER_CHOICES,
        blank=True, default='', verbose_name='ينطبق على طبقة',
    )

    notes = models.CharField(max_length=200, blank=True, default='', verbose_name='ملاحظات')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    class Meta:
        db_table = 'hotel_rates_surcharge'
        ordering = ['hotel', 'date_start', 'weekday']
        verbose_name        = 'رسم إضافي'
        verbose_name_plural = 'الرسوم الإضافية'
        indexes = [
            models.Index(fields=['hotel', 'is_active']),
            models.Index(fields=['hotel', 'weekday']),
            models.Index(fields=['date_start', 'date_end']),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(models.Q(weekday__isnull=False) | models.Q(date_start__isnull=False)),
                name='surcharge_must_have_weekday_or_date',
            ),
            models.CheckConstraint(
                condition=(
                    models.Q(date_end__isnull=True)
                    | models.Q(date_start__isnull=True)
                    | models.Q(date_end__gte=models.F('date_start'))
                ),
                name='surcharge_date_end_after_start',
            ),
        ]

    def __str__(self):
        when = self.get_weekday_display() if self.weekday is not None else f'{self.date_start}..{self.date_end}'
        sign = '%' if self.surcharge_type == SURCHARGE_TYPE_PERCENTAGE else 'RM'
        return f'{self.hotel.name} — {self.name} (+{self.amount}{sign} {when})'


# ═══════════════════════════════════════════════════════════
# RoomInclusion (package contents for Resort World Genting style)
# ═══════════════════════════════════════════════════════════

class RoomInclusion(models.Model):
    """عنصر مدرج في باقة فئة غرفة (Buffet Breakfast 2pax, Skyway Transfer Return 2pax, …)."""

    UNIT_PAX     = 'pax'
    UNIT_NIGHT   = 'night'
    UNIT_PIECE   = 'piece'
    UNIT_VOUCHER = 'voucher'
    UNIT_OTHER   = 'other'
    UNIT_CHOICES = [
        (UNIT_PAX,     'شخص'),
        (UNIT_NIGHT,   'ليلة'),
        (UNIT_PIECE,   'قطعة'),
        (UNIT_VOUCHER, 'قسيمة'),
        (UNIT_OTHER,   'أخرى'),
    ]

    room_category = models.ForeignKey(
        RoomCategory, on_delete=models.CASCADE,
        related_name='inclusions', verbose_name='فئة الغرفة',
    )
    label = models.CharField(max_length=160, verbose_name='التسمية')
    quantity = models.PositiveSmallIntegerField(default=1, verbose_name='الكمية')
    unit = models.CharField(
        max_length=10, choices=UNIT_CHOICES,
        default=UNIT_PAX, verbose_name='الوحدة',
    )
    sort_order = models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')

    class Meta:
        db_table = 'hotel_rates_room_inclusion'
        ordering = ['room_category', 'sort_order', 'id']
        verbose_name        = 'محتوى باقة'
        verbose_name_plural = 'محتويات الباقات'
        indexes = [
            models.Index(fields=['room_category']),
        ]

    def __str__(self):
        return f'{self.room_category} — {self.label} x{self.quantity} {self.get_unit_display()}'


# ═══════════════════════════════════════════════════════════
# PricingTierDef — طبقات التسعير المعرَّفة لكل فندق
# ═══════════════════════════════════════════════════════════

class PricingTierDef(models.Model):
    """طبقات تسعير قابلة للتخصيص لكل فندق (اسم حرّ + هامش ربح خاص بكل طبقة)."""

    hotel = models.ForeignKey(
        'hotels.Hotel', on_delete=models.CASCADE,
        related_name='pricing_tier_defs', verbose_name='الفندق',
    )
    name = models.CharField(
        max_length=80, default='', verbose_name='اسم الطبقة',
        help_text='يدخل يدوياً (FIT, GIT, Premium...)',
    )
    min_rooms_required = models.PositiveIntegerField(
        default=0,
        verbose_name='تبدأ من عدد الغرف',
    )
    max_rooms_required = models.PositiveIntegerField(
        null=True, blank=True,
        verbose_name='تنتهي عند عدد الغرف',
        help_text='اتركها فارغة إذا لم يكن هناك حد أقصى',
    )
    profit_margin_pct = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=Decimal('8'),
        verbose_name='نسبة العمولة %',
    )
    sort_order = models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hotel_rates_pricing_tier_def'
        ordering = ['hotel', 'sort_order', 'name']
        verbose_name        = 'طبقة تسعير'
        verbose_name_plural = 'طبقات التسعير'
        constraints = [
            models.UniqueConstraint(fields=['hotel', 'name'], name='uniq_tier_def_per_hotel'),
        ]

    def __str__(self):
        return f'{self.hotel.name} — {self.name} (>= {self.min_rooms_required} rooms, {self.profit_margin_pct}%)'


# ═══════════════════════════════════════════════════════════
# HotelGuestPricing — أسعار ضيوف على مستوى الفندق لكل طبقة
# ═══════════════════════════════════════════════════════════

class HotelGuestPricing(models.Model):
    """مصفوفة أسعار الضيوف الإضافيين على مستوى الفندق لكل طبقة تسعير.

    سرير إضافي + رضيع + طفل بسرير + طفل بدون سرير + فطور أطفال — لكل طبقة.
    """

    hotel = models.ForeignKey(
        'hotels.Hotel', on_delete=models.CASCADE,
        related_name='guest_pricing', verbose_name='الفندق',
    )
    tier = models.ForeignKey(
        PricingTierDef, on_delete=models.CASCADE,
        related_name='guest_pricing', verbose_name='طبقة التسعير',
    )

    extra_bed_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                          verbose_name='سعر سرير إضافي')

    infant_age_from = models.PositiveSmallIntegerField(default=0, verbose_name='عمر الرضيع من')
    infant_age_to   = models.PositiveSmallIntegerField(default=2, verbose_name='عمر الرضيع إلى')
    infant_price    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                          verbose_name='سعر الرضيع')

    child_with_bed_age_from = models.PositiveSmallIntegerField(default=7, verbose_name='عمر طفل بسرير من')
    child_with_bed_age_to   = models.PositiveSmallIntegerField(default=12, verbose_name='عمر طفل بسرير إلى')
    child_with_bed_price    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                                  verbose_name='سعر طفل بسرير')

    child_no_bed_age_from = models.PositiveSmallIntegerField(default=3, verbose_name='عمر طفل بدون سرير من')
    child_no_bed_age_to   = models.PositiveSmallIntegerField(default=6, verbose_name='عمر طفل بدون سرير إلى')
    child_no_bed_price    = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                                verbose_name='سعر طفل بدون سرير')

    child_breakfast_age_from = models.PositiveSmallIntegerField(default=3, verbose_name='عمر فطور الطفل من')
    child_breakfast_age_to   = models.PositiveSmallIntegerField(default=12, verbose_name='عمر فطور الطفل إلى')
    child_breakfast_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True,
                                                verbose_name='سعر فطور الأطفال')

    notes = models.CharField(max_length=200, blank=True, default='', verbose_name='ملاحظات')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'hotel_rates_guest_pricing'
        ordering = ['hotel', 'tier']
        verbose_name        = 'تسعيرة ضيوف'
        verbose_name_plural = 'تسعيرات الضيوف'
        constraints = [
            models.UniqueConstraint(fields=['hotel', 'tier'], name='uniq_guest_pricing_per_tier'),
        ]

    def __str__(self):
        return f'{self.hotel.name} — {self.tier.name} — Guest pricing'


# ═══════════════════════════════════════════════════════════
# RoomCategoryPhoto — صور لفئة الغرفة (multi-photo + primary)
# ═══════════════════════════════════════════════════════════

class RoomCategoryPhoto(models.Model):
    """صور متعددة لكل فئة غرفة، مع صورة رئيسية."""

    room_category = models.ForeignKey(
        RoomCategory, on_delete=models.CASCADE,
        related_name='photos', verbose_name='فئة الغرفة',
    )
    image = models.ImageField(upload_to='room_category_photos/%Y/%m/', verbose_name='الصورة')
    is_primary = models.BooleanField(default=False, verbose_name='رئيسية')
    order = models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')
    caption = models.CharField(max_length=200, blank=True, default='', verbose_name='التعليق')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'hotel_rates_room_category_photo'
        ordering = ['room_category', '-is_primary', 'order']
        verbose_name        = 'صورة فئة غرفة'
        verbose_name_plural = 'صور فئات الغرف'
        indexes = [
            models.Index(fields=['room_category', 'is_primary']),
            models.Index(fields=['room_category', 'order']),
        ]

    def save(self, *args, **kwargs):
        """عند جعلها رئيسية: ألغِ الـ primary من باقي الصور لنفس الفئة."""
        if self.is_primary:
            RoomCategoryPhoto.objects.filter(
                room_category=self.room_category,
                is_primary=True,
            ).exclude(pk=self.pk).update(is_primary=False)
            super().save(*args, **kwargs)
            # update parent category's image field with the primary image
            RoomCategory.objects.filter(pk=self.room_category_id).update(image=self.image.name)
            return
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.room_category.name} — Photo #{self.pk}'
