# apps/locations/models.py
from django.db import models


class Country(models.Model):
    """
    Country model — متوافق مع GeoNames countryInfo.txt
    """
    # الحقول الأصلية
    name         = models.CharField(max_length=100, verbose_name="اسم الدولة")
    
    # حقول GeoNames — كلها nullable/blank ليسمح بالبيانات القديمة
    iso2         = models.CharField(max_length=2, blank=True, db_index=True,
                                    verbose_name="رمز ISO 2")  # e.g. "MY"
    iso3         = models.CharField(max_length=3, blank=True, verbose_name="رمز ISO 3")
    name_ar      = models.CharField(max_length=150, blank=True,
                                    verbose_name="الاسم بالعربية")
    name_en      = models.CharField(max_length=150, blank=True,
                                    verbose_name="الاسم بالإنجليزية")
    phone_code   = models.CharField(max_length=50, blank=True,
                                    verbose_name="رمز الهاتف")  # e.g. "+60"
    continent    = models.CharField(max_length=50, blank=True,
                                    verbose_name="القارة")  # AS, EU, AF, ...
    geoname_id   = models.IntegerField(null=True, blank=True, unique=True,
                                       verbose_name="GeoNames ID")
    
    def __str__(self):
        return self.name_ar or self.name or self.iso2

    class Meta:
        verbose_name        = "دولة"
        verbose_name_plural = "الدول"
        ordering            = ['name_ar', 'name']


class City(models.Model):
    """
    City model — متوافق مع GeoNames cities1000.zip
    """
    country      = models.ForeignKey(
        Country, on_delete=models.CASCADE, related_name='cities',
        verbose_name="الدولة"
    )
    # الحقول الأصلية
    name         = models.CharField(max_length=200, db_index=True,
                                    verbose_name="اسم المدينة")
    description  = models.TextField(blank=True, null=True, verbose_name="وصف المدينة")
    image        = models.ImageField(upload_to='cities/', blank=True, null=True,
                                     verbose_name="صورة المدينة")
    
    # حقول GeoNames — كلها nullable
    name_ar      = models.CharField(max_length=200, blank=True, db_index=True,
                                    verbose_name="الاسم بالعربية")
    name_en      = models.CharField(max_length=200, blank=True,
                                    verbose_name="الاسم بالإنجليزية")
    admin1       = models.CharField(max_length=100, blank=True,
                                    verbose_name="المنطقة الإدارية")  # مقاطعة/ولاية
    latitude     = models.DecimalField(max_digits=10, decimal_places=6,
                                       null=True, blank=True,
                                       verbose_name="خط العرض")
    longitude    = models.DecimalField(max_digits=10, decimal_places=6,
                                       null=True, blank=True,
                                       verbose_name="خط الطول")
    population   = models.IntegerField(default=0, db_index=True,
                                       verbose_name="عدد السكان")
    geoname_id   = models.IntegerField(null=True, blank=True, unique=True,
                                       verbose_name="GeoNames ID")
    
    def __str__(self):
        return f"{self.name_ar or self.name} — {self.country.name_ar or self.country.name}"

    class Meta:
        verbose_name        = "مدينة"
        verbose_name_plural = "المدن"
        ordering            = ['-population', 'name']
        indexes             = [
            models.Index(fields=['country', 'name']),
            models.Index(fields=['name_ar']),
        ]
