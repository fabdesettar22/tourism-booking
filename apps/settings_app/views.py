# apps/settings_app/views.py

from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.permissions import IsAdminUser
from .models import SiteSettings
from .serializers import SiteSettingsSerializer


class SiteSettingsView(APIView):

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]

    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        settings = SiteSettings.get()
        return Response(SiteSettingsSerializer(settings, context={'request': request}).data)

    def patch(self, request):
        settings = SiteSettings.get()
        serializer = SiteSettingsSerializer(
            settings, data=request.data,
            partial=True, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)

# ═══════════════════════════════════════════════════════════
# Homepage Config & Testimonials
# ═══════════════════════════════════════════════════════════

from rest_framework import generics, status
from .models import HomepageConfig, Testimonial
from .serializers import HomepageConfigSerializer, TestimonialSerializer


class HomepageConfigView(APIView):
    """
    GET  /api/v1/site-settings/homepage/  (public)
    PATCH /api/v1/site-settings/homepage/  (admin only)
    """
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAdminUser()]

    def get(self, request):
        config = HomepageConfig.get_solo()
        return Response(HomepageConfigSerializer(config, context={'request': request}).data)

    def patch(self, request):
        config = HomepageConfig.get_solo()
        serializer = HomepageConfigSerializer(
            config, data=request.data, partial=True,
            context={'request': request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(updated_by=request.user if request.user.is_authenticated else None)
        return Response(serializer.data)


class TestimonialListPublicView(generics.ListAPIView):
    """GET /api/v1/site-settings/testimonials/ — public (active only, ordered)."""
    permission_classes = [AllowAny]
    serializer_class   = TestimonialSerializer

    def get_queryset(self):
        return Testimonial.objects.filter(is_active=True).order_by('display_order', '-created_at')


class TestimonialAdminListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/site-settings/admin/testimonials/ — admin CRUD."""
    permission_classes = [IsAdminUser]
    serializer_class   = TestimonialSerializer
    queryset           = Testimonial.objects.all().order_by('display_order', '-created_at')


class TestimonialAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/site-settings/admin/testimonials/<pk>/."""
    permission_classes = [IsAdminUser]
    serializer_class   = TestimonialSerializer
    queryset           = Testimonial.objects.all()


# ═══════════════════════════════════════════════════════════
# Destinations
# ═══════════════════════════════════════════════════════════

from .models import Destination
from .serializers import DestinationSerializer


class DestinationListPublicView(generics.ListAPIView):
    """GET /api/v1/site-settings/destinations/ — public (active only)."""
    permission_classes = [AllowAny]
    serializer_class   = DestinationSerializer

    def get_queryset(self):
        return Destination.objects.filter(is_active=True).order_by('display_order', '-created_at')


class DestinationAdminListCreateView(generics.ListCreateAPIView):
    """GET/POST /api/v1/site-settings/admin/destinations/."""
    permission_classes = [IsAdminUser]
    serializer_class   = DestinationSerializer
    queryset           = Destination.objects.all().order_by('display_order', '-created_at')
    parser_classes     = [MultiPartParser, FormParser, JSONParser]


class DestinationAdminDetailView(generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/v1/site-settings/admin/destinations/<pk>/."""
    permission_classes = [IsAdminUser]
    serializer_class   = DestinationSerializer
    queryset           = Destination.objects.all()
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
