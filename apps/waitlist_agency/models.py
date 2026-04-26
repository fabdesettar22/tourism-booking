# apps/waitlist_agency/models.py

import uuid
from django.db import models


# ── Choices ───────────────────────────────────────────────

class HowDidYouHear(models.TextChoices):
    SOCIAL_MEDIA = 'SOCIAL_MEDIA', 'وسائل التواصل الاجتماعي'
    REFERRAL     = 'REFERRAL',     'توصية من شخص'
    GOOGLE       = 'GOOGLE',       'بحث على Google'
    EVENT        = 'EVENT',        'معرض أو فعالية'
    OTHER        = 'OTHER',        'أخرى'


class WaitlistStatus(models.TextChoices):
    PENDING     = 'PENDING',     'في الانتظار'
    CONTACTED   = 'CONTACTED',   'تم التواصل'
    APPROVED    = 'APPROVED',    'موافَق عليه'
    REJECTED    = 'REJECTED',    'مرفوض'


# ── Upload Paths (UUID-based للأمان والتفرد) ──────────────

def trade_license_path(instance, filename):
    ext = filename.split('.')[-1].lower() if '.' in filename else 'pdf'
    return f'waitlist_agency/trade_licenses/{instance.id}.{ext}'


def owner_id_path(instance, filename):
    ext = filename.split('.')[-1].lower() if '.' in filename else 'pdf'
    return f'waitlist_agency/owner_ids/{instance.id}.{ext}'


def logo_path(instance, filename):
    ext = filename.split('.')[-1].lower() if '.' in filename else 'png'
    return f'waitlist_agency/logos/{instance.id}.{ext}'


# ── Main Model ─────────────────────────────────────────────

class AgencyWaitlist(models.Model):
    """
    قائمة انتظار الوكالات الشريكة — نظام تمهيدي لجمع اهتمام الوكالات
    قبل الإطلاق الفعلي للمنصة.
    """

    # ── معرّفات ──────────────────────────────────────────
    id         = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ref_number = models.CharField(max_length=20, unique=True, editable=False)

    # ── معلومات الوكالة ──────────────────────────────────
    name                = models.CharField(max_length=200, verbose_name='اسم الوكالة')
    registration_number = models.CharField(max_length=100, verbose_name='رقم السجل التجاري')
    country             = models.CharField(max_length=100, default='Malaysia', verbose_name='الدولة')
    city                = models.CharField(max_length=100, verbose_name='المدينة')
    address             = models.TextField(verbose_name='العنوان الكامل')
    website             = models.URLField(blank=True, verbose_name='الموقع الإلكتروني')

    # ── التواصل ──────────────────────────────────────────
    email = models.EmailField(verbose_name='البريد الإلكتروني')
    phone = models.CharField(max_length=30, verbose_name='هاتف الوكالة')

    # ── الشخص المسؤول ────────────────────────────────────
    contact_person_name     = models.CharField(max_length=150, verbose_name='اسم المسؤول')
    contact_person_position = models.CharField(max_length=100, verbose_name='منصب المسؤول')
    contact_person_phone    = models.CharField(max_length=30, verbose_name='هاتف المسؤول')

    # ── الوثائق ──────────────────────────────────────────
    trade_license     = models.FileField(upload_to=trade_license_path, verbose_name='الرخصة التجارية')
    owner_id_document = models.FileField(upload_to=owner_id_path, verbose_name='هوية المالك')
    logo              = models.ImageField(upload_to=logo_path, blank=True, null=True, verbose_name='شعار الوكالة')

    # ── مصدر التسجيل ──────────────────────────────────────
    how_did_you_hear = models.CharField(
        max_length=20,
        choices=HowDidYouHear.choices,
        blank=True,
        verbose_name='كيف سمعت عنا؟'
    )

    # ── UTM Parameters ─────────────────────────────────────
    utm_source   = models.CharField(max_length=100, blank=True)
    utm_medium   = models.CharField(max_length=100, blank=True)
    utm_campaign = models.CharField(max_length=100, blank=True)

    # ── بيانات تلقائية ────────────────────────────────────
    ip_address   = models.GenericIPAddressField(null=True, blank=True)
    device_type  = models.CharField(max_length=20, blank=True)
    status       = models.CharField(
        max_length=20,
        choices=WaitlistStatus.choices,
        default=WaitlistStatus.PENDING,
        verbose_name='الحالة'
    )
    email_sent   = models.BooleanField(default=False, verbose_name='أُرسل إيميل التأكيد؟')
    notes        = models.TextField(blank=True, verbose_name='ملاحظات الإدارة')
    created_at   = models.DateTimeField(auto_now_add=True)
    updated_at   = models.DateTimeField(auto_now=True)

    class Meta:
        db_table            = 'waitlist_agency'
        verbose_name        = 'قائمة انتظار — وكالة'
        verbose_name_plural = 'قائمة انتظار — الوكالات'
        ordering            = ['-created_at']

    def save(self, *args, **kwargs):
        if not self.ref_number:
            import random
            import string
            suffix = ''.join(random.choices(string.digits, k=6))
            self.ref_number = f'MYB-AGY-{suffix}'
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.name} — {self.ref_number}'
