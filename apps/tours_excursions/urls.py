from rest_framework.routers import SimpleRouter
from .views import TourViewSet, AdminTourViewSet

# SimpleRouter لتجنب تسجيل API root view
router = SimpleRouter()
router.register(r'admin/tours', AdminTourViewSet, basename='admin-tour')
router.register(r'tours',       TourViewSet,      basename='tour')

urlpatterns = router.urls
