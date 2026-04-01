from django.apps import AppConfig

class RoomsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.rooms'              # ← غيّرها إلى هذا
    verbose_name = "أنواع الغرف"