import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models


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
    """Admin-defined sellable route (origin → destination) with a commission percentage.

    Dates, passengers and cabin are NOT on the route — they are collected per booking,
    and pricing is fetched live from the provider at booking time.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    origin_iata = models.CharField(max_length=3)
    destination_iata = models.CharField(max_length=3)

    base_price = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Manual ticket price before commission (MYR or route currency).",
    )
    commission_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal("0.00"))
    currency = models.CharField(max_length=3, choices=CURRENCY_CHOICES, default="MYR")

    display_title = models.CharField(max_length=200, blank=True)
    provider = models.CharField(max_length=20, choices=PROVIDER_CHOICES, default="duffel")

    is_active = models.BooleanField(default=False)

    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
        related_name="flight_routes_created",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "flights_route"
        ordering = ["origin_iata", "destination_iata"]
        constraints = [
            models.UniqueConstraint(
                fields=["origin_iata", "destination_iata"],
                name="uniq_flight_route_pair",
            ),
        ]
        indexes = [
            models.Index(fields=["is_active"]),
        ]

    def __str__(self):
        return f"{self.origin_iata} → {self.destination_iata}"

    @property
    def commission_amount(self) -> Decimal | None:
        if self.base_price is None:
            return None
        return (self.base_price * self.commission_percentage / Decimal("100")).quantize(
            Decimal("0.01")
        )

    @property
    def final_price(self) -> Decimal | None:
        if self.base_price is None:
            return None
        return self.base_price + (self.commission_amount or Decimal("0"))

    @property
    def uses_manual_pricing(self) -> bool:
        return self.base_price is not None

    def save(self, *args, **kwargs):
        self.origin_iata = (self.origin_iata or "").upper()
        self.destination_iata = (self.destination_iata or "").upper()
        super().save(*args, **kwargs)
