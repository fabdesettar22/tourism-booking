from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUser

from .models import Gift, GiftPhoto
from .serializers import (
    GiftReadSerializer, GiftWriteSerializer, GiftQuoteSerializer,
    GiftPhotoSerializer,
)
from .services import quote_gift, GiftPricingError


MAX_PHOTOS_PER_GIFT = 7


class GiftViewSet(viewsets.ReadOnlyModelViewSet):
    """قائمة الهدايا للجمهور + endpoint /quote/."""
    queryset = Gift.objects.select_related('service').prefetch_related('photos')
    serializer_class = GiftReadSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        sub = self.request.query_params.get('subcategory')
        if sub:
            qs = qs.filter(subcategory=sub)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def quote(self, request, pk=None):
        gift = self.get_object()
        s = GiftQuoteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            result = quote_gift(gift, quantity=s.validated_data['quantity'])
        except GiftPricingError as e:
            return Response({'code': e.code, 'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
        return Response({k: (str(v) if hasattr(v, 'quantize') else v) for k, v in result.items()})


class AdminGiftViewSet(viewsets.ModelViewSet):
    """CRUD الإداري + إدارة الصور."""
    queryset = Gift.objects.select_related('service').prefetch_related('photos')
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return GiftReadSerializer
        return GiftWriteSerializer

    @action(detail=True, methods=['post'], url_path='photos',
            parser_classes=[MultiPartParser, FormParser])
    def upload_photo(self, request, pk=None):
        gift = self.get_object()
        if gift.photos.count() >= MAX_PHOTOS_PER_GIFT:
            return Response(
                {'detail': f'الحد الأقصى {MAX_PHOTOS_PER_GIFT} صور لكل هدية'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        f = request.FILES.get('image')
        if not f:
            return Response({'detail': 'لم يُرفع أي ملف'}, status=status.HTTP_400_BAD_REQUEST)
        is_primary = request.data.get('is_primary') in ('true', 'True', True, '1', 1)
        if not gift.photos.exists():
            is_primary = True
        photo = GiftPhoto.objects.create(
            gift=gift, image=f, is_primary=is_primary,
            caption=request.data.get('caption', ''),
            order=gift.photos.count(),
        )
        return Response(GiftPhotoSerializer(photo).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'photos/(?P<photo_id>\d+)')
    def delete_photo(self, request, pk=None, photo_id=None):
        gift = self.get_object()
        try:
            photo = gift.photos.get(pk=photo_id)
        except GiftPhoto.DoesNotExist:
            return Response({'detail': 'الصورة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
        was_primary = photo.is_primary
        photo.delete()
        if was_primary:
            first = gift.photos.first()
            if first:
                first.is_primary = True
                first.save(update_fields=['is_primary'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path=r'photos/(?P<photo_id>\d+)/set-primary')
    def set_primary_photo(self, request, pk=None, photo_id=None):
        gift = self.get_object()
        try:
            photo = gift.photos.get(pk=photo_id)
        except GiftPhoto.DoesNotExist:
            return Response({'detail': 'الصورة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
        photo.is_primary = True
        photo.save()
        return Response(GiftPhotoSerializer(photo).data)
