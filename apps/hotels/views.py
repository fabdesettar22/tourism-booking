from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin
from .models import Hotel
from .serializers.serializers import HotelSerializer


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
        الشروط: image + description + commission_percentage يجب أن تكون موجودة.
        """
        hotel = self.get_object()

        if not hotel.is_ready_for_activation:
            return Response({
                'error': 'لا يمكن تفعيل الفندق — ينقصه:',
                'missing': hotel.missing_for_activation,
                'hint': 'يجب إضافة صورة + وصف + نسبة عمولة قبل التفعيل.',
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
