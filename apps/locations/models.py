from django.db import models

class Country(models.Model):
    name = models.CharField(max_length=100, verbose_name="اسم الدولة")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "دولة"
        verbose_name_plural = "الدول"


class City(models.Model):
    country = models.ForeignKey(
        Country, 
        on_delete=models.CASCADE, 
        related_name='cities', 
        verbose_name="الدولة"
    )
    name = models.CharField(max_length=100, verbose_name="اسم المدينة")
    description = models.TextField(blank=True, null=True, verbose_name="وصف المدينة")
    
    # ← الحقل الجديد للصورة
    image = models.ImageField(
        upload_to='cities/', 
        blank=True, 
        null=True, 
        verbose_name="صورة المدينة"
    )

    def __str__(self):
        return f"{self.name} - {self.country.name}"

    class Meta:
        verbose_name = "مدينة"
        verbose_name_plural = "المدن"