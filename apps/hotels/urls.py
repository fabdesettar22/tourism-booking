from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import HotelViewSet, PublicHotelListView, PublicHotelDetailView

router = DefaultRouter()
router.register(r'', HotelViewSet)  # ← أزلنا 'hotels' لتجنب التكرار

urlpatterns = [
    path('', include(router.urls)),
]

# المسارات العامة (تُسجَّل في config/urls.py تحت api/v1/public/hotels/)
public_urlpatterns = [
    path('', PublicHotelListView.as_view(), name='public-hotel-list'),
    path('<int:id>/', PublicHotelDetailView.as_view(), name='public-hotel-detail'),
]
