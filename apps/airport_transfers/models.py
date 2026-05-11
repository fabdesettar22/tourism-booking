"""نماذج خدمة النقل من/إلى المطار.

تطبيق مستقل مرتبط بـ apps.services.Service عبر OneToOne، فيظهر داخل قسم
الخدمات في لوحة التحكم بينما يحتفظ بكل منطقه (نماذج، تسعير، APIs) منفصلاً.
"""
from decimal import Decimal
from django.db import models


class Airport(models.Model):
    """مطار — مرتبط بمدينة محلية. نقطة انطلاق/وصول لخدمات النقل."""

    code      = models.CharField(max_length=10, unique=True, verbose_name='رمز المطار')
    name      = models.CharField(max_length=120, verbose_name='اسم المطار')
    city      = models.ForeignKey(
        'locations.City', on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='airports', verbose_name='المدينة',
    )
    is_active = models.BooleanField(default=True, verbose_name='نشط')

    class Meta:
        db_table = 'airport'
        ordering = ['code']
        verbose_name        = 'مطار'
        verbose_name_plural = 'المطارات'

    def __str__(self):
        return f"{self.code} — {self.name}"


class AirportTransfer(models.Model):
    """امتداد لـ Service: تحويل من/إلى مطار محدد لفندق محدد.

    سجل واحد يغطي الاتجاهات الثلاثة (مطار→فندق، فندق→مطار، ذهاب وعودة).
    العميل يختار الاتجاه عند الحجز؛ ذهاب وعودة = ضعف الاتجاه الواحد.
    """

    DIRECTION_TO_HOTEL    = 'to_hotel'
    DIRECTION_TO_AIRPORT  = 'to_airport'
    DIRECTION_ROUND_TRIP  = 'round_trip'
    DIRECTION_CHOICES = [
        (DIRECTION_TO_HOTEL,   'مطار → فندق'),
        (DIRECTION_TO_AIRPORT, 'فندق → مطار'),
        (DIRECTION_ROUND_TRIP, 'ذهاب وعودة'),
    ]

    service = models.OneToOneField(
        'services.Service', on_delete=models.CASCADE,
        primary_key=True, related_name='airport_transfer',
        verbose_name='الخدمة',
    )
    airport = models.ForeignKey(
        Airport, on_delete=models.PROTECT,
        related_name='transfers', verbose_name='المطار',
    )
    hotel = models.ForeignKey(
        'hotels.Hotel', on_delete=models.PROTECT,
        related_name='airport_transfers', verbose_name='الفندق',
    )

    # ── الموقع الجغرافي للخدمة ────────────────────────────
    country = models.ForeignKey(
        'locations.Country', on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='airport_transfers', verbose_name='الدولة',
    )
    city = models.ForeignKey(
        'locations.City', on_delete=models.PROTECT,
        null=True, blank=True,
        related_name='airport_transfers', verbose_name='المدينة',
    )

    # ── الأسعار الأساسية حسب شرائح pax (MYR، اتجاه واحد) ─────
    price_pax_1_2     = models.DecimalField(max_digits=12, decimal_places=2, verbose_name='سعر 1-2 شخص (MYR)')
    price_pax_3_4     = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 3-4 أشخاص (MYR)')
    price_pax_5_6     = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 5-6 أشخاص (MYR)')
    price_pax_7_8     = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 7-8 أشخاص (MYR)')
    price_pax_10_12   = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 10-12 شخص (MYR)')
    price_pax_14      = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 14 شخص (MYR)')
    price_pax_40_bus  = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name='سعر 40 شخص — حافلة كاملة (MYR)')

    # ── نسبة الربح % لكل شريحة (افتراضياً 10%) ────────────────
    margin_pct_1_2    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 1-2')
    margin_pct_3_4    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 3-4')
    margin_pct_5_6    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 5-6')
    margin_pct_7_8    = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 7-8')
    margin_pct_10_12  = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 10-12')
    margin_pct_14     = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لشريحة 14')
    margin_pct_40_bus = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('10'), verbose_name='نسبة الربح % لحافلة 40')

    # ── إضافات اختيارية ───────────────────────────────────────
    tour_guide_fee_myr = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        verbose_name='رسم مرشد سياحي (MYR)',
    )
    tour_guide_margin_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('10'),
        verbose_name='نسبة الربح على المرشد %',
        help_text='افتراضياً 10% — تُطبَّق على رسم المرشد عند تضمينه',
    )
    currency = models.CharField(max_length=3, default='MYR', editable=False, verbose_name='العملة')
    notes    = models.TextField(blank=True, verbose_name='ملاحظات')

    # ── الوصف ثنائي اللغة ────────────────────────────────
    description_ar = models.TextField(blank=True, verbose_name='الوصف بالعربية')
    description_en = models.TextField(blank=True, verbose_name='الوصف بالإنجليزية')

    class Meta:
        db_table   = 'airport_transfer'
        ordering   = ['airport__code', 'hotel__name']
        verbose_name        = 'نقل من/إلى المطار'
        verbose_name_plural = 'النقل من/إلى المطار'
        unique_together = ['airport', 'hotel']
        indexes = [
            models.Index(fields=['airport', 'hotel']),
        ]

    def __str__(self):
        return f"{self.airport.code} ↔ {self.hotel.name}"


class AirportTransferPhoto(models.Model):
    """صور خدمة النقل من المطار. حد أقصى 7 صور لكل خدمة (يُفرض على مستوى view)."""
    transfer    = models.ForeignKey(
        AirportTransfer, on_delete=models.CASCADE,
        related_name='photos', verbose_name='الخدمة',
    )
    image       = models.ImageField(
        upload_to='airport_transfers/photos/%Y/%m/',
        verbose_name='الصورة',
    )
    is_primary  = models.BooleanField(default=False, verbose_name='الصورة الرئيسية')
    order       = models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')
    caption     = models.CharField(max_length=200, blank=True, verbose_name='تعليق')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'airport_transfer_photo'
        ordering = ['order', 'uploaded_at']
        indexes  = [models.Index(fields=['transfer', 'is_primary'])]

    def __str__(self):
        return f"صورة {self.transfer} — {'رئيسية' if self.is_primary else f'#{self.order}'}"

    def save(self, *args, **kwargs):
        # ضمان صورة رئيسية واحدة فقط
        if self.is_primary:
            AirportTransferPhoto.objects.filter(
                transfer=self.transfer, is_primary=True,
            ).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
