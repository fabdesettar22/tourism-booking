from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from .models import Hotel
from .serializers.serializers import HotelSerializer

class HotelViewSet(viewsets.ModelViewSet):
    queryset = Hotel.objects.all()
    serializer_class = HotelSerializer
    permission_classes = [AllowAny]