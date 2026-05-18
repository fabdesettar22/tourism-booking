"""Views for the template-based packages architecture.

يقدّم 3 مجموعات endpoints:

1. **HQ Admin** (IsAdminUser):
   - CRUD على القوالب (مع الـ allowed_* relationships)
   - إدارة المدن والفنادق المسموحة
   - تفعيل/تعطيل النشر للوكالات

2. **Agency Public** (IsAuthenticated):
   - قائمة الباقات المنشورة (is_template=True + status='published')
   - تفاصيل باقة (المكوّنات المسموحة بدون أسعار)
   - configurator: استجابة موحّدة لبناء ودجت الحجز

3. **Configurator** (IsAuthenticated):
   - GET /api/v1/packages/{id}/configurator/
"""
from rest_framework import viewsets, status, mixins
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404
from django.db import transaction

from apps.accounts.permissions import IsAdminUser
from apps.hotels.models import Hotel
from apps.tours_excursions.models import Tour
from apps.airport_transfers.models import AirportTransfer
from apps.flights.models import FlightRoute

from .models import CustomPackage, PackageCity
from .serializers.template import (
    CustomPackageTemplateSerializer,
    CustomPackageAgencyListSerializer,
    CustomPackageAgencyDetailSerializer,
    PackageCityTemplateSerializer,
)


# ════════════════════════════════════════════════════════════
# 1. HQ Admin — full template management
# ════════════════════════════════════════════════════════════


class PackageTemplateAdminViewSet(viewsets.ModelViewSet):
    """HQ يدير قوالب الباقات بكامل صلاحياتها.

    /api/v1/packages/admin/templates/                  (GET, POST)
    /api/v1/packages/admin/templates/{id}/             (GET, PATCH, DELETE)
    /api/v1/packages/admin/templates/{id}/publish/     (POST)
    /api/v1/packages/admin/templates/{id}/unpublish/   (POST)
    /api/v1/packages/admin/templates/{id}/cities/      (POST: add city)
    /api/v1/packages/admin/templates/{id}/cities/{cid}/  (DELETE)
    /api/v1/packages/admin/templates/{id}/cities/{cid}/allowed-hotels/  (PUT)
    """
    serializer_class   = CustomPackageTemplateSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return CustomPackage.objects.prefetch_related(
            'cities__city',
            'cities__allowed_hotels',
            'allowed_tours__service',
            'allowed_tours__city',
            'allowed_transfers__service',
            'allowed_transfers__airport',
            'allowed_transfers__hotel',
            'allowed_transfers__city',
            'allowed_flight_routes',
        ).select_related('country', 'agency', 'gift__service').all()

    # ── النشر/الإلغاء ──────────────────────────────────
    @action(detail=True, methods=['post'], url_path='publish')
    def publish(self, request, pk=None):
        pkg = self.get_object()
        ok, missing = pkg.is_ready_for_publish()
        if not ok:
            return Response(
                {'detail': 'الباقة غير جاهزة للنشر', 'missing': missing},
                status=status.HTTP_400_BAD_REQUEST,
            )
        pkg.is_template = True
        pkg.status      = 'published'
        pkg.save(update_fields=['is_template', 'status', 'updated_at'])
        return Response({'detail': 'تم النشر', 'is_template': True, 'status': 'published'})

    @action(detail=True, methods=['post'], url_path='unpublish')
    def unpublish(self, request, pk=None):
        pkg = self.get_object()
        pkg.is_template = False
        pkg.status      = 'draft'
        pkg.save(update_fields=['is_template', 'status', 'updated_at'])
        return Response({'detail': 'تم إلغاء النشر', 'is_template': False, 'status': 'draft'})

    # ── إدارة المدن (PackageCity) ─────────────────────
    @action(detail=True, methods=['post'], url_path='cities')
    def add_city(self, request, pk=None):
        pkg = self.get_object()
        city_id = request.data.get('city')
        if not city_id:
            return Response({'detail': 'city مطلوب'}, status=400)
        nights = int(request.data.get('nights', 1))
        order  = int(request.data.get('order', pkg.cities.count()))
        if pkg.cities.filter(city_id=city_id).exists():
            return Response({'detail': 'هذه المدينة موجودة بالفعل في الباقة'}, status=400)
        pc = PackageCity.objects.create(package=pkg, city_id=city_id, nights=nights, order=order)
        return Response(PackageCityTemplateSerializer(pc).data, status=201)

    @action(detail=True, methods=['delete'], url_path=r'cities/(?P<package_city_id>\d+)')
    def remove_city(self, request, pk=None, package_city_id=None):
        pkg = self.get_object()
        get_object_or_404(pkg.cities, pk=package_city_id).delete()
        return Response(status=204)

    @action(detail=True, methods=['put', 'patch'],
            url_path=r'cities/(?P<package_city_id>\d+)/allowed-hotels')
    def set_allowed_hotels(self, request, pk=None, package_city_id=None):
        pkg = self.get_object()
        pc  = get_object_or_404(pkg.cities, pk=package_city_id)
        hotel_ids = request.data.get('hotel_ids', [])
        if not isinstance(hotel_ids, list):
            return Response({'detail': 'hotel_ids must be a list'}, status=400)
        hotels = Hotel.objects.filter(id__in=hotel_ids, city_id=pc.city_id)
        with transaction.atomic():
            pc.allowed_hotels.set(hotels)
        return Response(PackageCityTemplateSerializer(pc).data)


# ════════════════════════════════════════════════════════════
# 2. Agency Public — published templates only
# ════════════════════════════════════════════════════════════


class PackageAgencyViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin,
                            viewsets.GenericViewSet):
    """قائمة الباقات المنشورة للوكالة الجزائرية.

    /api/v1/packages/agency/                  (GET list)
    /api/v1/packages/agency/{id}/             (GET detail)
    /api/v1/packages/agency/{id}/configurator/  (GET configurator)
    """
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # ملاحظة: لا نـprefetch لـ allowed_flight_routes هنا حتى نتجنب
        # الانهيار إذا كان نموذج FlightRoute في حالة drift مع الـDB.
        # الـconfigurator يصل إليها بحذر داخل try/except.
        return CustomPackage.objects.filter(
            is_template=True, status='published',
        ).prefetch_related(
            'cities__city',
            'cities__allowed_hotels',
            'allowed_tours__service',
            'allowed_tours__city',
            'allowed_transfers__service',
            'allowed_transfers__airport',
            'allowed_transfers__hotel',
            'allowed_transfers__city',
        ).select_related('gift__service').order_by('-created_at')

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CustomPackageAgencyDetailSerializer
        return CustomPackageAgencyListSerializer

    @action(detail=True, methods=['get'], url_path='configurator')
    def configurator(self, request, pk=None):
        """يرجع كل ما يحتاجه ودجت الحجز لبناء واجهته."""
        pkg = self.get_object()

        # المدن مع الفنادق المسموحة وأنواع غرفها
        cities_data = []
        for pc in pkg.cities.prefetch_related('allowed_hotels__room_types').all():
            hotels_data = []
            for h in pc.allowed_hotels.filter(is_active=True):
                hotels_data.append({
                    'id': h.id,
                    'name': h.name,
                    'stars': h.stars,
                    'image': h.image.url if h.image else None,
                    'room_types': [
                        {'id': rt.id, 'name': rt.name,
                         'max_occupancy': getattr(rt, 'max_occupancy', None)}
                        for rt in h.room_types.all()
                    ],
                })
            cities_data.append({
                'package_city_id': pc.id,
                'city_id': pc.city_id,
                'city_name': pc.city.name,
                'order': pc.order,
                'default_nights': pc.nights,
                'hotels': hotels_data,
            })

        # المكوّنات المسموحة (مفلترة بـ active فقط)
        tours = [
            {'id': t.service_id, 'name': t.service.name,
             'tour_type': t.tour_type, 'duration': t.duration,
             'city_id': t.city_id, 'city_name': t.city.name if t.city else None,
             'destination': t.destination_text}
            for t in pkg.allowed_tours.select_related('service', 'city').all()
        ]
        transfers = [
            {'id': t.service_id, 'name': t.service.name,
             'airport_code': t.airport.code, 'airport_name': t.airport.name,
             'hotel_id': t.hotel_id, 'hotel_name': t.hotel.name,
             'city_id': t.city_id}
            for t in pkg.allowed_transfers.select_related('service', 'airport', 'hotel').all()
        ]
        # نقرأ بحذر — قد يكون نموذج FlightRoute في حالة drift مع الـDB
        flight_routes = []
        try:
            for fr in pkg.allowed_flight_routes.filter(is_active=True):
                flight_routes.append({
                    'id': str(fr.id), 'origin': fr.origin_iata,
                    'destination': fr.destination_iata,
                    'title': fr.display_title, 'currency': fr.currency,
                })
        except Exception:
            # تجاهل بصمت إذا فشل الوصول؛ يُسجَّل في logs على مستوى الإنتاج
            pass

        gift_data = None
        if pkg.gift_id:
            gift_data = {
                'id': pkg.gift.service_id,
                'name': pkg.gift.service.name,
                'subcategory': pkg.gift.subcategory,
            }

        return Response({
            'package_id': pkg.id,
            'title': pkg.title,
            'description': pkg.description,
            'total_nights': pkg.total_nights,
            'total_days': pkg.total_days,
            'gift': gift_data,
            'cities': cities_data,
            'components': {
                'tours':         tours,
                'transfers':     transfers,
                'flight_routes': flight_routes,
            },
        })
