"""
Views — endpoints الخاصة ببطاقات Hero Hotel.
"""
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.hero_hotels.models import HeroHotelCard
from apps.hero_hotels.serializers import HeroHotelCardSerializer


class HeroHotelsListView(APIView):
    """
    GET /api/v1/hero-hotels/
    
    يرجع قائمة البطاقات المفعّلة فقط، مرتّبة حسب display_order.
    Endpoint عام (لا يحتاج تسجيل دخول) لأن الصفحة الرئيسية مفتوحة للجميع.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        # جلب البطاقات المفعّلة فقط، مرتّبة
        cards = HeroHotelCard.objects.filter(
            is_active=True
        ).order_by('display_order', '-created_at')

        # تحويل إلى JSON
        serializer = HeroHotelCardSerializer(
            cards,
            many=True,
            context={'request': request},  # ← مهم: لتوليد روابط كاملة للصور
        )

        return Response({
            'count': cards.count(),
            'results': serializer.data,
        })
