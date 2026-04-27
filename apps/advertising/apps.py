# apps/advertising/apps.py

from django.apps import AppConfig


class AdvertisingConfig(AppConfig):
    """
    تطبيق الإعلانات — إدارة كاملة للنظام الإعلاني.
    
    يدعم:
    - 5 أنواع إعلانات (Banner, Hero, Popup, Featured, Carousel)
    - 12 موقع للعرض
    - استهداف كامل (لغة، دولة، جهاز، مستخدم، وقت، أيام)
    - تتبع المشاهدات والنقرات
    """
    
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.advertising'
    verbose_name = 'النظام الإعلاني'
