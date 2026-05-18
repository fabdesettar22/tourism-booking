from django.db import models
from apps.accounts.models import User, Agency
from apps.locations.models import Country, City
from apps.hotels.models import Hotel
from apps.services.models import Service
from apps.packages.models import CustomPackage
from apps.pricing.models import RoomPrice


class Booking(models.Model):

    BOOKING_TYPE_CHOICES = [
        ('agency', 'باقة الوكالة'),
        ('custom', 'باقة مخصصة'),
    ]
    STATUS_CHOICES = [
        ('pending',   'معلق للمراجعة'),
        ('confirmed', 'مؤكد'),
        ('cancelled', 'ملغي'),
        ('completed', 'مكتمل'),
    ]

    agency       = models.ForeignKey(
        Agency, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bookings',
        verbose_name="الوكالة"
    )
    created_by   = models.ForeignKey(
        User, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bookings',
        verbose_name="أنشئ بواسطة"
    )
    booking_type = models.CharField(
        max_length=10, choices=BOOKING_TYPE_CHOICES,
        default='custom', verbose_name="نوع الحجز"
    )
    status       = models.CharField(
        max_length=10, choices=STATUS_CHOICES,
        default='pending', verbose_name="حالة الحجز"
    )
    package      = models.ForeignKey(
        CustomPackage, on_delete=models.SET_NULL,
        null=True, blank=True, related_name='bookings',
        verbose_name="الباقة السياحية"
    )
    client_name  = models.CharField(max_length=200, verbose_name="اسم العميل")
    client_phone = models.CharField(max_length=20, verbose_name="رقم الهاتف")
    client_email = models.EmailField(blank=True, verbose_name="البريد الالكتروني")
    notes        = models.TextField(blank=True, verbose_name="ملاحظات")
    adults       = models.PositiveIntegerField(default=1, verbose_name="عدد البالغين")
    children     = models.PositiveIntegerField(default=0, verbose_name="عدد الاطفال")
    infants      = models.PositiveIntegerField(default=0, verbose_name="عدد الرضع")
    country      = models.ForeignKey(
        Country, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name="الدولة المقصودة"
    )
    total_price  = models.DecimalField(
        max_digits=12, decimal_places=2,
        null=True, blank=True, verbose_name="السعر الاجمالي"
    )
    currency     = models.CharField(max_length=3, default='MYR', verbose_name="العملة")
    reference_number = models.CharField(
        max_length=20, unique=True, blank=True,
        verbose_name="رقم المرجع"
    )
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    def save(self, *args, **kwargs):
        if not self.reference_number:
            import uuid
            self.reference_number = f"YNT-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.reference_number} - {self.client_name}"

    class Meta:
        verbose_name        = "حجز"
        verbose_name_plural = "الحجوزات"
        ordering            = ['-created_at']


class BookingPerson(models.Model):
    PERSON_TYPE = [
        ('adult',  'بالغ'),
        ('child',  'طفل'),
        ('infant', 'رضيع'),
    ]
    booking     = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='persons'
    )
    person_type = models.CharField(max_length=10, choices=PERSON_TYPE)
    age         = models.PositiveIntegerField(null=True, blank=True, verbose_name="العمر")
    name        = models.CharField(max_length=100, blank=True, verbose_name="الاسم")

    class Meta:
        verbose_name        = "فرد في الحجز"
        verbose_name_plural = "افراد الحجز"


class BookingCity(models.Model):
    booking = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='cities'
    )
    city    = models.ForeignKey(
        City, on_delete=models.CASCADE, verbose_name="المدينة"
    )
    nights  = models.PositiveIntegerField(default=1, verbose_name="عدد الليالي")
    order   = models.PositiveIntegerField(default=0, verbose_name="الترتيب")

    class Meta:
        ordering            = ['order']
        verbose_name        = "مدينة في الحجز"
        verbose_name_plural = "مدن الحجز"


class BookingHotel(models.Model):

    ROOM_TYPE_CHOICES = [
        ('standard', 'Standard'),
        ('single',   'Single'),
        ('double',   'Double'),
        ('twin',     'Twin'),
        ('triple',   'Triple'),
        ('family',   'Family'),
        ('suite',    'Suite'),
        ('deluxe',   'Deluxe'),
    ]

    booking_city             = models.ForeignKey(
        BookingCity, on_delete=models.CASCADE, related_name='hotels'
    )
    hotel                    = models.ForeignKey(
        Hotel, on_delete=models.CASCADE, verbose_name="الفندق"
    )
    room_price               = models.ForeignKey(
        RoomPrice, on_delete=models.SET_NULL,
        null=True, blank=True, verbose_name="تسعير الغرفة"
    )
    room_type                = models.CharField(
        max_length=20, choices=ROOM_TYPE_CHOICES,
        default='double', verbose_name="نوع الغرفة"
    )
    nights                   = models.PositiveIntegerField(default=1, verbose_name="عدد الليالي")
    rooms_count              = models.PositiveIntegerField(default=1, verbose_name="عدد الغرف")
    price_per_night_snapshot = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        verbose_name="سعر الليلة وقت الحجز"
    )
    currency_snapshot        = models.CharField(
        max_length=3, default='MYR',
        verbose_name="العملة وقت الحجز"
    )

    class Meta:
        verbose_name        = "فندق في الحجز"
        verbose_name_plural = "فنادق الحجز"


class BookingService(models.Model):
    booking           = models.ForeignKey(
        Booking, on_delete=models.CASCADE, related_name='services'
    )
    service           = models.ForeignKey(
        Service, on_delete=models.CASCADE, verbose_name="الخدمة"
    )
    quantity          = models.PositiveIntegerField(default=1, verbose_name="الكمية")
    price_snapshot    = models.DecimalField(
        max_digits=10, decimal_places=2,
        null=True, blank=True,
        verbose_name="السعر وقت الحجز"
    )
    currency_snapshot = models.CharField(
        max_length=3, default='MYR',
        verbose_name="العملة وقت الحجز"
    )

    class Meta:
        verbose_name        = "خدمة في الحجز"
        verbose_name_plural = "خدمات الحجز"


# ════════════════════════════════════════════════════════════
# Detailed booking lines — per-room allocation, tours, transfers,
# flights, and the mandatory package gift. كل سطر يحفظ snapshot
# للأسعار (MYR + EUR + USD) لحظة الحجز للأرشفة المحاسبية.
# ════════════════════════════════════════════════════════════


class _PriceSnapshotMixin(models.Model):
    """حقول snapshot موحّدة لكل سطر حجز.

    يحفظ التكلفة + العمولة + المجموع بـ MYR (المصدر) و EUR + USD (للعرض).
    """
    cost_myr        = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="التكلفة (MYR)")
    commission_pct  = models.DecimalField(max_digits=5,  decimal_places=2, null=True, blank=True, verbose_name="نسبة العمولة %")
    commission_myr  = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="العمولة (MYR)")
    total_myr       = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="المجموع (MYR)")
    total_eur       = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="المجموع (EUR)")
    total_usd       = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True, verbose_name="المجموع (USD)")
    fx_rate_eur     = models.DecimalField(max_digits=12, decimal_places=6, null=True, blank=True, verbose_name="سعر صرف EUR وقت الحجز")
    fx_rate_usd     = models.DecimalField(max_digits=12, decimal_places=6, null=True, blank=True, verbose_name="سعر صرف USD وقت الحجز")
    snapshot_at     = models.DateTimeField(auto_now_add=True, verbose_name="تاريخ تثبيت السعر")

    class Meta:
        abstract = True


class BookingRoom(_PriceSnapshotMixin):
    """توزيع صريح لكل غرفة محجوزة داخل فندق معيّن.

    العائلة من 5 أفراد تحتاج غرفتين → سجلان BookingRoom:
      Room 1: 2 بالغ + 1 طفل + سرير إضافي طفل (with bed)
      Room 2: 2 طفل (without bed)

    الفندق سيعرف تركيبة كل غرفة بدقة.
    """
    booking_hotel        = models.ForeignKey(
        BookingHotel, on_delete=models.CASCADE,
        related_name='rooms', verbose_name="فندق الحجز"
    )
    room_type            = models.ForeignKey(
        'rooms.RoomType', on_delete=models.PROTECT,
        verbose_name="نوع الغرفة"
    )
    # التوزيع الصريح للأفراد في هذه الغرفة
    adults_in_room       = models.PositiveSmallIntegerField(default=0, verbose_name="بالغين في الغرفة")
    children_in_room     = models.PositiveSmallIntegerField(default=0, verbose_name="أطفال في الغرفة")
    infants_in_room      = models.PositiveSmallIntegerField(default=0, verbose_name="رضع في الغرفة")
    # الأسرّة الإضافية (تقابل أعمدة RoomPrice)
    children_with_bed    = models.PositiveSmallIntegerField(default=0, verbose_name="أطفال بسرير إضافي")
    children_without_bed = models.PositiveSmallIntegerField(default=0, verbose_name="أطفال بدون سرير")
    infants_with_bed     = models.PositiveSmallIntegerField(default=0, verbose_name="رضع بسرير")
    infants_without_bed  = models.PositiveSmallIntegerField(default=0, verbose_name="رضع بدون سرير")

    class Meta:
        verbose_name        = "غرفة في الحجز"
        verbose_name_plural = "غرف الحجز"
        indexes             = [models.Index(fields=['booking_hotel'])]

    def __str__(self):
        return f"{self.room_type.name} ({self.adults_in_room}+{self.children_in_room}+{self.infants_in_room})"


class BookingTour(_PriceSnapshotMixin):
    """جولة سياحية مختارة في الحجز (متعددة لكل حجز، مفلترة حسب مدن الباقة)."""
    DIRECTION_CHOICES = [
        ('one_way',    'اتجاه واحد'),
        ('round_trip', 'ذهاب وعودة'),
    ]

    booking          = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='tours', verbose_name="الحجز")
    tour             = models.ForeignKey('tours_excursions.Tour', on_delete=models.PROTECT, verbose_name="الجولة")
    city             = models.ForeignKey(City, on_delete=models.PROTECT, null=True, blank=True, verbose_name="المدينة")
    direction        = models.CharField(max_length=15, choices=DIRECTION_CHOICES, default='one_way', verbose_name="الاتجاه")
    include_guide    = models.BooleanField(default=False, verbose_name="يشمل مرشد سياحي")
    day_index        = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name="رقم اليوم في الرحلة")
    pax_total        = models.PositiveSmallIntegerField(default=0, verbose_name="إجمالي الأفراد المحتسبين")
    tier_used        = models.CharField(max_length=30, blank=True, verbose_name="شريحة السعر المستخدمة")

    class Meta:
        verbose_name        = "جولة في الحجز"
        verbose_name_plural = "جولات الحجز"
        indexes             = [models.Index(fields=['booking', 'tour'])]
        ordering            = ['day_index', 'pk']

    def __str__(self):
        return f"{self.tour} × {self.pax_total} pax"


class BookingTransfer(_PriceSnapshotMixin):
    """نقل مطار/intercity مختار في الحجز."""
    DIRECTION_CHOICES = [
        ('to_hotel',   'مطار → فندق'),
        ('to_airport', 'فندق → مطار'),
        ('round_trip', 'ذهاب وعودة'),
    ]

    booking       = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='transfers', verbose_name="الحجز")
    transfer      = models.ForeignKey('airport_transfers.AirportTransfer', on_delete=models.PROTECT, verbose_name="خدمة النقل")
    direction     = models.CharField(max_length=15, choices=DIRECTION_CHOICES, default='to_hotel', verbose_name="الاتجاه")
    include_guide = models.BooleanField(default=False, verbose_name="يشمل مرشد سياحي")
    pax_total     = models.PositiveSmallIntegerField(default=0, verbose_name="إجمالي الأفراد")
    tier_used     = models.CharField(max_length=30, blank=True, verbose_name="شريحة السعر المستخدمة")

    class Meta:
        verbose_name        = "نقل في الحجز"
        verbose_name_plural = "خدمات النقل في الحجز"
        indexes             = [models.Index(fields=['booking', 'transfer'])]

    def __str__(self):
        return f"{self.transfer} ({self.get_direction_display()})"


class BookingFlight(_PriceSnapshotMixin):
    """رحلة طيران مختارة (دولية أو داخلية) عبر Duffel أو يدوياً."""
    SCOPE_CHOICES = [
        ('international', 'دولي'),
        ('domestic',      'داخلي'),
    ]

    booking            = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='flights', verbose_name="الحجز")
    flight_route       = models.ForeignKey(
        'flights.FlightRoute', on_delete=models.PROTECT,
        null=True, blank=True,
        verbose_name="مسار الطيران",
    )
    scope              = models.CharField(max_length=15, choices=SCOPE_CHOICES, default='international', verbose_name="النطاق")
    duffel_offer_id    = models.CharField(max_length=120, blank=True, verbose_name="معرّف عرض Duffel")
    carrier_iata       = models.CharField(max_length=8, blank=True, verbose_name="شركة الطيران (IATA)")
    carrier_name       = models.CharField(max_length=120, blank=True, verbose_name="اسم شركة الطيران")
    origin_iata        = models.CharField(max_length=8, blank=True, verbose_name="مطار الانطلاق")
    destination_iata   = models.CharField(max_length=8, blank=True, verbose_name="مطار الوصول")
    departure_at       = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ المغادرة")
    return_at          = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ العودة")
    pax_adults         = models.PositiveSmallIntegerField(default=0)
    pax_children       = models.PositiveSmallIntegerField(default=0)
    pax_infants        = models.PositiveSmallIntegerField(default=0)
    raw_offer_payload  = models.JSONField(null=True, blank=True, verbose_name="حمولة العرض الأصلية")

    class Meta:
        verbose_name        = "طيران في الحجز"
        verbose_name_plural = "رحلات الطيران في الحجز"
        indexes             = [models.Index(fields=['booking', 'scope'])]

    def __str__(self):
        return f"[{self.scope}] {self.origin_iata}→{self.destination_iata}"


class BookingGift(_PriceSnapshotMixin):
    """الهدية المرتبطة بالباقة (إجبارية)، snapshot وقت الحجز."""
    booking      = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name='gifts', verbose_name="الحجز")
    gift         = models.ForeignKey('gifts.Gift', on_delete=models.PROTECT, verbose_name="الهدية")
    unit_count   = models.PositiveSmallIntegerField(default=0, verbose_name="عدد الوحدات (أفراد محتسبين)")

    class Meta:
        verbose_name        = "هدية في الحجز"
        verbose_name_plural = "هدايا الحجز"
        indexes             = [models.Index(fields=['booking', 'gift'])]

    def __str__(self):
        return f"{self.gift} × {self.unit_count}"
