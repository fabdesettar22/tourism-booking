from rest_framework.routers import SimpleRouter
from .views import (
    AirportViewSet,
    AdminAirportViewSet,
    AirportTransferViewSet,
    AdminAirportTransferViewSet,
)

# SimpleRouter بدلاً من DefaultRouter حتى لا يُسجّل API root view على
# `/api/v1/services/` فيلتقط POST بدل ServiceViewSet.
router = SimpleRouter()
router.register(r'admin/airports',            AdminAirportViewSet,        basename='admin-airport')
router.register(r'airports',                  AirportViewSet,             basename='airport')
router.register(r'admin/airport-transfers',   AdminAirportTransferViewSet,basename='admin-airport-transfer')
router.register(r'airport-transfers',         AirportTransferViewSet,     basename='airport-transfer')

urlpatterns = router.urls
