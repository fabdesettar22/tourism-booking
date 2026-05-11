from django.contrib import admin
from .models import Coupon, CouponRedemption, LoyaltyAccount, PointsTransaction


@admin.register(Coupon)
class CouponAdmin(admin.ModelAdmin):
    list_display = ("code", "discount_type", "discount_value", "is_active", "valid_until", "times_used")
    list_filter = ("discount_type", "is_active")
    search_fields = ("code", "description")


@admin.register(CouponRedemption)
class CouponRedemptionAdmin(admin.ModelAdmin):
    list_display = ("coupon", "user", "discount_applied", "redeemed_at")
    raw_id_fields = ("coupon", "user", "booking")


@admin.register(LoyaltyAccount)
class LoyaltyAccountAdmin(admin.ModelAdmin):
    list_display = ("user", "tier", "points", "lifetime_points", "updated_at")
    list_filter = ("tier",)
    raw_id_fields = ("user",)


@admin.register(PointsTransaction)
class PointsTransactionAdmin(admin.ModelAdmin):
    list_display = ("account", "kind", "points", "created_at")
    list_filter = ("kind",)
