from rest_framework import viewsets, status, permissions, mixins
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import FlightRoute
from .serializers import (
    FlightRouteSerializer, FlightRoutePublicSerializer,
    FlightSearchInputSerializer,
)
from .services import flight_search, duffel_client
from .services.duffel_client import DuffelError
from .services.flight_search import RouteNotAvailable


class FlightRouteViewSet(viewsets.ModelViewSet):
    """Admin CRUD for route definitions (origin + destination + commission)."""
    permission_classes = [permissions.IsAdminUser]
    serializer_class = FlightRouteSerializer
    queryset = FlightRoute.objects.all()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class PublicFlightRouteViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """Active routes — used by the public search form to show available city pairs."""
    permission_classes = [permissions.AllowAny]
    serializer_class = FlightRoutePublicSerializer
    queryset = FlightRoute.objects.filter(is_active=True)


class FlightSearchView(APIView):
    """Live search — fetches offers from Duffel for the given route/date/passengers."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        payload = FlightSearchInputSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data
        try:
            result = flight_search.search_live(**data)
        except RouteNotAvailable as exc:
            return Response({"detail": str(exc)}, status=status.HTTP_404_NOT_FOUND)
        except DuffelError as exc:
            return Response(
                {"detail": str(exc), "duffel": exc.payload},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        return Response(result)


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
