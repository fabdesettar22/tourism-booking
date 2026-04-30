from django.db import models
from apps.locations.models import City


class ServiceCategory(models.Model):
    name        = models.CharField(max_length=100, verbose_name="اسم الفئة")
    slug        = models.SlugField(unique=True)
    description = models.TextField(blank=True, verbose_name="وصف الفئة")
    icon        = models.CharField(
        max_length=50, blank=True,
        verbose_name="أيقونة",
        help_text="اسم أيقونة lucide-react مثل: car, plane, ship"
    )

    def __str__(self):
        return self.name

    class Meta:
        verbose_name        = "فئة الخدمة"
        verbose_name_plural = "فئات الخدمات"


class Service(models.Model):

    SERVICE_TYPE_CHOICES = [
        ('transport',   'نقل'),
        ('tour',        'جولة سياحية'),
        ('activity',    'نشاط ترفيهي'),
        ('meal',        'وجبات'),
        ('visa',        'تأشيرة'),
        ('insurance',   'تأمين سفر'),
        ('flight',      'طيران'),
        ('other',       'أخرى'),
    ]

    category    = models.ForeignKey(
        ServiceCategory, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='services', verbose_name="الفئة"
    )
    city        = models.ForeignKey(
        City, on_delete=models.CASCADE,
        related_name='services', verbose_name="المدينة"
    )
    name        = models.CharField(max_length=200, verbose_name="اسم الخدمة")
    description = models.TextField(blank=True, verbose_name="وصف الخدمة")
    image       = models.ImageField(
        upload_to='services/', blank=True, null=True,
        verbose_name="صورة الخدمة"
    )
    service_type = models.CharField(
        max_length=20, choices=SERVICE_TYPE_CHOICES,
        default='other', verbose_name="نوع الخدمة"
    )

    # ── التسعير ───────────────────────────────────────────
    base_price          = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        verbose_name="السعر الأساسي"
    )
    currency            = models.CharField(
        max_length=3, default='MYR', verbose_name="العملة"
    )
    price_per           = models.CharField(
        max_length=20,
        choices=[('person','لكل شخص'),('group','للمجموعة'),('unit','للوحدة')],
        default='person', verbose_name="السعر لكل"
    )
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        blank=True, null=True, verbose_name="نسبة الخصم (%)"
    )

    # ── Unified Schema — بدل category_data JSONField ──────
    # خدمات النقل
    vehicle_type        = models.CharField(
        max_length=100, blank=True, verbose_name="نوع المركبة"
    )
    vehicle_capacity    = models.PositiveIntegerField(
        default=1, verbose_name="سعة المركبة"
    )
    pickup_location     = models.CharField(
        max_length=200, blank=True, verbose_name="نقطة الانطلاق"
    )
    dropoff_location    = models.CharField(
        max_length=200, blank=True, verbose_name="نقطة الوصول"
    )

    # خدمات الجولات والأنشطة
    duration_hours      = models.DecimalField(
        max_digits=5, decimal_places=1,
        null=True, blank=True, verbose_name="المدة بالساعات"
    )
    max_participants    = models.PositiveIntegerField(
        default=1, verbose_name="أقصى عدد مشاركين"
    )
    includes_guide      = models.BooleanField(
        default=False, verbose_name="يشمل مرشد سياحي"
    )
    includes_meals      = models.BooleanField(
        default=False, verbose_name="يشمل وجبات"
    )
    meeting_point       = models.CharField(
        max_length=200, blank=True, verbose_name="نقطة التجمع"
    )

    # بيانات إضافية مرنة (للحالات غير المغطاة)
    extra_data          = models.JSONField(
        default=dict, blank=True,
        verbose_name="بيانات إضافية",
        help_text="للحقول غير المغطاة بالـ schema الثابت"
    )

    # ── إعدادات عامة ──────────────────────────────────────
    is_optional     = models.BooleanField(
        default=True, verbose_name="خدمة اختيارية"
    )
    is_active       = models.BooleanField(
        default=False, verbose_name="نشطة"
    )
    commission_percentage = models.DecimalField(
        max_digits=5, decimal_places=2,
        null=True, blank=True,
        verbose_name="نسبة عمولة الوكالة (%)",
        help_text="مثلاً 20.00 تعني 20% فوق سعر المورد",
    )
    relative_day    = models.IntegerField(
        null=True, blank=True,
        verbose_name="اليوم النسبي في الباقة",
        help_text="فقط للخدمات المرتبطة بباقة. يُترك فارغاً للخدمات المستقلة."
    )
    created_at      = models.DateTimeField(auto_now_add=True)
    updated_at      = models.DateTimeField(auto_now=True)

    # ═══════════════════════════════════════════════
    # Computed Properties: commission, final_price
    # ═══════════════════════════════════════════════
    @property
    def commission_amount(self):
        """العمولة بالعملة (مثلاً 20 MYR)"""
        if self.base_price is None or self.commission_percentage is None:
            return None
        from decimal import Decimal
        return self.base_price * (self.commission_percentage / Decimal('100'))

    @property
    def final_price(self):
        """السعر النهائي للسائح = base_price + commission_amount"""
        if self.base_price is None or self.commission_percentage is None:
            return None
        return self.base_price + self.commission_amount

    @property
    def is_ready_for_activation(self):
        """هل الخدمة جاهزة للتفعيل؟ (تحتاج صورة + وصف + عمولة)"""
        has_image       = bool(self.image)
        has_description = bool(self.description and self.description.strip())
        has_commission  = self.commission_percentage is not None
        return has_image and has_description and has_commission

    @property
    def missing_for_activation(self):
        """قائمة بما ينقص الخدمة لتُفعَّل"""
        missing = []
        if not self.image:
            missing.append('image')
        if not (self.description and self.description.strip()):
            missing.append('description')
        if self.commission_percentage is None:
            missing.append('commission_percentage')
        return missing

    def __str__(self):
        return f"{self.name} - {self.city.name}"

    class Meta:
        verbose_name        = "خدمة"
        verbose_name_plural = "الخدمات"
        ordering            = ['city__name', 'category__name', 'name']
        indexes = [
            models.Index(fields=['city', 'service_type', 'is_active']),
            models.Index(fields=['base_price', 'currency']),
        ]

# ═══════════════════════════════════════════════════════════
# ServicePhoto — صور الخدمات الدائمة (بعد الموافقة)
# ═══════════════════════════════════════════════════════════

class ServicePhoto(models.Model):
    """
    صور الخدمة الدائمة.
    تُنشأ تلقائياً من WaitlistPhoto عند موافقة الأدمن.
    """
    service     = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='photos',
        verbose_name='الخدمة',
    )
    image       = models.ImageField(
        upload_to='services/photos/%Y/%m/',
        verbose_name='الصورة',
    )
    is_primary  = models.BooleanField(
        default=False,
        verbose_name='الصورة الرئيسية',
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
        return f"صورة {self.service.name} — {'رئيسية' if self.is_primary else f'#{self.order}'}"

    def save(self, *args, **kwargs):
        """نضمن صورة رئيسية واحدة فقط لكل خدمة."""
        if self.is_primary:
            ServicePhoto.objects.filter(
                service=self.service,
                is_primary=True,
            ).exclude(pk=self.pk).update(is_primary=False)
            # نُحدّث Service.image بالصورة الرئيسية
            super().save(*args, **kwargs)
            Service.objects.filter(pk=self.service_id).update(image=self.image.name)
            return
        super().save(*args, **kwargs)

    class Meta:
        db_table   = 'service_photo'
        ordering   = ['order', 'uploaded_at']
        verbose_name        = 'صورة خدمة'
        verbose_name_plural = 'صور الخدمات'
        indexes = [
            models.Index(fields=['service', 'is_primary']),
            models.Index(fields=['service', 'order']),
        ]
