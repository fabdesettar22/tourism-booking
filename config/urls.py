from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/packages/', include('apps.packages.urls')),
    path('api/locations/', include('apps.locations.urls')),
    path('api/hotels/', include('apps.hotels.urls')),
]

# خدمة الملفات الإعلامية (مهم جداً لعرض الصور)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)