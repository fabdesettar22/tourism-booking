from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import CouponAdminViewSet, validate_coupon, my_loyalty

router = DefaultRouter()
router.register(r"admin/coupons", CouponAdminViewSet, basename="loyalty-admin-coupon")

urlpatterns = [
    path("validate-coupon/", validate_coupon, name="loyalty-validate-coupon"),
    path("me/", my_loyalty, name="loyalty-me"),
] + router.urls
