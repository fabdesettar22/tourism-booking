from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    FlightRouteViewSet, PublicFlightRouteViewSet, AirportsSearchView,
    FlightBookingRequestCreateView, AdminFlightBookingRequestViewSet,
)

router = DefaultRouter()
router.register(r"routes", FlightRouteViewSet, basename="flight-route")
router.register(r"public/routes", PublicFlightRouteViewSet, basename="public-flight-route")
router.register(r"airports", AirportsSearchView, basename="flight-airports")
router.register(r"booking-requests", FlightBookingRequestCreateView, basename="flight-booking-request")
router.register(r"admin/booking-requests", AdminFlightBookingRequestViewSet, basename="admin-flight-booking-request")

urlpatterns = [
    path("", include(router.urls)),
]
