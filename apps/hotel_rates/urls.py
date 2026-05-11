from django.urls import path
from rest_framework.routers import SimpleRouter

from .views import (
    AdminHotelGuestPricingViewSet,
    AdminHotelSeasonDateRangeViewSet,
    AdminHotelSeasonViewSet,
    AdminHotelSurchargeViewSet,
    AdminPricingTierDefViewSet,
    AdminRoomCategoryViewSet,
    AdminRoomInclusionViewSet,
    AdminRoomRateViewSet,
    HotelGuestPricingViewSet,
    HotelSeasonViewSet,
    PricingTierDefViewSet,
    RoomCategoryViewSet,
    RoomRateViewSet,
    quote_view,
)

# SimpleRouter (لا API root view) للحفاظ على نمط التطبيقات الأخرى.
router = SimpleRouter()

# Admin (مسجَّلة أولاً لئلا يلتقط الـ public route الـ admin مسارات)
router.register(r'admin/categories',     AdminRoomCategoryViewSet,        basename='admin-room-category')
router.register(r'admin/seasons',        AdminHotelSeasonViewSet,         basename='admin-hotel-season')
router.register(r'admin/season-ranges',  AdminHotelSeasonDateRangeViewSet,basename='admin-season-range')
router.register(r'admin/rates',          AdminRoomRateViewSet,            basename='admin-room-rate')
router.register(r'admin/surcharges',     AdminHotelSurchargeViewSet,      basename='admin-hotel-surcharge')
router.register(r'admin/inclusions',     AdminRoomInclusionViewSet,       basename='admin-room-inclusion')
router.register(r'admin/pricing-tiers',  AdminPricingTierDefViewSet,      basename='admin-pricing-tier')
router.register(r'admin/guest-pricing',  AdminHotelGuestPricingViewSet,   basename='admin-guest-pricing')

# Public (read-only)
router.register(r'categories',     RoomCategoryViewSet,        basename='room-category')
router.register(r'seasons',        HotelSeasonViewSet,         basename='hotel-season')
router.register(r'rates',          RoomRateViewSet,            basename='room-rate')
router.register(r'pricing-tiers',  PricingTierDefViewSet,      basename='pricing-tier')
router.register(r'guest-pricing',  HotelGuestPricingViewSet,   basename='guest-pricing')

urlpatterns = [
    path('quote/', quote_view, name='hotel-rates-quote'),
] + router.urls
