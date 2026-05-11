from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from apps.accounts.permissions import IsAdminUser

from .models import Airport, AirportTransfer, AirportTransferPhoto
from .serializers import (
    AirportSerializer,
    AirportTransferReadSerializer,
    AirportTransferWriteSerializer,
    AirportTransferQuoteSerializer,
    AirportTransferPhotoSerializer,
)
from .services import quote_airport_transfer, PricingError


MAX_PHOTOS_PER_TRANSFER = 7


class AirportViewSet(viewsets.ReadOnlyModelViewSet):
    """قائمة المطارات (للجمهور)."""
    queryset = Airport.objects.filter(is_active=True).select_related('city')
    serializer_class = AirportSerializer
    permission_classes = [AllowAny]


class AdminAirportViewSet(viewsets.ModelViewSet):
    """CRUD الإداري للمطارات — يسمح للأدمن بإضافة مطار جديد من الواجهة."""
    queryset = Airport.objects.all().select_related('city')
    serializer_class = AirportSerializer
    permission_classes = [IsAdminUser]
    lookup_field = 'code'

    def create(self, request, *args, **kwargs):
        # السماح بإنشاء بـ code فقط (auto-generated من الاسم لو لم يُعطَ)
        data = dict(request.data)
        if not data.get('code') and data.get('name'):
            # توليد code تلقائي من الأحرف الأولى للاسم (إنجليزية فقط، 5 أحرف max)
            import re
            words = re.findall(r'[A-Za-z]+', str(data.get('name', '')))
            auto_code = ''.join(w[0].upper() for w in words[:4]) if words else ''
            if auto_code:
                # تجنّب التكرار
                base = auto_code
                i = 1
                while Airport.objects.filter(code=auto_code).exists():
                    auto_code = f"{base}{i}"
                    i += 1
                data['code'] = auto_code
        serializer = self.get_serializer(data=data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class AirportTransferViewSet(viewsets.ReadOnlyModelViewSet):
    """قائمة خدمات النقل العامة + endpoint /quote/."""
    queryset = AirportTransfer.objects.select_related(
        'airport', 'airport__city', 'hotel', 'hotel__city', 'service',
    )
    serializer_class = AirportTransferReadSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        qs = super().get_queryset()
        airport_code = self.request.query_params.get('airport')
        hotel_id     = self.request.query_params.get('hotel')
        if airport_code:
            qs = qs.filter(airport__code__iexact=airport_code)
        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)
        return qs

    @action(detail=True, methods=['post'], permission_classes=[AllowAny])
    def quote(self, request, pk=None):
        """يحسب السعر النهائي لخدمة نقل محددة.

        Body: { "pax": 4, "direction": "round_trip", "include_tour_guide": false }
        """
        transfer = self.get_object()
        s = AirportTransferQuoteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            result = quote_airport_transfer(
                transfer,
                pax=s.validated_data['pax'],
                direction=s.validated_data['direction'],
                include_tour_guide=s.validated_data['include_tour_guide'],
            )
        except PricingError as e:
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


class AdminAirportTransferViewSet(viewsets.ModelViewSet):
    """CRUD الإداري للنقل من/إلى المطار + إدارة الصور."""
    queryset = AirportTransfer.objects.select_related('airport', 'hotel', 'service')
    permission_classes = [IsAdminUser]

    def get_serializer_class(self):
        if self.action in ('list', 'retrieve'):
            return AirportTransferReadSerializer
        return AirportTransferWriteSerializer

    @action(detail=True, methods=['post'], url_path='photos',
            parser_classes=[MultiPartParser, FormParser])
    def upload_photo(self, request, pk=None):
        transfer = self.get_object()
        if transfer.photos.count() >= MAX_PHOTOS_PER_TRANSFER:
            return Response(
                {'detail': f'الحد الأقصى {MAX_PHOTOS_PER_TRANSFER} صور لكل خدمة'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        f = request.FILES.get('image')
        if not f:
            return Response({'detail': 'لم يُرفع أي ملف'}, status=status.HTTP_400_BAD_REQUEST)
        is_primary = request.data.get('is_primary') in ('true', 'True', True, '1', 1)
        # لو هي أول صورة، اجعلها الرئيسية افتراضياً
        if not transfer.photos.exists():
            is_primary = True
        photo = AirportTransferPhoto.objects.create(
            transfer=transfer, image=f, is_primary=is_primary,
            caption=request.data.get('caption', ''),
            order=transfer.photos.count(),
        )
        return Response(AirportTransferPhotoSerializer(photo).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['delete'], url_path=r'photos/(?P<photo_id>\d+)')
    def delete_photo(self, request, pk=None, photo_id=None):
        transfer = self.get_object()
        try:
            photo = transfer.photos.get(pk=photo_id)
        except AirportTransferPhoto.DoesNotExist:
            return Response({'detail': 'الصورة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
        was_primary = photo.is_primary
        photo.delete()
        # لو حُذفت الرئيسية، اجعل أول صورة متبقية رئيسية
        if was_primary:
            first = transfer.photos.first()
            if first:
                first.is_primary = True
                first.save(update_fields=['is_primary'])
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=True, methods=['post'], url_path=r'photos/(?P<photo_id>\d+)/set-primary')
    def set_primary_photo(self, request, pk=None, photo_id=None):
        transfer = self.get_object()
        try:
            photo = transfer.photos.get(pk=photo_id)
        except AirportTransferPhoto.DoesNotExist:
            return Response({'detail': 'الصورة غير موجودة'}, status=status.HTTP_404_NOT_FOUND)
        photo.is_primary = True
        photo.save()
        return Response(AirportTransferPhotoSerializer(photo).data)
