from django.apps import AppConfig

class HotelsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.hotels'             # ← غيّرها إلى هذا
    verbose_name = "الفنادق"