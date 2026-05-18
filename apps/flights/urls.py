from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import (
    FlightRouteViewSet, PublicFlightRouteViewSet,
    AirportsSearchView, FlightSearchView,
)

router = DefaultRouter()
router.register(r"routes", FlightRouteViewSet, basename="flight-route")
router.register(r"public/routes", PublicFlightRouteViewSet, basename="public-flight-route")
router.register(r"airports", AirportsSearchView, basename="flight-airports")

urlpatterns = [
    path("search/", FlightSearchView.as_view(), name="flight-search"),
    path("", include(router.urls)),
]
