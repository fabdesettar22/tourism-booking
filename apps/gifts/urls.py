from rest_framework.routers import SimpleRouter
from .views import GiftViewSet, AdminGiftViewSet

router = SimpleRouter()
router.register(r'admin/gifts', AdminGiftViewSet, basename='admin-gift')
router.register(r'gifts',       GiftViewSet,      basename='gift')

urlpatterns = router.urls
