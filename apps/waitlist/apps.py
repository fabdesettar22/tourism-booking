from django.apps import AppConfig

class WaitlistConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.waitlist'
    verbose_name = 'Waitlist — قائمة الانتظار'

    def ready(self):
        # تحميل الـ signals عند بدء التشغيل
        from . import signals  # noqa: F401
