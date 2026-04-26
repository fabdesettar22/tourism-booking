# apps/suppliers/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'profile',         views.SupplierProfileViewSet,       basename='supplier-profile')
router.register(r'hotels',          views.HotelSupplierViewSet,         basename='supplier-hotel')
router.register(r'room-types',      views.RoomTypeSupplierViewSet,      basename='supplier-room-type')
router.register(r'room-rates',      views.RoomRateSupplierViewSet,      basename='supplier-room-rate')
router.register(r'tours',           views.TourSupplierViewSet,          basename='supplier-tour')
router.register(r'tour-rates',      views.TourRateSupplierViewSet,      basename='supplier-tour-rate')
router.register(r'transfer-routes', views.TransferRouteSupplierViewSet, basename='supplier-transfer-route')
router.register(r'transfer-rates',  views.TransferRateSupplierViewSet,  basename='supplier-transfer-rate')
router.register(r'flight-routes',   views.FlightRouteSupplierViewSet,   basename='supplier-flight-route')
router.register(r'flight-rates',    views.FlightRateSupplierViewSet,    basename='supplier-flight-rate')

urlpatterns = [
    # ── Hotel Onboarding ──────────────────────────────────────
    path('hotel/onboarding/status/',
         views.HotelOnboardingStatusView.as_view(), name='hotel-onboarding-status'),
    path('hotel/onboarding/step0/',
         views.HotelStep0View.as_view(), name='hotel-step0'),
    path('hotel/onboarding/step1/',
         views.HotelStep1View.as_view(), name='hotel-step1'),
    path('hotel/onboarding/step2/amenities/',
         views.HotelStep2AmenitiesView.as_view(), name='hotel-step2-amenities'),
    path('hotel/onboarding/step2/services/',
         views.HotelStep2ServicesView.as_view(), name='hotel-step2-services'),
    path('hotel/onboarding/step2/description/',
         views.HotelStep2DescriptionView.as_view(), name='hotel-step2-description'),
    path('hotel/onboarding/rooms/',
         views.HotelRoomsView.as_view(), name='hotel-rooms'),
    path('hotel/onboarding/rooms/<uuid:room_id>/',
         views.HotelRoomDetailView.as_view(), name='hotel-room-detail'),
    path('hotel/onboarding/images/',
         views.HotelImagesView.as_view(), name='hotel-images'),
    path('hotel/onboarding/images/<uuid:image_id>/',
         views.HotelImageDetailView.as_view(), name='hotel-image-detail'),
    path('hotel/onboarding/images/<uuid:image_id>/set-main/',
         views.HotelImageDetailView.as_view(), name='hotel-image-set-main'),
    path('hotel/onboarding/step5/pricing/',
         views.HotelStep5PricingView.as_view(), name='hotel-step5-pricing'),
    path('hotel/onboarding/step5/plans/',
         views.HotelPricePlansView.as_view(), name='hotel-step5-plans'),
    path('hotel/onboarding/step6/availability/',
         views.HotelStep6AvailabilityView.as_view(), name='hotel-step6-availability'),
    path('hotel/onboarding/step7/final/',
         views.HotelStep7FinalView.as_view(), name='hotel-step7-final'),

    # ── Waitlist ──────────────────────────────────────────────
    path('waitlist/',
         views.SupplierWaitlistView.as_view(), name='supplier-waitlist'),
    path('waitlist/counts/',
         views.WaitlistCountView.as_view(), name='waitlist-counts'),

    # ── Admin ─────────────────────────────────────────────────
    path('admin/hotels/',
         views.AdminHotelListView.as_view(), name='admin-hotel-list'),
    path('admin/hotels/<uuid:hotel_id>/approve/',
         views.AdminHotelApproveView.as_view(), name='admin-hotel-approve'),
    path('admin/hotels/<uuid:hotel_id>/reject/',
         views.AdminHotelRejectView.as_view(), name='admin-hotel-reject'),
    path('admin/waitlist/',
         views.AdminWaitlistView.as_view(), name='admin-waitlist'),
    path('admin/waitlist/<uuid:entry_id>/contact/',
         views.AdminWaitlistView.as_view(), name='admin-waitlist-contact'),

    # ── Legacy Router ─────────────────────────────────────────
    path('', include(router.urls)),
]
