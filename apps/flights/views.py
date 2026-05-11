from rest_framework import viewsets, status, permissions, mixins
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import FlightRoute, FlightOffer, FlightBookingRequest
from .serializers import (
    FlightRouteSerializer, FlightRoutePublicSerializer,
    FlightOfferAdminSerializer, FlightOfferPublicSerializer,
    FlightBookingRequestSerializer, FlightBookingRequestAdminSerializer,
)
from .services import flight_search, duffel_client
from .services.duffel_client import DuffelError


# ─── Admin: routes ────────────────────────────────────────
class FlightRouteViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = FlightRouteSerializer
    queryset = FlightRoute.objects.all().prefetch_related("offers")

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=True, methods=["post"])
    def refresh(self, request, pk=None):
        route = self.get_object()
        try:
            offers = flight_search.refresh_route_offers(route)
        except DuffelError as exc:
            return Response(
                {"detail": str(exc), "duffel": exc.payload},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response({
            "route": FlightRouteSerializer(route).data,
            "offers": FlightOfferAdminSerializer(offers, many=True).data,
        })

    @action(detail=True, methods=["post"])
    def activate(self, request, pk=None):
        route = self.get_object()
        if not route.offers.exists():
            return Response(
                {"detail": "Refresh offers before activating."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        route.is_active = True
        route.save(update_fields=["is_active", "updated_at"])
        return Response(FlightRouteSerializer(route).data)

    @action(detail=True, methods=["post"])
    def deactivate(self, request, pk=None):
        route = self.get_object()
        route.is_active = False
        route.save(update_fields=["is_active", "updated_at"])
        return Response(FlightRouteSerializer(route).data)

    @action(detail=True, methods=["get"])
    def offers(self, request, pk=None):
        route = self.get_object()
        return Response(
            FlightOfferAdminSerializer(route.offers.all().order_by("total_amount"), many=True).data
        )


# ─── Public: routes & offers ──────────────────────────────
class PublicFlightRouteViewSet(mixins.RetrieveModelMixin, mixins.ListModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = FlightRoutePublicSerializer
    queryset = FlightRoute.objects.filter(is_active=True).prefetch_related("offers")

    @action(detail=True, methods=["get"])
    def offers(self, request, pk=None):
        route = self.get_object()
        offers = flight_search.get_cached_offers(route)
        return Response(FlightOfferPublicSerializer(offers, many=True).data)


# ─── Airports autocomplete ────────────────────────────────
class AirportsSearchView(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]

    def list(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 2:
            return Response([])
        try:
            results = duffel_client.search_airports(q, limit=10)
        except DuffelError as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_502_BAD_GATEWAY)
        slim = [
            {
                "iata_code": a.get("iata_code"),
                "name": a.get("name"),
                "city_name": a.get("city_name"),
                "country": a.get("iata_country_code"),
            }
            for a in results if a.get("iata_code")
        ]
        return Response(slim)


# ─── Booking requests ─────────────────────────────────────
class FlightBookingRequestCreateView(mixins.CreateModelMixin, viewsets.GenericViewSet):
    permission_classes = [permissions.AllowAny]
    serializer_class = FlightBookingRequestSerializer
    queryset = FlightBookingRequest.objects.all()


class AdminFlightBookingRequestViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAdminUser]
    serializer_class = FlightBookingRequestAdminSerializer
    queryset = FlightBookingRequest.objects.select_related("offer", "offer__route").all()
    http_method_names = ["get", "patch", "delete", "head", "options"]
