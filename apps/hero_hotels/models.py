"""
HeroHotelCard — بطاقات الفنادق الدوّارة في Hero الصفحة الرئيسية.

فنادق تدفع مقابل الظهور في هذه البطاقات (Sponsored placements).
إدارتها مركزية من HQ فقط (لا ترتبط بـ tenant).
"""
import uuid

from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import MinValueValidator, MaxValueValidator, FileExtensionValidator


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


def hero_card_video_path(instance, filename):
    ext = filename.split('.')[-1].lower()
    return f'hero_cards/videos/card/{uuid.uuid4()}.{ext}'


def hero_bg_video_path(instance, filename):
    ext = filename.split('.')[-1].lower()
    return f'hero_cards/videos/hero/{uuid.uuid4()}.{ext}'


CARD_TYPE_CHOICES = [
    ('hotel',   'فندق'),
    ('partner', 'شريك'),
    ('sponsor', 'ممول/راعي'),
    ('custom',  'عام'),
]

VIDEO_EXTS = ['mp4', 'webm', 'mov', 'm4v']


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

    card_type = models.CharField(
        max_length=10,
        choices=CARD_TYPE_CHOICES,
        default='hotel',
        db_index=True,
        verbose_name='نوع البطاقة',
    )

    logo = models.ImageField(
        upload_to=hero_hotel_logo_path,
        blank=True, null=True,
        verbose_name='الشعار',
        help_text='صورة صغيرة (يُفضّل PNG شفاف)',
    )

    stars = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        blank=True, null=True,
        verbose_name='عدد النجوم',
        help_text='للفنادق فقط — من 1 إلى 5',
    )

    description = models.TextField(
        blank=True,
        verbose_name='الوصف',
        help_text='نص يظهر أسفل الاسم في البطاقة',
    )

    location = models.CharField(
        max_length=100,
        blank=True,
        verbose_name='الموقع',
        help_text='للفنادق — مثال: Kuala Lumpur',
    )

    # ═══════ الـ media (صورة أو فيديو لكل من البطاقة والخلفية) ═══════

    card_image = models.ImageField(
        upload_to=hero_hotel_card_image_path,
        blank=True, null=True,
        verbose_name='صورة البطاقة',
        help_text='يُفضّل 800×600 أو أعلى — استعمل هذه أو فيديو البطاقة',
    )

    card_video = models.FileField(
        upload_to=hero_card_video_path,
        blank=True, null=True,
        validators=[FileExtensionValidator(VIDEO_EXTS)],
        verbose_name='فيديو البطاقة',
        help_text='mp4/webm/mov — يفضّل أقل من 10MB، autoplay صامت',
    )

    hero_image = models.ImageField(
        upload_to=hero_hotel_hero_image_path,
        blank=True, null=True,
        verbose_name='صورة الخلفية',
        help_text='يُفضّل 1920×1080 أو أعلى',
    )

    hero_video = models.FileField(
        upload_to=hero_bg_video_path,
        blank=True, null=True,
        validators=[FileExtensionValidator(VIDEO_EXTS)],
        verbose_name='فيديو الخلفية',
        help_text='mp4/webm/mov — autoplay صامت',
    )

    # ═══════ CTA اختياري ═══════

    link_url = models.URLField(
        blank=True,
        verbose_name='رابط الزر',
        help_text='https://...',
    )

    cta_text = models.CharField(
        max_length=40,
        blank=True,
        verbose_name='نص الزر',
        help_text='مثال: "احجز الآن"، "تواصل معنا"',
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
        loc = f' ({self.location})' if self.location else ''
        return f'[{self.card_type}] {self.name}{loc} — #{self.display_order}'

    def clean(self):
        super().clean()
        if not (self.card_image or self.card_video):
            raise ValidationError({'card_image': 'يجب توفير صورة بطاقة أو فيديو بطاقة.'})
        if not (self.hero_image or self.hero_video):
            raise ValidationError({'hero_image': 'يجب توفير صورة خلفية أو فيديو خلفية.'})
        if self.card_type == 'hotel':
            if not self.stars:
                raise ValidationError({'stars': 'الفنادق يجب أن يكون لها عدد نجوم.'})
            if not self.location:
                raise ValidationError({'location': 'الفنادق يجب أن يكون لها موقع.'})
