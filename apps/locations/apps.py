from django.apps import AppConfig

class LocationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.locations'          # ← غيّرها إلى هذا
    verbose_name = "الدول والمدن"