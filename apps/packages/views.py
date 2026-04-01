from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import TourPackage
from .serializers.serializers import TourPackageSerializer

class TourPackageViewSet(viewsets.ModelViewSet):
    queryset = TourPackage.objects.filter(is_active=True).prefetch_related(
        'cities__hotels__hotel',
        'cities__services__service'
    )
    serializer_class = TourPackageSerializer
    permission_classes = [AllowAny]
