from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.pagination import LimitOffsetPagination
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin
from .models import Hotel, HotelPhoto
from .serializers.serializers import (
    HotelSerializer,
    HotelPhotoPublicSerializer,
    PublicHotelListSerializer,
    PublicHotelDetailSerializer,
)


class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [IsAgencyOrAdmin()]
        return [IsAdminUser()]

    # ═══════════════════════════════════════════════════════
    # POST /api/v1/hotels/{id}/activate/
    # ═══════════════════════════════════════════════════════
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def activate(self, request, pk=None):
        """
        تفعيل الفندق ليُعرَض للسائح.
        الشروط: image + description فقط (العمولة اختيارية).
        """
        hotel = self.get_object()

        if not hotel.is_ready_for_activation:
            return Response({
                'error': 'لا يمكن تفعيل الفندق — ينقصه:',
                'missing': hotel.missing_for_activation,
                'hint': 'يجب إضافة صورة ووصف قبل التفعيل.',
            }, status=status.HTTP_400_BAD_REQUEST)

        hotel.is_active = True
        hotel.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'success': True,
            'message': 'تم تفعيل الفندق بنجاح',
            'hotel': HotelSerializer(hotel).data,
        })

    # ═══════════════════════════════════════════════════════
    # POST /api/v1/hotels/{id}/deactivate/
    # ═══════════════════════════════════════════════════════
    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def deactivate(self, request, pk=None):
        """إخفاء الفندق عن السائح."""
        hotel = self.get_object()
        hotel.is_active = False
        hotel.save(update_fields=['is_active', 'updated_at'])

        return Response({
            'success': True,
            'message': 'تم إخفاء الفندق',
            'hotel': HotelSerializer(hotel).data,
        })

    # ═══════════════════════════════════════════════════════
    # GET /api/v1/hotels/{id}/photos/         — list
    # POST /api/v1/hotels/{id}/photos/        — upload (multipart: image, is_primary, caption)
    # DELETE /api/v1/hotels/{id}/photos/{pid}/ — delete one
    # POST /api/v1/hotels/{id}/photos/{pid}/set-primary/  — mark as primary
    # ═══════════════════════════════════════════════════════
    @action(detail=True, methods=['get', 'post'], url_path='photos', permission_classes=[IsAdminUser])
    def photos(self, request, pk=None):
        hotel = self.get_object()
        if request.method == 'GET':
            photos_qs = hotel.photos.all().order_by('-is_primary', 'order')
            return Response(HotelPhotoPublicSerializer(photos_qs, many=True, context={'request': request}).data)

        # POST — upload
        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'يجب إرفاق ملف image'}, status=status.HTTP_400_BAD_REQUEST)

        is_primary = str(request.data.get('is_primary', 'false')).lower() in ('true', '1', 'yes')
        caption    = request.data.get('caption', '')
        order      = int(request.data.get('order', 0) or 0)

        photo = HotelPhoto.objects.create(
            hotel=hotel, image=image, is_primary=is_primary,
            caption=caption, order=order,
        )
        return Response(
            HotelPhotoPublicSerializer(photo, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['delete'], url_path=r'photos/(?P<photo_id>\d+)', permission_classes=[IsAdminUser])
    def delete_photo(self, request, pk=None, photo_id=None):
        hotel = self.get_object()
        try:
            photo = hotel.photos.get(pk=photo_id)
        except HotelPhoto.DoesNotExist:
            return Response({'detail': 'not_found'}, status=status.HTTP_404_NOT_FOUND)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path=r'photos/(?P<photo_id>\d+)/set-primary', permission_classes=[IsAdminUser])
    def set_primary_photo(self, request, pk=None, photo_id=None):
        hotel = self.get_object()
        try:
            photo = hotel.photos.get(pk=photo_id)
        except HotelPhoto.DoesNotExist:
            return Response({'detail': 'not_found'}, status=status.HTTP_404_NOT_FOUND)
        photo.is_primary = True
        photo.save()  # save() ensures only one primary
        return Response(HotelPhotoPublicSerializer(photo, context={'request': request}).data)


# ═══════════════════════════════════════════════════════════
# Public Views — للعرض العام للسائح (AllowAny)
# ═══════════════════════════════════════════════════════════

class PublicHotelListView(generics.ListAPIView):
    """
    GET /api/v1/public/hotels/

    قائمة الفنادق المُفعَّلة للعرض على الصفحة الرئيسية.
    Filters: ?country_code=, ?city_id=, ?stars_min=
    Pagination: ?limit=&offset=
    """
    serializer_class = PublicHotelListSerializer
    permission_classes = [AllowAny]
    pagination_class = LimitOffsetPagination

    def get_queryset(self):
        qs = (
            Hotel.objects
            .filter(is_active=True)
            .select_related('city__country')
            .prefetch_related('photos')
            .order_by('-stars', 'name')
        )

        country_code = self.request.query_params.get('country_code')
        city_id      = self.request.query_params.get('city_id')
        city_name    = self.request.query_params.get('city_name')
        stars_min    = self.request.query_params.get('stars_min')

        if country_code:
            qs = qs.filter(city__country__iso2=country_code.upper())
        if city_id:
            qs = qs.filter(city_id=city_id)
        if city_name:
            qs = qs.filter(city__name__icontains=city_name)
        if stars_min:
            try:
                qs = qs.filter(stars__gte=int(stars_min))
            except ValueError:
                pass

        return qs


class PublicHotelDetailView(generics.RetrieveAPIView):
    """
    GET /api/v1/public/hotels/<id>/

    تفاصيل فندق مُفعَّل + كل صوره (للسائح).
    """
    serializer_class = PublicHotelDetailSerializer
    permission_classes = [AllowAny]
    lookup_field = 'id'

    def get_queryset(self):
        return (
            Hotel.objects
            .filter(is_active=True)
            .select_related('city__country')
            .prefetch_related('photos')
        )
