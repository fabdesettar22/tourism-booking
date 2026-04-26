"""
HeroHotelCard — بطاقات الفنادق الدوّارة في Hero الصفحة الرئيسية.

فنادق تدفع مقابل الظهور في هذه البطاقات (Sponsored placements).
إدارتها مركزية من HQ فقط (لا ترتبط بـ tenant).
"""
import uuid

from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator


def hero_hotel_logo_path(instance, filename):
    """يحفظ الشعار في: media/hero_hotels/logos/<uuid>.<ext>"""
    ext = filename.split('.')[-1].lower()
    return f'hero_hotels/logos/{uuid.uuid4()}.{ext}'


def hero_hotel_card_image_path(instance, filename):
    """يحفظ صورة البطاقة في: media/hero_hotels/card_images/<uuid>.<ext>"""
    ext = filename.split('.')[-1].lower()
    return f'hero_hotels/card_images/{uuid.uuid4()}.{ext}'


def hero_hotel_hero_image_path(instance, filename):
    """يحفظ صورة الخلفية في: media/hero_hotels/hero_images/<uuid>.<ext>"""
    ext = filename.split('.')[-1].lower()
    return f'hero_hotels/hero_images/{uuid.uuid4()}.{ext}'


class HeroHotelCard(models.Model):
    """
    بطاقة فندق في Hero الصفحة الرئيسية.
    تظهر بالترتيب (display_order) وتتبدل كل 5 ثوانٍ.
    """

    uid = models.UUIDField(
        default=uuid.uuid4,
        editable=False,
        unique=True,
        verbose_name='معرّف فريد',
    )

    # ═══════ الحقول الأساسية ═══════

    name = models.CharField(
        max_length=200,
        verbose_name='اسم الفندق',
        help_text='مثال: Mandarin Oriental',
    )

    logo = models.ImageField(
        upload_to=hero_hotel_logo_path,
        verbose_name='شعار الفندق',
        help_text='صورة صغيرة (يُفضّل PNG شفاف)',
    )

    stars = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        default=5,
        verbose_name='عدد النجوم',
        help_text='من 1 إلى 5',
    )

    description = models.TextField(
        verbose_name='وصف الفندق',
        help_text='نص يظهر أسفل اسم الفندق في البطاقة',
    )

    location = models.CharField(
        max_length=100,
        verbose_name='الموقع',
        help_text='مثال: Kuala Lumpur',
    )

    # ═══════ الصورتان المنفصلتان ═══════

    card_image = models.ImageField(
        upload_to=hero_hotel_card_image_path,
        verbose_name='صورة البطاقة',
        help_text='الصورة التي تظهر داخل بطاقة الفندق (يُفضّل 800×600 أو أعلى)',
    )

    hero_image = models.ImageField(
        upload_to=hero_hotel_hero_image_path,
        verbose_name='صورة الخلفية',
        help_text='الصورة التي تظهر كخلفية للـ Hero بالكامل (يُفضّل 1920×1080 أو أعلى)',
    )

    # ═══════ حقول إدارية ═══════

    display_order = models.PositiveIntegerField(
        default=0,
        db_index=True,
        verbose_name='ترتيب العرض',
        help_text='الرقم الأقل = يظهر أولاً في الدوران',
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
        verbose_name='مفعّل',
        help_text='إذا أُلغي التفعيل، لن تظهر البطاقة في الصفحة الرئيسية',
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name='تاريخ الإنشاء',
    )

    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name='آخر تعديل',
    )

    class Meta:
        db_table = 'hero_hotel_card'
        verbose_name = 'بطاقة فندق Hero'
        verbose_name_plural = 'بطاقات فنادق Hero'
        ordering = ['display_order', '-created_at']

    def __str__(self):
        return f'{self.name} ({self.location}) — #{self.display_order}'
