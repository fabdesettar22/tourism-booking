from rest_framework import serializers
from .models import Coupon, LoyaltyAccount, PointsTransaction


class CouponSerializer(serializers.ModelSerializer):
    is_redeemable = serializers.SerializerMethodField()

    class Meta:
        model = Coupon
        fields = [
            "id", "code", "description",
            "discount_type", "discount_value", "currency",
            "min_order_amount", "max_discount",
            "valid_from", "valid_until",
            "max_uses", "max_uses_per_user", "times_used",
            "is_active", "is_redeemable",
        ]
        read_only_fields = ["id", "times_used", "is_redeemable"]

    def get_is_redeemable(self, obj):
        return obj.is_redeemable()


class CouponValidateSerializer(serializers.Serializer):
    """Public endpoint payload: validate a code against a subtotal."""
    code = serializers.CharField()
    subtotal = serializers.DecimalField(max_digits=12, decimal_places=2)


class LoyaltyAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoyaltyAccount
        fields = ["points", "lifetime_points", "tier", "updated_at"]
        read_only_fields = fields


class PointsTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointsTransaction
        fields = ["id", "kind", "points", "note", "created_at"]
        read_only_fields = fields
