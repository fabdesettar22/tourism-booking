from django.db import models
from apps.hotels.models import Hotel


class RoomType(models.Model):
    hotel = models.ForeignKey(
        Hotel, 
        on_delete=models.CASCADE, 
        related_name='room_types', 
        verbose_name="الفندق"
    )
    name = models.CharField(max_length=100, verbose_name="نوع الغرفة")
    max_occupancy = models.IntegerField(verbose_name="أقصى عدد نزلاء")
    description = models.TextField(blank=True, verbose_name="وصف الغرفة")
    image = models.ImageField(upload_to='rooms/', blank=True, null=True, verbose_name="صورة الغرفة")

    # الحقول المالية أصبحت اختيارية (لأن الأسعار ستكون في تطبيق pricing)
    price_per_night = models.DecimalField(
        max_digits=10, decimal_places=2, 
        blank=True, null=True, 
        verbose_name="السعر لليلة"
    )
    currency = models.CharField(max_length=3, default='MYR', blank=True, verbose_name="العملة")
    discount_percentage = models.DecimalField(
        max_digits=5, decimal_places=2, 
        blank=True, null=True, 
        verbose_name="نسبة الخصم (%)"
    )
    breakfast_included = models.BooleanField(default=False, verbose_name="يشمل فطور الصباح")

    season_name = models.CharField(max_length=100, blank=True, verbose_name="اسم الموسم")
    valid_from = models.DateField(blank=True, null=True, verbose_name="سارية من")
    valid_to = models.DateField(blank=True, null=True, verbose_name="سارية إلى")

    def __str__(self):
        return f"{self.name} - {self.hotel.name}"

    class Meta:
        verbose_name = "نوع غرفة"
        verbose_name_plural = "أنواع الغرف"