# apps/waitlist_agency/urls.py

from django.urls import path
from .views import (
    AgencyWaitlistRegisterView,
    AgencyWaitlistStatsView,
    AgencyWaitlistPendingListView,
    AgencyWaitlistApproveView,
    AgencyWaitlistRejectView,
)

app_name = 'waitlist_agency'

urlpatterns = [
    # POST /api/v1/waitlist-agency/register/
    path('register/',   AgencyWaitlistRegisterView.as_view(),     name='register'),

    # GET /api/v1/waitlist-agency/stats/
    path('stats/',      AgencyWaitlistStatsView.as_view(),        name='stats'),

    # ── Admin endpoints ──────────────────────────────
    path('admin/pending/',                    AgencyWaitlistPendingListView.as_view(), name='admin-pending'),
    path('admin/<uuid:pk>/approve/',          AgencyWaitlistApproveView.as_view(),     name='admin-approve'),
    path('admin/<uuid:pk>/reject/',           AgencyWaitlistRejectView.as_view(),      name='admin-reject'),
]
