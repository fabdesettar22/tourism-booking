import uuid
from django.conf import settings
from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


class Review(models.Model):
    """User-submitted reviews for hotels and services.

    A review is bound to one entity (hotel XOR service). When linked to a
    Booking, it carries `verified=True` — only verified reviews count toward
    the public average rating.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="reviews"
    )
    hotel = models.ForeignKey(
        "hotels.Hotel", on_delete=models.CASCADE, null=True, blank=True,
        related_name="reviews",
    )
    service = models.ForeignKey(
        "services.Service", on_delete=models.CASCADE, null=True, blank=True,
        related_name="reviews",
    )
    booking = models.ForeignKey(
        "bookings.Booking", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="reviews",
    )

    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        help_text="1–5 stars",
    )
    title = models.CharField(max_length=200, blank=True)
    comment = models.TextField()
    language = models.CharField(max_length=2, default="ar", choices=[
        ("ar", "Arabic"), ("en", "English"), ("ms", "Malay"),
    ])

    verified = models.BooleanField(
        default=False,
        help_text="True when linked to an actual completed booking",
    )
    is_published = models.BooleanField(default=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "reviews_review"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["hotel", "is_published", "-created_at"]),
            models.Index(fields=["service", "is_published", "-created_at"]),
            models.Index(fields=["user", "-created_at"]),
        ]
        constraints = [
            models.CheckConstraint(
                condition=(
                    models.Q(hotel__isnull=False, service__isnull=True)
                    | models.Q(hotel__isnull=True, service__isnull=False)
                ),
                name="review_targets_exactly_one_entity",
            ),
        ]

    def __str__(self):
        target = self.hotel or self.service
        return f"{self.user} → {target} ({self.rating}★)"

    def save(self, *args, **kwargs):
        # Auto-mark verified when a booking is linked
        if self.booking_id and not self.verified:
            self.verified = True
        super().save(*args, **kwargs)
