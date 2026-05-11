import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone


CABIN_CLASS_CHOICES = [
    ("economy", "Economy"),
    ("premium_economy", "Premium Economy"),
    ("business", "Business"),
    ("first", "First"),
]

PROVIDER_CHOICES = [
    ("duffel", "Duffel"),
]

CURRENCY_CHOICES = [
    ("MYR", "MYR"), ("USD", "USD"), ("SAR", "SAR"),
    ("AED", "AED"), ("SGD", "SGD"), ("EUR", "EUR"),
]


class FlightRoute(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    origin_iata = models.CharField(max_length=3)
    destination_iata = models.CharField(max_length=3)
    departure_date = models.DateField()
    return_date = models.DateField(null=True, blank=True)

    adults = models.PositiveSmallIntegerField(default=1)
    children = models.PositiveSmallIntegerField(default=0)
    cabin_class = models.CharField(max_length=20, choices=CABIN_CLASS_CHOICES, default="economy")

    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="MYR")

    display_title = models.CharField(max_length=200, blank=True)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default="duffel")

    is_active = models.BooleanField(default=False)
    last_refreshed_at = models.DateTimeField(null=True, blank=True)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="flight_routes_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "flights_route"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["origin_iata", "destination_iata", "departure_date"]),
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.origin_iata} → {self.destination_iata} ({self.departure_date})"

    def save(self, *args, **kwargs):
        self.origin_iata = (self.origin_iata or "").upper()
        self.destination_iata = (self.destination_iata or "").upper()
        super().save(*args, **kwargs)


class FlightOffer(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    route = models.ForeignKey(FlightRoute, on_delete=models.CASCADE, related_name="offers")

    provider_offer_id = models.CharField(max_length=128)
    owner_iata = models.CharField(max_length=3, blank=True)
    owner_name = models.CharField(max_length=120, blank=True)

    base_amount = models.DecimalField(max_digits=12, decimal_places=2)
    base_currency = models.CharField(max_length=3)
    commission_amount = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0.00"))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2)

    total_duration_min = models.PositiveIntegerField(default=0)
    slices_summary = models.JSONField(default=list, blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)

    expires_at = models.DateTimeField(null=True, blank=True)
    fetched_at = models.DateTimeField(default=timezone.now)

    class Meta:
        db_table = "flights_offer"
        ordering = ["total_amount"]
        indexes = [
            models.Index(fields=["route", "total_amount"]),
            models.Index(fields=["provider_offer_id"]),
        ]

    def __str__(self):
        return f"{self.owner_iata} {self.total_amount} {self.base_currency}"


class FlightSearchLog(models.Model):
    STATUS_CHOICES = [
        ("SUCCESS", "Success"),
        ("FAIL", "Fail"),
        ("CACHE_HIT", "Cache Hit"),
    ]

    route = models.ForeignKey(FlightRoute, on_delete=models.CASCADE, related_name="search_logs")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES)
    offers_count = models.PositiveIntegerField(default=0)
    duration_ms = models.PositiveIntegerField(default=0)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "flights_search_log"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["route", "-created_at"])]


class FlightBookingRequest(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("CONTACTED", "Contacted"),
        ("CONFIRMED", "Confirmed"),
        ("CANCELLED", "Cancelled"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    offer = models.ForeignKey(FlightOffer, on_delete=models.PROTECT, related_name="booking_requests")

    customer_name = models.CharField(max_length=150)
    customer_email = models.EmailField()
    customer_phone = models.CharField(max_length=32)
    passport_number = models.CharField(max_length=64, blank=True)
    passenger_count = models.PositiveSmallIntegerField(default=1)
    notes = models.TextField(blank=True)

    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default="PENDING")
    admin_notes = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "flights_booking_request"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["status", "-created_at"])]

    def __str__(self):
        return f"{self.customer_name} — {self.status}"
