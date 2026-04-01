from django.db import models
from apps.locations.models import City

class Hotel(models.Model):
    city = models.ForeignKey(City, on_delete=models.CASCADE, related_name='hotels', verbose_name="المدينة")
    name = models.CharField(max_length=200, verbose_name="اسم الفندق")
    address = models.TextField(verbose_name="العنوان")
    stars = models.IntegerField(choices=[(i, f"{i} ★") for i in range(1, 6)], default=3, verbose_name="النجوم")
    description = models.TextField(blank=True, verbose_name="وصف الفندق")
    image = models.ImageField(upload_to='hotels/', blank=True, null=True, verbose_name="صورة الفندق")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "فندق"
        verbose_name_plural = "الفنادق"