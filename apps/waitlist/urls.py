# apps/waitlist/urls.py

from django.urls import path
from .views import (
    PropertyWaitlistView,
    TransportWaitlistView,
    RestaurantWaitlistView,
    GuideWaitlistView,
    ActivityWaitlistView,
    WellnessWaitlistView,
    OtherServiceWaitlistView,
    WaitlistStatsView,
    SupplierWaitlistPendingListView,
    SupplierWaitlistApproveView,
    SupplierWaitlistRejectView,
    WaitlistPhotoUploadView,
    WaitlistPhotoDeleteView,
    WaitlistPhotoSetPrimaryView,
    WaitlistPhotoListView,
)

urlpatterns = [
    # ── Supplier Types (Public) ───────────────────────────
    path('property/',   PropertyWaitlistView.as_view(),    name='waitlist-property'),
    path('transport/',  TransportWaitlistView.as_view(),   name='waitlist-transport'),
    path('restaurant/', RestaurantWaitlistView.as_view(),  name='waitlist-restaurant'),
    path('guide/',      GuideWaitlistView.as_view(),       name='waitlist-guide'),
    path('activity/',   ActivityWaitlistView.as_view(),    name='waitlist-activity'),
    path('wellness/',   WellnessWaitlistView.as_view(),    name='waitlist-wellness'),
    path('other/',      OtherServiceWaitlistView.as_view(),name='waitlist-other'),

    # ── Stats ─────────────────────────────────────────────
    path('stats/',      WaitlistStatsView.as_view(),       name='waitlist-stats'),

    # ── Admin Endpoints ───────────────────────────────────
    path('admin/pending/',                        SupplierWaitlistPendingListView.as_view(), name='admin-suppliers-pending'),
    path('admin/<str:type>/<uuid:pk>/approve/',   SupplierWaitlistApproveView.as_view(),     name='admin-supplier-approve'),
    path('admin/<str:type>/<uuid:pk>/reject/',    SupplierWaitlistRejectView.as_view(),      name='admin-supplier-reject'),

    # ── Photos ────────────────────────────────────────────
    path('photos/upload/',              WaitlistPhotoUploadView.as_view(),    name='waitlist-photo-upload'),
    path('photos/',                     WaitlistPhotoListView.as_view(),      name='waitlist-photo-list'),
    path('photos/<int:pk>/delete/',     WaitlistPhotoDeleteView.as_view(),    name='waitlist-photo-delete'),
    path('photos/<int:pk>/set-primary/',WaitlistPhotoSetPrimaryView.as_view(),name='waitlist-photo-set-primary'),
]
