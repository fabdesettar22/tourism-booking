"""
URL Routing لتطبيق hero_hotels.
"""
from django.urls import path

from apps.hero_hotels.views import HeroHotelsListView

app_name = 'hero_hotels'

urlpatterns = [
    path(
        '',
        HeroHotelsListView.as_view(),
        name='list',
    ),
]
