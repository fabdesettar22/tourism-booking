"""
URL Routing لتطبيق hero_hotels.
"""
from django.urls import path

from apps.hero_hotels.views import (
    HeroHotelsListView,
    AdminHeroHotelListCreateView,
    AdminHeroHotelDetailView,
)

app_name = 'hero_hotels'

urlpatterns = [
    # Public
    path('',                HeroHotelsListView.as_view(),            name='list'),

    # Admin CRUD
    path('admin/',          AdminHeroHotelListCreateView.as_view(),  name='admin-list'),
    path('admin/<int:pk>/', AdminHeroHotelDetailView.as_view(),      name='admin-detail'),
]
