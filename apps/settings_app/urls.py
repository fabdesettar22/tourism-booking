# apps/settings_app/urls.py

from django.urls import path
from .views import (
    SiteSettingsView,
    HomepageConfigView,
    TestimonialListPublicView,
    TestimonialAdminListCreateView,
    TestimonialAdminDetailView,
    DestinationListPublicView,
    DestinationAdminListCreateView,
    DestinationAdminDetailView,
)

urlpatterns = [
    path('',                                SiteSettingsView.as_view(),               name='site-settings'),

    # Homepage Config
    path('homepage/',                       HomepageConfigView.as_view(),             name='homepage-config'),

    # Testimonials — public
    path('testimonials/',                   TestimonialListPublicView.as_view(),      name='testimonials-public'),

    # Testimonials — admin CRUD
    path('admin/testimonials/',             TestimonialAdminListCreateView.as_view(), name='testimonials-admin-list'),
    path('admin/testimonials/<int:pk>/',    TestimonialAdminDetailView.as_view(),     name='testimonials-admin-detail'),

    # Destinations — public
    path('destinations/',                   DestinationListPublicView.as_view(),      name='destinations-public'),

    # Destinations — admin CRUD
    path('admin/destinations/',             DestinationAdminListCreateView.as_view(), name='destinations-admin-list'),
    path('admin/destinations/<int:pk>/',    DestinationAdminDetailView.as_view(),     name='destinations-admin-detail'),
]