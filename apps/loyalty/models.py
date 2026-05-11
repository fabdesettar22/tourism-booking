import uuid
from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils import timezone


class Coupon(models.Model):
    """Discount coupons. Validated at checkout against the cart total."""

    DISCOUNT_PERCENTAGE = "percentage"
    DISCOUNT_FIXED = "fixed"
    DISCOUNT_CHOICES = [
        (DISCOUNT_PERCENTAGE, "Percentage off"),
        (DISCOUNT_FIXED, "Fixed amount off"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    code = models.CharField(max_length=40, unique=True, db_index=True)
    description = models.CharField(max_length=200, blank=True)

    discount_type = models.CharField(max_length=20, choices=DISCOUNT_CHOICES)
    discount_value = models.DecimalField(max_digits=12, decimal_places=2)
    currency = models.CharField(max_length=3, default="MYR", help_text="For DISCOUNT_FIXED only")

    min_order_amount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Minimum cart total to apply",
    )
    max_discount = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True,
        help_text="Cap for percentage discounts",
    )

    valid_from = models.DateTimeField(default=timezone.now)
    valid_until = models.DateTimeField(null=True, blank=True)

    max_uses = models.PositiveIntegerField(null=True, blank=True)
    max_uses_per_user = models.PositiveSmallIntegerField(default=1)
    times_used = models.PositiveIntegerField(default=0)

    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "loyalty_coupon"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["is_active", "valid_until"])]

    def __str__(self):
        return self.code

    def is_redeemable(self) -> bool:
        if not self.is_active:
            return False
        now = timezone.now()
        if self.valid_until and now > self.valid_until:
            return False
        if self.valid_from and now < self.valid_from:
            return False
        if self.max_uses and self.times_used >= self.max_uses:
            return False
        return True

    def compute_discount(self, subtotal: Decimal) -> Decimal:
        if not self.is_redeemable():
            return Decimal("0")
        if self.min_order_amount and subtotal < self.min_order_amount:
            return Decimal("0")
        if self.discount_type == self.DISCOUNT_PERCENTAGE:
            amount = subtotal * (self.discount_value / Decimal("100"))
            if self.max_discount:
                amount = min(amount, self.max_discount)
            return amount
        return min(self.discount_value, subtotal)


class CouponRedemption(models.Model):
    """Audit trail for each redemption — used for max_uses_per_user enforcement."""
    coupon = models.ForeignKey(Coupon, on_delete=models.PROTECT, related_name="redemptions")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="coupon_redemptions")
    booking = models.ForeignKey(
        "bookings.Booking", on_delete=models.SET_NULL, null=True, blank=True,
        related_name="coupon_redemptions",
    )
    discount_applied = models.DecimalField(max_digits=12, decimal_places=2)
    redeemed_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "loyalty_coupon_redemption"
        indexes = [models.Index(fields=["coupon", "user"])]


class LoyaltyAccount(models.Model):
    """Per-user loyalty profile — points + tier."""

    TIER_BRONZE = "bronze"
    TIER_SILVER = "silver"
    TIER_GOLD = "gold"
    TIER_PLATINUM = "platinum"
    TIER_CHOICES = [
        (TIER_BRONZE, "Bronze"),
        (TIER_SILVER, "Silver"),
        (TIER_GOLD, "Gold"),
        (TIER_PLATINUM, "Platinum"),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="loyalty",
    )
    points = models.IntegerField(default=0)
    lifetime_points = models.IntegerField(default=0)
    tier = models.CharField(max_length=20, choices=TIER_CHOICES, default=TIER_BRONZE)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "loyalty_account"

    def __str__(self):
        return f"{self.user} — {self.tier} ({self.points} pts)"

    def add_points(self, points: int):
        self.points += points
        self.lifetime_points += points
        self._refresh_tier()
        self.save(update_fields=["points", "lifetime_points", "tier", "updated_at"])

    def _refresh_tier(self):
        # Tier thresholds based on lifetime_points
        if self.lifetime_points >= 50000:
            self.tier = self.TIER_PLATINUM
        elif self.lifetime_points >= 10000:
            self.tier = self.TIER_GOLD
        elif self.lifetime_points >= 2500:
            self.tier = self.TIER_SILVER
        else:
            self.tier = self.TIER_BRONZE


class PointsTransaction(models.Model):
    """Ledger of points earned/spent."""
    EARN = "earn"
    REDEEM = "redeem"
    EXPIRE = "expire"
    ADJUST = "adjust"
    KIND_CHOICES = [
        (EARN, "Earned"), (REDEEM, "Redeemed"),
        (EXPIRE, "Expired"), (ADJUST, "Adjusted"),
    ]

    account = models.ForeignKey(LoyaltyAccount, on_delete=models.CASCADE, related_name="transactions")
    kind = models.CharField(max_length=10, choices=KIND_CHOICES)
    points = models.IntegerField(help_text="Positive for earn, negative for redeem/expire")
    booking = models.ForeignKey(
        "bookings.Booking", on_delete=models.SET_NULL, null=True, blank=True,
    )
    note = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "loyalty_points_tx"
        ordering = ["-created_at"]
