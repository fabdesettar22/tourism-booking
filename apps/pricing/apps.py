from django.apps import AppConfig

class PricingConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pricing'          # ← يجب أن يكون كذلك
    verbose_name = "الأسعار والمواسم"
