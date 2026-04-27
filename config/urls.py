from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),

    # ─── API v1 ───────────────────────────────────────────
    path('api/v1/accounts/',          include('apps.accounts.urls')),
    path('api/v1/locations/',         include('apps.locations.urls')),
    path('api/v1/hotels/',            include('apps.hotels.urls')),
    path('api/v1/rooms/',             include('apps.rooms.urls')),
    path('api/v1/pricing/',           include('apps.pricing.urls')),
    path('api/v1/services/',          include('apps.services.urls')),
    path('api/v1/packages/',          include('apps.packages.urls')),
    path('api/v1/bookings/',          include('apps.bookings.urls')),
    path('api/v1/site-settings/',     include('apps.settings_app.urls')),
    path('api/v1/notifications/',     include('apps.notifications.urls')),
    path('api/v1/suppliers/',         include('apps.suppliers.urls')),
    path('api/v1/waitlist/',          include('apps.waitlist.urls')),
    path('api/v1/waitlist-agency/',   include('apps.waitlist_agency.urls')),
    path('api/v1/hero-hotels/',       include('apps.hero_hotels.urls', namespace='hero_hotels')),
    path('api/v1/advertising/',      include('apps.advertising.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
