"""نموذج الجولات السياحية والرحلات النهارية والترانسفرات بين المدن.

تطبيق مستقل مرتبط بـ apps.services.Service عبر OneToOne — مثل airport_transfers.
يغطي 4 أنواع: city_tour, day_trip, inter_city, island_jetty.
"""
from decimal import Decimal
from django.db import models


class Tour(models.Model):
    """جولة / رحلة نهارية / نقل بين المدن.

    العميل يختار الاتجاه عند الحجز (one_way / round_trip — الأخيرة = ضعف الأول).
    """

    # ── الأنواع ───────────────────────────────────────────
    TYPE_CITY_TOUR    = 'city_tour'
    TYPE_DAY_TRIP     = 'day_trip'
    TYPE_INTER_CITY   = 'inter_city'
    TYPE_ISLAND_JETTY = 'island_jetty'
    TYPE_CHOICES = [
        (TYPE_CITY_TOUR,    'جولة مدينة'),
        (TYPE_DAY_TRIP,     'رحلة نهارية'),
        (TYPE_INTER_CITY,   'نقل بين المدن'),
        (TYPE_ISLAND_JETTY, 'نقل إلى الجزر'),
    ]

    DURATION_HALF_DAY = 'half_day'
    DURATION_FULL_DAY = 'full_day'
    DURATION_ONE_WAY  = 'one_way'
    DURATION_CHOICES = [
        (DURATION_HALF_DAY, 'نصف يوم'),
        (DURATION_FULL_DAY, 'يوم كامل'),
        (DURATION_ONE_WAY,  'اتجاه واحد'),
    ]

    DIRECTION_ONE_WAY    = 'one_way'
    DIRECTION_ROUND_TRIP = 'round_trip'
    DIRECTION_CHOICES = [
        (DIRECTION_ONE_WAY,    'اتجاه واحد'),
        (DIRECTION_ROUND_TRIP, 'ذهاب وعودة'),
    ]

    # ── الربط ─────────────────────────────────────────────
    service = models.OneToOneField(
        'services.Service', on_delete=models.CASCADE,
        primary_key=True, related_name='tour',
        verbose_name='الخدمة',
    )

    # ── التصنيف ──────────────────────────────────────────
    tour_type = models.CharField(
        max_length=20, choices=TYPE_CHOICES,
        verbose_name='نوع الجولة',
    )
    duration = models.CharField(
        max_length=20, choices=DURATION_CHOICES,
        verbose_name='المدة',
    )

    # ── الموقع الجغرافي للخدمة ────────────────────────────
    country = models.ForeignKey(
        'locations.Country', on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='tours', verbose_name='الدولة',
    )
    city = models.ForeignKey(
        'locations.City', on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='tours', verbose_name='المدينة',
    )

    # ── الموقع — مرونة بين FK ونص حر ─────────────────────
    origin_city = models.ForeignKey(
        'locations.City', on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='tours_originating', verbose_name='مدينة الانطلاق',
    )
    origin_text = models.CharField(
        max_length=120, blank=True,
        verbose_name='منطقة الانطلاق',
        help_text='مثلاً: Bukit Bintang، Penang Airport',
    )
    destination_city = models.ForeignKey(
        'locations.City', on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='tours_arriving', verbose_name='مدينة الوصول',
    )
    destination_text = models.CharField(
        max_length=160,
        verbose_name='الوجهة',
        help_text='مثلاً: Sunway Lagoon، Cameron Highlands، Jetty Pangkor',
    )

    # ── الأسعار حسب شرائح pax (MYR، اتجاه واحد / يوم كامل) ──
    price_pax_1_2     = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='سعر 1-2 شخص (MYR)')
    price_pax_3_4     = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 3-4 أشخاص (MYR)')
    price_pax_5_6     = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 5-6 أشخاص (MYR)')
    price_pax_7_8     = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 7-8 أشخاص (MYR)')
    price_pax_10_12   = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 10-12 شخص (MYR)')
    price_pax_14      = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 14 شخص (MYR)')
    price_pax_40_bus  = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 40 شخص — حافلة كاملة (MYR)')

    # ── نسبة الربح % لكل شريحة (افتراضياً 15%) ────────────
    margin_pct_1_2    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('15'), verbose_name='نسبة الربح % لشريحة 1-2')
    margin_pct_3_4    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('15'), verbose_name='نسبة الربح % لشريحة 3-4')
    margin_pct_5_6    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('15'), verbose_name='نسبة الربح % لشريحة 5-6')
    margin_pct_7_8    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('15'), verbose_name='نسبة الربح % لشريحة 7-8')
    margin_pct_10_12  = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('15'), verbose_name='نسبة الربح % لشريحة 10-12')
    margin_pct_14     = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('15'), verbose_name='نسبة الربح % لشريحة 14')
    margin_pct_40_bus = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('15'), verbose_name='نسبة الربح % لحافلة 40')

    # ── إضافات ───────────────────────────────────────────
    tour_guide_fee_myr = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name='رسم مرشد سياحي (MYR)',
        help_text='يُضاف فقط لو طُلب — عادة لجولات المدن',
    )
    tour_guide_margin_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('15'),
        verbose_name='نسبة الربح على المرشد %',
        help_text='افتراضياً 15% — تُطبَّق على رسم المرشد عند تضمينه',
    )
    currency = models.CharField(max_length=3, default='MYR', editable=False, verbose_name='العملة')
    notes    = models.TextField(blank=True, verbose_name='ملاحظات')

    # ── الوصف ثنائي اللغة ────────────────────────────────
    description_ar = models.TextField(blank=True, verbose_name='الوصف بالعربية')
    description_en = models.TextField(blank=True, verbose_name='الوصف بالإنجليزية')

    class Meta:
        db_table   = 'tour_excursion'
        ordering   = ['tour_type', 'destination_text']
        verbose_name        = 'جولة سياحية'
        verbose_name_plural = 'الجولات السياحية والرحلات النهارية'
        indexes = [
            models.Index(fields=['tour_type', 'duration']),
            models.Index(fields=['destination_text']),
        ]

    def __str__(self):
        origin = self.origin_text or (self.origin_city.name if self.origin_city else '—')
        return f"[{self.get_tour_type_display()}] {origin} → {self.destination_text}"


class TourPhoto(models.Model):
    """صور الجولة السياحية. حد أقصى 7 صور لكل جولة."""
    tour        = models.ForeignKey(
        Tour, on_delete=models.CASCADE,
        related_name='photos', verbose_name='الجولة',
    )
    image       = models.ImageField(
        upload_to='tours/photos/%Y/%m/',
        verbose_name='الصورة',
    )
    is_primary  = models.BooleanField(default=False, verbose_name='الصورة الرئيسية')
    order       = models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')
    caption     = models.CharField(max_length=200, blank=True, verbose_name='تعليق')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'tour_photo'
        ordering = ['order', 'uploaded_at']
        indexes  = [models.Index(fields=['tour', 'is_primary'])]

    def __str__(self):
        return f"صورة {self.tour} — {'رئيسية' if self.is_primary else f'#{self.order}'}"

    def save(self, *args, **kwargs):
        if self.is_primary:
            TourPhoto.objects.filter(
                tour=self.tour, is_primary=True,
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
