from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    SeasonViewSet, RoomPriceViewSet,
    CurrenciesView, RatesView, QuoteView,
    ExchangeRateAdminViewSet, RefreshRatesView,
)

router = DefaultRouter()
router.register(r'seasons', SeasonViewSet)
router.register(r'room-prices', RoomPriceViewSet)
router.register(r'admin/rates', ExchangeRateAdminViewSet, basename='admin-rates')

urlpatterns = [
    path('currencies/', CurrenciesView.as_view(), name='pricing-currencies'),
    path('rates/',      RatesView.as_view(),      name='pricing-rates'),
    path('quote/',      QuoteView.as_view(),      name='pricing-quote'),
    path('admin/refresh-rates/', RefreshRatesView.as_view(), name='pricing-refresh-rates'),
    path('', include(router.urls)),
]
