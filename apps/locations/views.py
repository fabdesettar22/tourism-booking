# apps/locations/views.py
from django.db.models import Q
from rest_framework import viewsets, filters
from rest_framework.permissions import AllowAny
from rest_framework.decorators import action
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUser
from .models import Country, City
from .serializers.serializers import (
    CountrySerializer, CountryLiteSerializer,
    CitySerializer,    CityLiteSerializer,
)


# ═══════════════════════════════════════════════════════════
# Country ViewSet
# ═══════════════════════════════════════════════════════════

class CountryViewSet(viewsets.ModelViewSet):
    """
    GET    /api/v1/locations/countries/                  # all (lite)
    GET    /api/v1/locations/countries/?search=alg       # search
    GET    /api/v1/locations/countries/<id>/             # detail
    POST   /api/v1/locations/countries/                  # admin only
    """
    queryset         = Country.objects.all().order_by('name_ar', 'name_en')
    throttle_classes = []  # locations مرجعية — بلا throttle

    def get_permissions(self):
        # القراءة عامة (للـ Waitlist forms)
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        # Lite للقوائم + retrieve, Full للكتابة
        if self.action in ('list', 'retrieve'):
            return CountryLiteSerializer
        return CountrySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        search = self.request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name_ar__icontains=search) |
                Q(name_en__icontains=search) |
                Q(name__icontains=search) |
                Q(iso2__iexact=search) |
                Q(iso3__iexact=search)
            )
        return qs


# ═══════════════════════════════════════════════════════════
# City ViewSet — مع search + filter by country
# ═══════════════════════════════════════════════════════════

class CityViewSet(viewsets.ModelViewSet):
    """
    GET /api/v1/locations/cities/                                  # كل المدن (محدودة)
    GET /api/v1/locations/cities/?country_code=DZ                  # مدن دولة بالـ ISO
    GET /api/v1/locations/cities/?country_id=1                     # مدن دولة بالـ id
    GET /api/v1/locations/cities/?country_code=DZ&q=alger          # autocomplete
    GET /api/v1/locations/cities/?country_code=DZ&limit=50         # تحديد عدد
    """
    queryset           = City.objects.select_related('country').all()
    serializer_class   = CitySerializer  # default للكتابة
    throttle_classes   = []              # locations مرجعية — بلا throttle

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [AllowAny()]
        return [IsAdminUser()]

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return CityLiteSerializer
        return CitySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params

        # Filter by country
        country_id   = params.get('country_id')
        country_code = params.get('country_code', '').strip().upper()
        if country_id:
            qs = qs.filter(country_id=country_id)
        elif country_code:
            qs = qs.filter(country__iso2=country_code)

        # Search by city name (autocomplete)
        q = params.get('q', '').strip() or params.get('search', '').strip()
        if q:
            qs = qs.filter(
                Q(name_ar__istartswith=q) |
                Q(name_en__istartswith=q) |
                Q(name__istartswith=q) |
                Q(name_ar__icontains=q) |
                Q(name_en__icontains=q) |
                Q(name__icontains=q)
            )

        # ترتيب: الأكبر سكاناً أولاً
        qs = qs.order_by('-population', 'name')

        # Limit يُطبَّق فقط في list (للـ retrieve نُرجع كامل QS)
        if self.action == 'list':
            try:
                limit = min(int(params.get('limit', 50)), 200)
            except (ValueError, TypeError):
                limit = 50
            qs = qs[:limit]

        return qs
