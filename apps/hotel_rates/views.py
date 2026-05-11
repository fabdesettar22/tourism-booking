from datetime import date

from rest_framework import status, viewsets
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUser

from .models import (
    HotelGuestPricing,
    HotelSeason,
    HotelSeasonDateRange,
    HotelSurcharge,
    PricingTierDef,
    RoomCategory,
    RoomCategoryPhoto,
    RoomInclusion,
    RoomRate,
)
from .services import HotelQuoteError, quote_hotel_stay
from .serializers import (
    HotelGuestPricingSerializer,
    HotelSeasonDateRangeSerializer,
    HotelSeasonSerializer,
    HotelSurchargeSerializer,
    PricingTierDefSerializer,
    RoomCategoryPhotoSerializer,
    RoomCategorySerializer,
    RoomInclusionSerializer,
    RoomRateSerializer,
)


# ═══════════════════════════════════════════════════════════
# Public (read-only) viewsets — للعرض على واجهة المسافر/الوكيل
# ═══════════════════════════════════════════════════════════

class RoomCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    """قائمة فئات الغرف العامة. يدعم فلترة `?hotel=<id>`."""
    queryset = RoomCategory.objects.filter(is_active=True).prefetch_related('inclusions')
    serializer_class = RoomCategorySerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        hotel = self.request.query_params.get('hotel')
        base_type = self.request.query_params.get('base_type')
        view_type = self.request.query_params.get('view_type')
        if hotel:
            qs = qs.filter(hotel_id=hotel)
        if base_type:
            qs = qs.filter(base_type=base_type)
        if view_type:
            qs = qs.filter(view_type=view_type)
        return qs


class HotelSeasonViewSet(viewsets.ReadOnlyModelViewSet):
    """قائمة المواسم العامة. يدعم فلترة `?hotel=<id>`."""
    queryset = HotelSeason.objects.filter(is_active=True).prefetch_related('date_ranges')
    serializer_class = HotelSeasonSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        hotel = self.request.query_params.get('hotel')
        if hotel:
            qs = qs.filter(hotel_id=hotel)
        return qs


class RoomRateViewSet(viewsets.ReadOnlyModelViewSet):
    """قائمة الأسعار العامة. يدعم فلترة `?category=<id>&tier=<tier>`."""
    queryset = RoomRate.objects.filter(is_active=True).select_related('room_category', 'season')
    serializer_class = RoomRateSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.query_params.get('category')
        hotel = self.request.query_params.get('hotel')
        tier = self.request.query_params.get('tier')
        if category:
            qs = qs.filter(room_category_id=category)
        if hotel:
            qs = qs.filter(room_category__hotel_id=hotel)
        if tier:
            qs = qs.filter(pricing_tier=tier)
        return qs


# ═══════════════════════════════════════════════════════════
# Admin viewsets — full CRUD
# ═══════════════════════════════════════════════════════════

class AdminRoomCategoryViewSet(viewsets.ModelViewSet):
    queryset = RoomCategory.objects.all().prefetch_related('inclusions', 'photos')
    serializer_class = RoomCategorySerializer
    permission_classes = [IsAdminUser]

    # GET /api/v1/hotel-rates/admin/categories/{id}/photos/  — list
    # POST /api/v1/hotel-rates/admin/categories/{id}/photos/ — upload
    @action(detail=True, methods=['get', 'post'], url_path='photos')
    def photos(self, request, pk=None):
        category = self.get_object()
        if request.method == 'GET':
            qs = category.photos.all().order_by('-is_primary', 'order')
            return Response(RoomCategoryPhotoSerializer(qs, many=True, context={'request': request}).data)

        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'يجب إرفاق ملف image'}, status=status.HTTP_400_BAD_REQUEST)
        is_primary = str(request.data.get('is_primary', 'false')).lower() in ('true', '1', 'yes')
        caption = request.data.get('caption', '')
        order = int(request.data.get('order', 0) or 0)
        photo = RoomCategoryPhoto.objects.create(
            room_category=category, image=image, is_primary=is_primary,
            caption=caption, order=order,
        )
        return Response(
            RoomCategoryPhotoSerializer(photo, context={'request': request}).data,
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['delete'], url_path=r'photos/(?P<photo_id>\d+)')
    def delete_photo(self, request, pk=None, photo_id=None):
        category = self.get_object()
        try:
            photo = category.photos.get(pk=photo_id)
        except RoomCategoryPhoto.DoesNotExist:
            return Response({'detail': 'not_found'}, status=status.HTTP_404_NOT_FOUND)
        photo.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path=r'photos/(?P<photo_id>\d+)/set-primary')
    def set_primary_photo(self, request, pk=None, photo_id=None):
        category = self.get_object()
        try:
            photo = category.photos.get(pk=photo_id)
        except RoomCategoryPhoto.DoesNotExist:
            return Response({'detail': 'not_found'}, status=status.HTTP_404_NOT_FOUND)
        photo.is_primary = True
        photo.save()
        return Response(RoomCategoryPhotoSerializer(photo, context={'request': request}).data)


class AdminHotelSeasonViewSet(viewsets.ModelViewSet):
    queryset = HotelSeason.objects.all().prefetch_related('date_ranges')
    serializer_class = HotelSeasonSerializer
    permission_classes = [IsAdminUser]


class AdminHotelSeasonDateRangeViewSet(viewsets.ModelViewSet):
    queryset = HotelSeasonDateRange.objects.all()
    serializer_class = HotelSeasonDateRangeSerializer
    permission_classes = [IsAdminUser]


class AdminRoomRateViewSet(viewsets.ModelViewSet):
    queryset = RoomRate.objects.all().select_related('room_category', 'season')
    serializer_class = RoomRateSerializer
    permission_classes = [IsAdminUser]


class AdminHotelSurchargeViewSet(viewsets.ModelViewSet):
    queryset = HotelSurcharge.objects.all()
    serializer_class = HotelSurchargeSerializer
    permission_classes = [IsAdminUser]


class AdminRoomInclusionViewSet(viewsets.ModelViewSet):
    queryset = RoomInclusion.objects.all()
    serializer_class = RoomInclusionSerializer
    permission_classes = [IsAdminUser]


class PricingTierDefViewSet(viewsets.ReadOnlyModelViewSet):
    """قائمة طبقات التسعير العامة. يدعم فلترة `?hotel=<id>`."""
    queryset = PricingTierDef.objects.filter(is_active=True)
    serializer_class = PricingTierDefSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        hotel = self.request.query_params.get('hotel')
        if hotel:
            qs = qs.filter(hotel_id=hotel)
        return qs


class AdminPricingTierDefViewSet(viewsets.ModelViewSet):
    queryset = PricingTierDef.objects.all()
    serializer_class = PricingTierDefSerializer
    permission_classes = [IsAdminUser]


class HotelGuestPricingViewSet(viewsets.ReadOnlyModelViewSet):
    """قائمة أسعار الضيوف للفندق (لكل طبقة). يدعم `?hotel=<id>`."""
    queryset = HotelGuestPricing.objects.all().select_related('tier')
    serializer_class = HotelGuestPricingSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        hotel = self.request.query_params.get('hotel')
        if hotel:
            qs = qs.filter(hotel_id=hotel)
        return qs


class AdminHotelGuestPricingViewSet(viewsets.ModelViewSet):
    queryset = HotelGuestPricing.objects.all().select_related('tier')
    serializer_class = HotelGuestPricingSerializer
    permission_classes = [IsAdminUser]


# ═══════════════════════════════════════════════════════════
# Calculator endpoint — POST /api/v1/hotel-rates/quote/
# ═══════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
def quote_view(request):
    """احسب التسعيرة الكاملة لإقامة فندق.

    Body:
    {
      "room_category": 123,
      "check_in":  "2026-05-15",
      "check_out": "2026-05-18",
      "pricing_tier": "fit",        # optional, default fit
      "occupancy": "double",        # optional, default double
      "adults": 2,
      "children_with_bed": 0,
      "children_without_bed": 1,
      "infants": 0,
      "extra_beds": 0,
      "apply_markup": true,         # optional, default true
      "apply_tax": true             # optional, default true
    }
    """
    data = request.data
    try:
        category_id = int(data.get('room_category'))
        category = RoomCategory.objects.get(pk=category_id)
        check_in = date.fromisoformat(data['check_in'])
        check_out = date.fromisoformat(data['check_out'])
    except (KeyError, ValueError, TypeError) as e:
        return Response({'error': 'invalid_input', 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except RoomCategory.DoesNotExist:
        return Response({'error': 'category_not_found'}, status=status.HTTP_404_NOT_FOUND)

    try:
        result = quote_hotel_stay(
            room_category=category,
            check_in=check_in,
            check_out=check_out,
            pricing_tier=data.get('pricing_tier', 'FIT'),
            occupancy=data.get('occupancy', 'double'),
            number_of_rooms=int(data.get('number_of_rooms', 1)),
            adults=int(data.get('adults', 2)),
            children_with_bed=int(data.get('children_with_bed', 0)),
            children_without_bed=int(data.get('children_without_bed', 0)),
            infants=int(data.get('infants', 0)),
            extra_beds=int(data.get('extra_beds', 0)),
            apply_markup=bool(data.get('apply_markup', True)),
            apply_tax=bool(data.get('apply_tax', True)),
        )
    except HotelQuoteError as e:
        return Response({'error': e.code, 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # Add hotel + category context for UI display
    result['hotel'] = {
        'id': category.hotel_id,
        'name': category.hotel.name,
        'stars': category.hotel.stars,
    }
    result['room_category'] = {
        'id': category.id,
        'name': category.name,
        'view_type': category.view_type,
        'pax': category.pax,
    }

    return Response(result, status=status.HTTP_200_OK)
