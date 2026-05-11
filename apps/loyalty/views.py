from decimal import Decimal
from django.shortcuts import get_object_or_404
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response

from .models import Coupon, LoyaltyAccount
from .serializers import (
    CouponSerializer, CouponValidateSerializer,
    LoyaltyAccountSerializer, PointsTransactionSerializer,
)


class CouponAdminViewSet(viewsets.ModelViewSet):
    """Admin-only CRUD for coupons."""
    queryset = Coupon.objects.all()
    serializer_class = CouponSerializer
    permission_classes = [permissions.IsAdminUser]
    lookup_field = "code"


@api_view(["POST"])
@permission_classes([permissions.AllowAny])
def validate_coupon(request):
    """Public — validate a coupon code against a subtotal. Returns the discount amount."""
    s = CouponValidateSerializer(data=request.data)
    s.is_valid(raise_exception=True)
    code = s.validated_data["code"].strip().upper()
    subtotal = s.validated_data["subtotal"]
    coupon = get_object_or_404(Coupon, code__iexact=code)
    if not coupon.is_redeemable():
        return Response({"valid": False, "reason": "expired_or_inactive"}, status=status.HTTP_400_BAD_REQUEST)
    discount = coupon.compute_discount(Decimal(subtotal))
    if discount <= 0:
        return Response({"valid": False, "reason": "min_amount_not_met"}, status=status.HTTP_400_BAD_REQUEST)
    return Response({
        "valid": True,
        "discount": str(discount),
        "currency": coupon.currency,
        "discount_type": coupon.discount_type,
    })


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def my_loyalty(request):
    account, _ = LoyaltyAccount.objects.get_or_create(user=request.user)
    return Response({
        **LoyaltyAccountSerializer(account).data,
        "transactions": PointsTransactionSerializer(
            account.transactions.all()[:50], many=True
        ).data,
    })
