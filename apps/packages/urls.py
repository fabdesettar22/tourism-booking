from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CustomPackageViewSet
from .views_template import PackageTemplateAdminViewSet, PackageAgencyViewSet

# ── Template router (HQ admin) — يأتي قبل legacy لأولويته ──
admin_router = DefaultRouter()
admin_router.register(r'templates', PackageTemplateAdminViewSet, basename='package-template-admin')

# ── Agency public router ──────────────────────────────
agency_router = DefaultRouter()
agency_router.register(r'', PackageAgencyViewSet, basename='package-agency')

# ── Legacy router (الباقات بنمط القديم) ───────────────
legacy_router = DefaultRouter()
legacy_router.register(r'', CustomPackageViewSet, basename='custom-package')

urlpatterns = [
    # New template API (مفضّل)
    path('admin/',  include(admin_router.urls)),
    path('agency/', include(agency_router.urls)),
    # Legacy (متوافق مع القديم) — يجب أن يأتي أخيراً لأن '' يلتقط كل شيء
    path('', include(legacy_router.urls)),
]