"""نماذج الهدايا (شريحة، باقة ورد، تمر، ماء زمزم، أخرى).

تطبيق مستقل مرتبط بـ apps.services.Service عبر OneToOne — مثل airport_transfers
و tours_excursions. كل هدية لها سعر واحد + نسبة ربح، وعَلَم افتراضي يحدد ما إذا
كانت الهدية إجبارية أو اختيارية عند ضمها لباقة.
"""
from decimal import Decimal
from django.db import models


class Gift(models.Model):
    SUB_SIMCARD = 'sim_card'
    SUB_FLOWERS = 'flowers'
    SUB_DATES   = 'dates'
    SUB_ZAM_ZAM = 'zam_zam'
    SUB_OTHER   = 'other'
    SUBCATEGORY_CHOICES = [
        (SUB_SIMCARD, 'شريحة اتصال'),
        (SUB_FLOWERS, 'باقة ورد'),
        (SUB_DATES,   'تمر'),
        (SUB_ZAM_ZAM, 'ماء زمزم'),
        (SUB_OTHER,   'أخرى'),
    ]

    service = models.OneToOneField(
        'services.Service', on_delete=models.CASCADE,
        primary_key=True, related_name='gift',
        verbose_name='الخدمة',
    )

    subcategory = models.CharField(
        max_length=20, choices=SUBCATEGORY_CHOICES, default=SUB_OTHER,
        verbose_name='الفئة الفرعية',
    )
    default_is_mandatory = models.BooleanField(
        default=False,
        verbose_name='إجبارية افتراضياً',
        help_text='إذا كانت true، تُضاف الهدية تلقائياً لكل باقة بحالة إجبارية',
    )

    base_price = models.DecimalField(
        max_digits=12, decimal_places=2,
        verbose_name='السعر (MYR)',
    )
    currency   = models.CharField(
        max_length=3, default='MYR', editable=False,
        verbose_name='العملة',
    )
    profit_margin_pct = models.DecimalField(
        max_digits=5, decimal_places=2, default=Decimal('15'),
        verbose_name='نسبة الربح %',
    )

    description_ar = models.TextField(blank=True, verbose_name='الوصف بالعربية')
    description_en = models.TextField(blank=True, verbose_name='الوصف بالإنجليزية')
    notes          = models.TextField(blank=True, verbose_name='ملاحظات')

    class Meta:
        db_table = 'gift'
        ordering = ['subcategory', 'service__name']
        verbose_name        = 'هدية'
        verbose_name_plural = 'الهدايا'
        indexes = [models.Index(fields=['subcategory'])]

    def __str__(self):
        return f"[{self.get_subcategory_display()}] {self.service.name}"


class GiftPhoto(models.Model):
    """صور الهدية. حد أقصى 7 صور لكل هدية (يُفرض على مستوى view)."""
    gift        = models.ForeignKey(
        Gift, on_delete=models.CASCADE,
        related_name='photos', verbose_name='الهدية',
    )
    image       = models.ImageField(
        upload_to='gifts/photos/%Y/%m/',
        verbose_name='الصورة',
    )
    is_primary  = models.BooleanField(default=False, verbose_name='الصورة الرئيسية')
    order       = models.PositiveSmallIntegerField(default=0, verbose_name='الترتيب')
    caption     = models.CharField(max_length=200, blank=True, verbose_name='تعليق')
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'gift_photo'
        ordering = ['order', 'uploaded_at']
        indexes  = [models.Index(fields=['gift', 'is_primary'])]

    def save(self, *args, **kwargs):
        if self.is_primary:
            GiftPhoto.objects.filter(gift=self.gift, is_primary=True).exclude(pk=self.pk).update(is_primary=False)
        super().save(*args, **kwargs)
