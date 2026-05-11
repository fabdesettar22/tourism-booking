from decimal import Decimal

from django.db import models

from apps.locations.models import City


class Hotel(models.Model):

    PROVIDER_TYPE_CHOICES = [
        ('direct',  'عقد مباشر'),
        ('agoda',   'Agoda'),
        ('booking', 'Booking.com'),
        ('expedia', 'Expedia'),
        ('custom',  'مزود مخصص'),
    ]

    city        = models.ForeignKey(
        City, on_delete=models.CASCADE,
        related_name='hotels', verbose_name="المدينة"
    )
    name        = models.CharField(max_length=200, verbose_name="اسم الفندق")
    address     = models.TextField(blank=True, default='', verbose_name="العنوان")
    stars       = models.DecimalField(
        max_digits=2, decimal_places=1,
        default=Decimal('3'),
        verbose_name="النجوم",
        help_text="من 1 إلى 5، يدعم النصف نجمة (4.5)",
    )
    description = models.TextField(blank=True, verbose_name="وصف الفندق")
    description_ar = models.TextField(blank=True, default='', verbose_name="الوصف بالعربية")
    description_en = models.TextField(blank=True, default='', verbose_name="الوصف بالإنجليزية")
    image       = models.ImageField(
        upload_to='hotels/', blank=True, null=True, verbose_name="صورة الفندق"
    )
    latitude    = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True, verbose_name="خط العرض"
    )
    longitude   = models.DecimalField(
        max_digits=9, decimal_places=6,
        null=True, blank=True, verbose_name="خط الطول"
    )
    amenities   = models.JSONField(
        default=list, blank=True, verbose_name="المرافق والخدمات"
    )
    check_in_time  = models.TimeField(null=True, blank=True, verbose_name="وقت الدخول")
    check_out_time = models.TimeField(null=True, blank=True, verbose_name="وقت المغادرة")
    phone       = models.CharField(max_length=30, blank=True, verbose_name="هاتف الفندق")
    email       = models.EmailField(blank=True, verbose_name="بريد الفندق")
    website     = models.URLField(blank=True, verbose_name="الموقع الإلكتروني")
    provider_type = models.CharField(
        max_length=20, choices=PROVIDER_TYPE_CHOICES,
        default='direct', verbose_name="نوع المزود"
    )
    is_active   = models.BooleanField(default=False, verbose_name="نشط")
    # ── العمولة ─────────────────────────────────────────
    commission_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        verbose_name="نسبة عمولة الوكالة (%)",
        help_text="مثلاً 20.00 تعني 20% فوق سعر المورد",
    )
    # ── حقول كتيب الأسعار (YOUNEED 2026) ─────────────────
    hotel_chain = models.CharField(
        max_length=80, blank=True, default='', db_index=True,
        verbose_name="سلسلة الفنادق",
        help_text="Mercure, Holiday Inn, Ibis Style, Resort World, Thistle...",
    )
    default_margin_pct = models.DecimalField(
        max_digits=5, decimal_places=2,
        default=Decimal('10'),
        verbose_name="نسبة الربح الافتراضية %",
        help_text="تستخدم كقيمة أولية لـ RoomRate.markup_pct عند الإنشاء (6-10% عادة)",
    )
    rate_currency = models.CharField(
        max_length=3, default='MYR',
        verbose_name="عملة كتيب الأسعار",
    )
    tax_per_night_per_room = models.DecimalField(
        max_digits=10, decimal_places=2,
        default=Decimal('0'),
        verbose_name="الضريبة لليلة الواحدة للغرفة الواحدة",
    )
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    # ═══════════════════════════════════════════════
    # Computed Properties: commission, final_price
    # ═══════════════════════════════════════════════
    @property
    def commission_amount(self):
        """العمولة بالعملة (مثلاً 20 MYR)"""
        # ملاحظة: الفنادق يُسعَّرون عبر الغرف، لذا base_price ليس على Hotel مباشرة
        # نُرجع None هنا، الحساب الفعلي يحدث على Room
        return None

    @property
    def is_ready_for_activation(self):
        """هل الفندق جاهز للتفعيل؟ (يحتاج صورة + وصف فقط — العمولة اختيارية)"""
        has_image       = bool(self.image)
        has_description = bool(
            (self.description and self.description.strip())
            or (self.description_ar and self.description_ar.strip())
            or (self.description_en and self.description_en.strip())
        )
        return has_image and has_description

    @property
    def missing_for_activation(self):
        """قائمة بما ينقص الفندق ليُفعَّل"""
        missing = []
        if not self.image:
            missing.append('image')
        if not (
            (self.description and self.description.strip())
            or (self.description_ar and self.description_ar.strip())
            or (self.description_en and self.description_en.strip())
        ):
            missing.append('description')
        return missing

    def __str__(self):
        return self.name

    class Meta:
        verbose_name        = "فندق"
        verbose_name_plural = "الفنادق"
        indexes = [
            models.Index(fields=['city', 'stars', 'is_active']),
            models.Index(fields=['provider_type']),
        ]

# ═══════════════════════════════════════════════════════════
# HotelPhoto — صور الفنادق الدائمة (بعد الموافقة)
# ═══════════════════════════════════════════════════════════

class HotelPhoto(models.Model):
    """
    صور الفندق الدائمة.
    تُنشأ تلقائياً من WaitlistPhoto عند موافقة الأدمن.
    يمكن للأدمن إضافة صور يدوياً لاحقاً.
    """
    hotel       = models.ForeignKey(
        Hotel,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name='الفندق',
    )
    image       = models.ImageField(
        upload_to='hotels/photos/%Y/%m/',
        verbose_name='الصورة',
    )
    is_primary  = models.BooleanField(
        default=False,
        verbose_name='الصورة الرئيسية',
        help_text='تظهر كأول صورة في صفحة الفندق',
    )
    order       = models.PositiveSmallIntegerField(
        default=0,
        verbose_name='ترتيب العرض',
    )
    caption     = models.CharField(
        max_length=200, blank=True,
        verbose_name='تعليق على الصورة',
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"صورة {self.hotel.name} — {'رئيسية' if self.is_primary else f'#{self.order}'}"

    def save(self, *args, **kwargs):
        """نضمن صورة رئيسية واحدة فقط لكل فندق."""
        if self.is_primary:
            HotelPhoto.objects.filter(
                hotel=self.hotel,
                is_primary=True,
            ).exclude(pk=self.pk).update(is_primary=False)
            # نُحدّث Hotel.image بالصورة الرئيسية
            super().save(*args, **kwargs)
            Hotel.objects.filter(pk=self.hotel_id).update(image=self.image.name)
            return
        super().save(*args, **kwargs)

    class Meta:
        db_table   = 'hotel_photo'
        ordering   = ['order', 'uploaded_at']
        verbose_name        = 'صورة فندق'
        verbose_name_plural = 'صور الفنادق'
        indexes = [
            models.Index(fields=['hotel', 'is_primary']),
            models.Index(fields=['hotel', 'order']),
        ]
