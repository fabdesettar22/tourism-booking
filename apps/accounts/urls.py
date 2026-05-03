# apps/accounts/urls.py

from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.accounts.views.auth_views import TokenRefreshView
from apps.accounts.views.crud_views import AgencyViewSet, UserViewSet, ChangePasswordView

from apps.accounts.views.auth_views import (
    SupplierRegisterStep1View,
    SupplierRegisterStep2View,
    SupplierRegisterStep3View,
    SupplierRegisterStep4View,
    VerifyEmailView,
    LoginView,
    LogoutView,
    MeView,
    SupplierPendingListView,
    SupplierApproveView,
    SupplierRejectView,
    SupplierAllListView,
    OtpRequestView,
    OtpVerifyView,
    SupplierMeView,
)

from apps.accounts.views.agency_views import (
    HQAgencyListView,
    HQAgencyDetailView,
    HQAgencyCreateView,
    AgencyRegisterView,
    AgencyActivationView,
    AgencyActivationCheckView,
    HQAgencyPendingListView,
    HQAgencyApproveView,
    HQAgencyRejectView,
)

urlpatterns = [
    # ── Auth ──────────────────────────────────
    path('login/',         LoginView.as_view(),        name='login'),
    path('logout/',        LogoutView.as_view(),       name='logout'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token-refresh'),
    path('me/',            MeView.as_view(),           name='me'),
    path('change-password/', ChangePasswordView.as_view(), name='change-password'),

    # ── OTP Auth (للموردين — بدون كلمة سر) ────
    path('otp/request/',   OtpRequestView.as_view(),   name='otp-request'),
    path('otp/verify/',    OtpVerifyView.as_view(),    name='otp-verify'),
    path('supplier/me/',   SupplierMeView.as_view(),   name='supplier-me'),

    # ── Supplier Onboarding ───────────────────
    path('supplier/register/step1/', SupplierRegisterStep1View.as_view(), name='supplier-register-step1'),
    path('supplier/register/step2/', SupplierRegisterStep2View.as_view(), name='supplier-register-step2'),
    path('supplier/register/step3/', SupplierRegisterStep3View.as_view(), name='supplier-register-step3'),
    path('supplier/register/step4/', SupplierRegisterStep4View.as_view(), name='supplier-register-step4'),
    path('supplier/verify-email/',   VerifyEmailView.as_view(),           name='supplier-verify-email'),

    # ── Admin — إدارة الموردين ────────────────
    path('admin/suppliers/',                            SupplierAllListView.as_view(),     name='admin-suppliers-list'),
    path('admin/suppliers/pending/',                    SupplierPendingListView.as_view(), name='admin-suppliers-pending'),
    path('admin/suppliers/<uuid:supplier_id>/approve/', SupplierApproveView.as_view(),     name='admin-supplier-approve'),
    path('admin/suppliers/<uuid:supplier_id>/reject/',  SupplierRejectView.as_view(),      name='admin-supplier-reject'),

    # ═══════════════════════════════════════════════════════
    # AGENCY — تسجيل + تفعيل + إدارة HQ
    # ═══════════════════════════════════════════════════════

    # تسجيل وكالة جديدة (عام)
    path('register/agency/',        AgencyRegisterView.as_view(),        name='agency-register'),

    # تفعيل الوكالة بعد الموافقة (عام)
    path('agency/activate/',        AgencyActivationView.as_view(),      name='agency-activate'),
    path('agency/activate/check/',  AgencyActivationCheckView.as_view(), name='agency-activate-check'),

    # إدارة الوكالات — HQ فقط
    path('admin/agencies/pending/',                       HQAgencyPendingListView.as_view(), name='admin-agencies-pending'),
    path('admin/agencies/<int:agency_id>/approve/',       HQAgencyApproveView.as_view(),     name='admin-agency-approve'),
    path('admin/agencies/<int:agency_id>/reject/',        HQAgencyRejectView.as_view(),      name='admin-agency-reject'),

    # ─── CRUD على الوكالات (للأدمن) ─────────────────
    path('admin/agencies/',                               HQAgencyListView.as_view(),        name='admin-agencies-list'),
    path('admin/agencies/create/',                        HQAgencyCreateView.as_view(),      name='admin-agency-create'),
    path('admin/agencies/<int:agency_id>/',               HQAgencyDetailView.as_view(),      name='admin-agency-detail'),
]

# ─── ViewSets للـ CRUD العام (يستخدمها الـ Frontend في الـ Dashboard) ───
router = DefaultRouter()
router.register(r'agencies', AgencyViewSet, basename='agency')
router.register(r'users',    UserViewSet,   basename='user')

urlpatterns += [
    path('', include(router.urls)),
]
