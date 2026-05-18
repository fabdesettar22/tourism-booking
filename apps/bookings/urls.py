from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import BookingViewSet, AgencyDashboardStatsView
from .views_calculator import BookingCalculateView

router = DefaultRouter()
router.register(r'', BookingViewSet, basename='booking')

urlpatterns = [
    path('dashboard-stats/', AgencyDashboardStatsView.as_view(), name='agency-dashboard-stats'),
    path('calculate/',       BookingCalculateView.as_view(),     name='booking-calculate'),
    path('', include(router.urls)),
]