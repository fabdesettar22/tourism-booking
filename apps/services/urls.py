from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    ServiceCategoryViewSet, ServiceViewSet,
    PublicServiceListView, PublicServiceDetailView,
)

router = DefaultRouter()
router.register(r'categories', ServiceCategoryViewSet)
router.register(r'', ServiceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]

# المسارات العامة (تُسجَّل في config/urls.py تحت api/v1/public/services/)
public_urlpatterns = [
    path('', PublicServiceListView.as_view(), name='public-service-list'),
    path('<int:id>/', PublicServiceDetailView.as_view(), name='public-service-detail'),
]
