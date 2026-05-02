"""
Views — endpoints الخاصة ببطاقات Hero Hotel.
تطبيق مستقل تماماً — لا يرتبط بالنظام الإعلاني.
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
    Endpoint عام (لا يحتاج تسجيل دخول).
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request):
        cards = HeroHotelCard.objects.filter(
            is_active=True
        ).order_by('display_order', '-created_at')

        serializer = HeroHotelCardSerializer(
            cards,
            many=True,
            context={'request': request},
        )

        return Response({
            'count':   cards.count(),
            'results': serializer.data,
        })


# ═══════════════════════════════════════════════════════════
# Admin endpoints — CRUD كامل
# ═══════════════════════════════════════════════════════════

from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from apps.accounts.permissions import IsAdminUser
from apps.hero_hotels.serializers import HeroHotelCardAdminSerializer


class AdminHeroHotelListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/v1/hero-hotels/admin/  — قائمة كل البطاقات (نشطة + معطّلة)
    POST /api/v1/hero-hotels/admin/  — إنشاء بطاقة جديدة
    """
    permission_classes = [IsAdminUser]
    serializer_class   = HeroHotelCardAdminSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    queryset           = HeroHotelCard.objects.all().order_by('display_order', '-created_at')


class AdminHeroHotelDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    /api/v1/hero-hotels/admin/<id>/  — تفاصيل
    PATCH  /api/v1/hero-hotels/admin/<id>/  — تعديل
    DELETE /api/v1/hero-hotels/admin/<id>/  — حذف
    """
    permission_classes = [IsAdminUser]
    serializer_class   = HeroHotelCardAdminSerializer
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    queryset           = HeroHotelCard.objects.all()
