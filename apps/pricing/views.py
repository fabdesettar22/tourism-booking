from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny, IsAdminUser as DRFIsAdmin
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin
from .models import Season, RoomPrice, ExchangeRate
from .serializers import SeasonSerializer, RoomPriceSerializer
from .services import (
    convert_currency, get_floor_price, get_sell_price, quote, SUPPORTED_CURRENCIES
)


# ─── Public pricing endpoints ────────────────────────────────

class CurrenciesView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({'currencies': SUPPORTED_CURRENCIES, 'default': 'MYR'})


class RatesView(APIView):
    """GET /api/v1/pricing/rates/?base=MYR — أحدث أسعار الصرف للواجهة."""
    permission_classes = [AllowAny]
    def get(self, request):
        base = (request.query_params.get('base') or 'MYR').upper()
        result = {'base': base, 'rates': {}}
        for to_curr in SUPPORTED_CURRENCIES:
            if to_curr == base:
                result['rates'][to_curr] = '1.000000'
                continue
            r = ExchangeRate.get_rate(base, to_curr)
            if r is None:
                inv = ExchangeRate.get_rate(to_curr, base)
                if inv and inv > 0:
                    r = Decimal('1') / inv
            result['rates'][to_curr] = str(r) if r is not None else None
        return Response(result)


class QuoteView(APIView):
    """GET /api/v1/pricing/quote/?item_type=service&item_id=X&currency=USD&agency_id=Y"""
    permission_classes = [AllowAny]
    def get(self, request):
        item_type = (request.query_params.get('item_type') or '').lower()
        item_id = request.query_params.get('item_id')
        currency = (request.query_params.get('currency') or 'MYR').upper()
        agency_id = request.query_params.get('agency_id')

        if not item_type or not item_id:
            return Response({'detail': 'item_type and item_id required'}, status=400)
        if currency not in SUPPORTED_CURRENCIES:
            return Response({'detail': f'unsupported currency {currency}'}, status=400)

        item = self._resolve_item(item_type, item_id)
        if item is None:
            return Response({'detail': 'item not found'}, status=404)

        agency = None
        if agency_id:
            from apps.accounts.models import Agency
            agency = Agency.objects.filter(pk=agency_id).first()

        is_hq = bool(getattr(request.user, 'is_authenticated', False)) and \
                getattr(request.user, 'role', '') in ('super_admin', 'admin')

        result = quote(item, agency=agency, display_currency=currency, is_hq=is_hq)
        return Response({k: (str(v) if isinstance(v, Decimal) else v) for k, v in result.items()})

    def _resolve_item(self, item_type, item_id):
        if item_type == 'service':
            from apps.services.models import Service
            return Service.objects.filter(pk=item_id).first()
        if item_type == 'hotel':
            from apps.hotels.models import Hotel
            return Hotel.objects.filter(pk=item_id).first()
        if item_type == 'room_price':
            return RoomPrice.objects.filter(pk=item_id).first()
        return None


# ─── Admin endpoints ─────────────────────────────────────────

class ExchangeRateAdminViewSet(viewsets.ModelViewSet):
    queryset = ExchangeRate.objects.all().order_by('-is_manual', '-valid_from')
    permission_classes = [DRFIsAdmin]
    pagination_class = None

    def get_serializer_class(self):
        from rest_framework import serializers as drf_serializers
        from .models import ExchangeRate as ER
        class _S(drf_serializers.ModelSerializer):
            class Meta:
                model = ER
                fields = '__all__'
        return _S


class RefreshRatesView(APIView):
    permission_classes = [DRFIsAdmin]
    def post(self, request):
        from django.core.management import call_command
        from io import StringIO
        out = StringIO()
        try:
            call_command('fetch_fx_rates', stdout=out)
            return Response({'ok': True, 'output': out.getvalue()})
        except Exception as exc:
            return Response({'ok': False, 'error': str(exc)}, status=500)


# ─── Existing legacy viewsets ────────────────────────────────

from rest_framework.permissions import IsAuthenticated as _IsAuthenticated


class SeasonViewSet(viewsets.ModelViewSet):
    queryset = Season.objects.all()
    serializer_class = SeasonSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Season.objects.prefetch_related('prices').all()
        hotel_id = self.request.query_params.get('hotel')
        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)
        return qs


class RoomPriceViewSet(viewsets.ModelViewSet):
    queryset = RoomPrice.objects.all()
    serializer_class = RoomPriceSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = RoomPrice.objects.all()
        season_id = self.request.query_params.get('season')
        room_type_id = self.request.query_params.get('room_type')
        if season_id:
            qs = qs.filter(season_id=season_id)
        if room_type_id:
            qs = qs.filter(room_type_id=room_type_id)
        return qs