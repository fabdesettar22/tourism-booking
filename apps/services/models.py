# apps/services/models.py
from django.db import models
from apps.locations.models import City


class ServiceCategory(models.Model):
    name = models.CharField(max_length=100, verbose_name="اسم الفئة")
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True, verbose_name="وصف الفئة")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "فئة الخدمة"
        verbose_name_plural = "فئات الخدمات"


class Service(models.Model):
    category = models.ForeignKey(
        ServiceCategory,
        on_delete=models.CASCADE,
        related_name='services',
        verbose_name="الفئة"
    )
    city = models.ForeignKey(
        City,
        on_delete=models.CASCADE,
        related_name='services',
        verbose_name="المدينة"
    )

    name = models.CharField(max_length=200, verbose_name="اسم الخدمة")
    description = models.TextField(blank=True, verbose_name="وصف الخدمة")

    base_price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="السعر الأساسي")
    currency = models.CharField(max_length=3, default='MYR', verbose_name="العملة")
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, blank=True, null=True, verbose_name="نسبة الخصم (%)"
    )

    breakfast_included = models.BooleanField(default=False, verbose_name="يشمل فطور / وجبات")
    vehicle_type = models.CharField(max_length=100, blank=True, verbose_name="نوع المركبة (للنقل)")
    max_participants = models.IntegerField(default=1, verbose_name="أقصى عدد مشاركين")
    is_optional = models.BooleanField(default=True, verbose_name="خدمة اختيارية")
    is_transfer = models.BooleanField(default=False, verbose_name="هل هي خدمة نقل؟")

    relative_day = models.IntegerField(verbose_name="اليوم النسبي في الباقة")
    category_data = models.JSONField(default=dict, blank=True, verbose_name="بيانات إضافية حسب الفئة")

    def __str__(self):
        return f"{self.name} - {self.city.name}"

    class Meta:
        verbose_name = "خدمة"
        verbose_name_plural = "الخدمات"
        ordering = ['city__name', 'category__name', 'name']