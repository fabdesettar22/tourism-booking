from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUser

from .models import Tour, TourPhoto
from .serializers import (
    TourReadSerializer, TourWriteSerializer, TourQuoteSerializer,
    TourPhotoSerializer,
)
from .services import quote_tour, TourPricingError


MAX_PHOTOS_PER_TOUR = 7


class TourViewSet(viewsets.ReadOnlyModelViewSet):
    """قائمة الجولات السياحية للجمهور + endpoint /quote/."""
    queryset = Tour.objects.select_related(
        'origin_city', 'destination_city', 'service',
    )
    serializer_class = TourReadSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        tour_type = self.request.query_params.get('type')
        duration  = self.request.query_params.get('duration')
        if tour_type:
            qs = qs.filter(tour_type=tour_type)
        if duration:
            qs = qs.filter(duration=duration)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def quote(self, request, pk=None):
        tour = self.get_object()
        s = TourQuoteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            result = quote_tour(
                tour,
                pax=s.validated_data['pax'],
                direction=s.validated_data['direction'],
                include_tour_guide=s.validated_data['include_tour_guide'],
            )
        except TourPricingError as e:
            return Response(
                {'code': e.code, 'detail': str(e)},
                status=status.HTTP_400_BAD_REQUEST,
            )
        return Response({
            'bucket':               result['bucket'],
            'base_one_way_myr':     str(result['base_one_way_myr']),
            'direction':            result['direction'],
            'direction_multiplier': result['direction_multiplier'],
            'base_myr':             str(result['base_myr']),
            'margin_pct':           str(result['margin_pct']),
            'profit_myr':           str(result['profit_myr']),
            'tour_guide_myr':       str(result['tour_guide_myr']),
            'guide_margin_pct':     str(result['guide_margin_pct']),
            'guide_profit_myr':     str(result['guide_profit_myr']),
            'total_myr':            str(result['total_myr']),
            'currency':             result['currency'],
        })


class AdminTourViewSet(viewsets.ModelViewSet):
    """CRUD الإداري + إدارة الصور."""
    queryset = Tour.objects.select_related('origin_city', 'destination_city', 'service')
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return TourReadSerializer
        return TourWriteSerializer

    @action(detail=True, methods=['post'], url_path='photos',
            parser_classes=[MultiPartParser, FormParser])
    def upload_photo(self, request, pk=None):
        tour = self.get_object()
        if tour.photos.count() >= MAX_PHOTOS_PER_TOUR:
            return Response(
                {'detail': f'الحد الأقصى {MAX_PHOTOS_PER_TOUR} صور لكل جولة'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        f = request.FILES.get('image')
        if not f:
            return Response({'detail': 'لم يُرفع أي ملف'}, status=status.HTTP_400_BAD_REQUEST)
        is_primary = request.data.get('is_primary') in ('true', 'True', True, '1', 1)
        if not tour.photos.exists():
            is_primary = True
        photo = TourPhoto.objects.create(
            tour=tour, image=f, is_primary=is_primary,
            caption=request.data.get('caption', ''),
            order=tour.photos.count(),
        )
        return Response(TourPhotoSerializer(photo).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'photos/(?P<photo_id>\d+)')
    def delete_photo(self, request, pk=None, photo_id=None):
        tour = self.get_object()
        try:
            photo = tour.photos.get(pk=photo_id)
        except TourPhoto.DoesNotExist:
            return Response({'detail': 'الصورة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
        was_primary = photo.is_primary
        photo.delete()
        if was_primary:
            first = tour.photos.first()
            if first:
                first.is_primary = True
                first.save(update_fields=['is_primary'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path=r'photos/(?P<photo_id>\d+)/set-primary')
    def set_primary_photo(self, request, pk=None, photo_id=None):
        tour = self.get_object()
        try:
            photo = tour.photos.get(pk=photo_id)
        except TourPhoto.DoesNotExist:
            return Response({'detail': 'الصورة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
        photo.is_primary = True
        photo.save()
        return Response(TourPhotoSerializer(photo).data)
