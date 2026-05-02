from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin
from .models import ServiceCategory, Service
from .serializers import (
    ServiceCategorySerializer,
    ServiceSerializer,
    PublicServiceListSerializer,
    PublicServiceDetailSerializer,
)


class ServiceCategoryViewSet(viewsets.ModelViewSet):
    queryset = ServiceCategory.objects.all()
    serializer_class = ServiceCategorySerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]


class ServiceViewSet(viewsets.ModelViewSet):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'activate', 'deactivate'):
            return [IsAdminUser()] if self.action in ('activate', 'deactivate') else [IsAgencyOrAdmin()]
        return [IsAdminUser()]

    def get_queryset(self):
        qs = Service.objects.select_related('category', 'city').all()
        city_id = self.request.query_params.get('city')
        category_id = self.request.query_params.get('category')
        service_type = self.request.query_params.get('service_type')
        if city_id:
            qs = qs.filter(city_id=city_id)
        if category_id:
            qs = qs.filter(category_id=category_id)
        if service_type:
            qs = qs.filter(service_type=service_type)
        return qs

    # ═══════════════════════════════════════════════════════
    # POST /api/v1/services/{id}/activate/
    # ═══════════════════════════════════════════════════════
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def activate(self, request, pk=None):
        """
        تفعيل الخدمة لتُعرَض للسائح.
        الشروط: image + description + commission_percentage يجب أن تكون موجودة.
        """
        service = self.get_object()

        if not service.is_ready_for_activation:
            return Response({
                'error': 'لا يمكن تفعيل الخدمة — ينقصها:',
                'missing': service.missing_for_activation,
                'hint': 'يجب إضافة صورة + وصف + نسبة عمولة قبل التفعيل.',
            }, status=status.HTTP_400_BAD_REQUEST)

        service.is_active = True
        service.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'success': True,
            'message': 'تم تفعيل الخدمة بنجاح',
            'service': ServiceSerializer(service).data,
        })

    # ═══════════════════════════════════════════════════════
    # POST /api/v1/services/{id}/deactivate/
    # ═══════════════════════════════════════════════════════
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def deactivate(self, request, pk=None):
        """إخفاء الخدمة عن السائح."""
        service = self.get_object()
        service.is_active = False
        service.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'success': True,
            'message': 'تم إخفاء الخدمة',
            'service': ServiceSerializer(service).data,
        })


# ═══════════════════════════════════════════════════════════
# Public Views — للعرض العام للسائح (AllowAny)
# ═══════════════════════════════════════════════════════════

class PublicServiceListView(generics.ListAPIView):
    """
    GET /api/v1/public/services/

    قائمة الخدمات المُفعَّلة للعرض على الصفحة الرئيسية.
    Filters: ?service_type=, ?country_code=, ?city_id=
    Pagination: ?limit=&offset=
    """
    serializer_class = PublicServiceListSerializer
    permission_classes = [AllowAny]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        qs = (
            Service.objects
            .filter(is_active=True)
            .select_related('category', 'city__country')
            .prefetch_related('photos')
            .order_by('service_type', 'name')
        )

        service_type = self.request.query_params.get('service_type')
        country_code = self.request.query_params.get('country_code')
        city_id      = self.request.query_params.get('city_id')
        city_name    = self.request.query_params.get('city_name')

        if service_type:
            qs = qs.filter(service_type=service_type)
        if country_code:
            qs = qs.filter(city__country__iso2=country_code.upper())
        if city_id:
            qs = qs.filter(city_id=city_id)
        if city_name:
            qs = qs.filter(city__name__icontains=city_name)

        return qs


class PublicServiceDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/public/services/<id>/

    تفاصيل خدمة مُفعَّلة + كل صورها (للسائح).
    """
    serializer_class = PublicServiceDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'

    def get_queryset(self):
        return (
            Service.objects
            .filter(is_active=True)
            .select_related('category', 'city__country')
            .prefetch_related('photos')
        )
