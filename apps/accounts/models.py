# apps/accounts/models.py

from django.db import models
from django.contrib.auth.models import AbstractUser
from django.utils.crypto import get_random_string
from django.utils import timezone
import uuid


# ═══════════════════════════════════════════════════════════
# AGENCY — الوكالات الشريكة
# ═══════════════════════════════════════════════════════════

class Agency(models.Model):

    # ── Enums ─────────────────────────────────────────────
    CURRENCY_CHOICES = [
        ('MYR', 'Malaysian Ringgit'),
        ('USD', 'US Dollar'),
        ('EUR', 'Euro'),
        ('SAR', 'Saudi Riyal'),
        ('AED', 'UAE Dirham'),
        ('SGD', 'Singapore Dollar'),
    ]

    STATUS_CHOICES = [
        ('pending',   'معلق للمراجعة'),
        ('active',    'نشط'),
        ('rejected',  'مرفوض'),
        ('suspended', 'موقوف'),
    ]

    AGENCY_TYPE_CHOICES = [
        ('b2b',    'B2B — للوكالات فقط'),
        ('b2b2c',  'B2B2C — للوكالات والعملاء النهائيين'),
    ]

    # ── الحقول الأصلية (لا تُلمس) ─────────────────────────
    name             = models.CharField(max_length=200, verbose_name="اسم الوكالة")
    phone            = models.CharField(max_length=20, blank=True, verbose_name="الهاتف")
    email            = models.EmailField(blank=True, verbose_name="البريد الإلكتروني")
    address          = models.TextField(blank=True, verbose_name="العنوان")
    logo             = models.ImageField(
        upload_to='agencies/logos/', blank=True, null=True,
        verbose_name="الشعار"
    )
    commission_rate  = models.DecimalField(
        max_digits=5, decimal_places=2, default=10.00,
        verbose_name="نسبة العمولة (%)"
    )
    currency         = models.CharField(
        max_length=3, choices=CURRENCY_CHOICES, default='MYR',
        verbose_name="العملة الافتراضية"
    )
    status           = models.CharField(
        max_length=10, choices=STATUS_CHOICES, default='pending',
        db_index=True, verbose_name="حالة الوكالة"
    )
    is_active        = models.BooleanField(default=False, verbose_name="نشطة")
    rejection_reason = models.TextField(blank=True, verbose_name="سبب الرفض")
    approved_at      = models.DateTimeField(null=True, blank=True, verbose_name="تاريخ القبول")
    approved_by      = models.ForeignKey(
        'User', on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='approved_agencies',
        verbose_name="تمت الموافقة بواسطة"
    )
    created_at       = models.DateTimeField(auto_now_add=True)
    updated_at       = models.DateTimeField(auto_now=True)

    # ── الحقول الجديدة (كلها اختيارية لضمان migration آمن) ─
    name_en = models.CharField(
        max_length=200, blank=True,
        verbose_name="اسم الوكالة (إنجليزي)"
    )
    registration_number = models.CharField(
        max_length=100, blank=True,
        verbose_name="رقم السجل التجاري"
    )
    agency_type = models.CharField(
        max_length=10, choices=AGENCY_TYPE_CHOICES,
        default='b2b', verbose_name="نوع الوكالة"
    )
    country = models.CharField(max_length=100, blank=True, verbose_name="الدولة")
    city    = models.CharField(max_length=100, blank=True, verbose_name="المدينة")
    website = models.URLField(blank=True, verbose_name="الموقع الإلكتروني")

    # جهة الاتصال
    contact_person_name     = models.CharField(
        max_length=150, blank=True, verbose_name="اسم المسؤول"
    )
    contact_person_position = models.CharField(
        max_length=100, blank=True, verbose_name="منصب المسؤول"
    )
    contact_person_phone    = models.CharField(
        max_length=20, blank=True, verbose_name="هاتف المسؤول"
    )

    # الوثائق
    trade_license = models.FileField(
        upload_to='agencies/documents/trade/', blank=True, null=True,
        verbose_name="الرخصة التجارية"
    )
    tax_certificate = models.FileField(
        upload_to='agencies/documents/tax/', blank=True, null=True,
        verbose_name="الشهادة الضريبية"
    )
    owner_id_document = models.FileField(
        upload_to='agencies/documents/id/', blank=True, null=True,
        verbose_name="هوية المالك"
    )

    # ── Properties ────────────────────────────────────────
    @property
    def is_approved(self) -> bool:
        return self.status == 'active'

    @property
    def owner(self):
        """مالك الوكالة: أول مستخدم بدور agency مرتبط بها."""
        return self.employees.filter(role='agency').first()

    def __str__(self):
        return self.name

    class Meta:
        verbose_name        = "وكالة شريكة"
        verbose_name_plural = "الوكالات الشريكة"
        ordering            = ['-created_at']


# ═══════════════════════════════════════════════════════════
# USER — نظام المستخدمين
# ═══════════════════════════════════════════════════════════

class User(AbstractUser):

    # تعديل verbose_name للحقول الموروثة من AbstractUser
    AbstractUser._meta.get_field('username').verbose_name = 'اسم المستخدم'
    AbstractUser._meta.get_field('first_name').verbose_name = 'الاسم الأول'
    AbstractUser._meta.get_field('last_name').verbose_name = 'الاسم الأخير'
    AbstractUser._meta.get_field('email').verbose_name = 'البريد الإلكتروني'
    AbstractUser._meta.get_field('is_active').verbose_name = 'نشط'
    AbstractUser._meta.get_field('is_staff').verbose_name = 'موظف'
    AbstractUser._meta.get_field('is_superuser').verbose_name = 'مدير عام'
    AbstractUser._meta.get_field('date_joined').verbose_name = 'تاريخ الانضمام'
    AbstractUser._meta.get_field('last_login').verbose_name = 'آخر دخول'
    AbstractUser._meta.get_field('password').verbose_name = 'كلمة المرور'
    AbstractUser._meta.get_field('groups').verbose_name = 'المجموعات'
    AbstractUser._meta.get_field('user_permissions').verbose_name = 'صلاحيات المستخدم'

    ROLE_CHOICES = [
        ('super_admin', 'مدير عام'),
        ('admin',       'مشرف'),
        ('agency',      'وكالة شريكة'),
        ('supplier',    'مورد'),
        ('tourist',     'سائح'),
    ]

    role   = models.CharField(
        max_length=20, choices=ROLE_CHOICES,
        default='tourist', verbose_name="الدور"
    )
    agency = models.ForeignKey(
        Agency, on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='employees',
        verbose_name="الوكالة الشريكة"
    )
    phone  = models.CharField(max_length=20, blank=True, verbose_name="الهاتف")
    avatar = models.ImageField(
        upload_to='avatars/', blank=True, null=True,
        verbose_name="الصورة الشخصية"
    )

    @property
    def is_admin(self) -> bool:
        return self.role in ('super_admin', 'admin') or self.is_superuser

    @property
    def is_agency_user(self) -> bool:
        return self.role == 'agency'

    @property
    def is_supplier_user(self) -> bool:
        return self.role == 'supplier'

    @property
    def is_tourist(self) -> bool:
        return self.role == 'tourist'

    @property
    def is_approved(self) -> bool:
        """للوكالة: هل الوكالة معتمدة؟"""
        if self.agency:
            return self.agency.is_approved
        return True  # Admin/Tourist/Supplier دائماً approved على مستوى User

    @property
    def display_role(self) -> str:
        return dict(self.ROLE_CHOICES).get(self.role, self.role)

    def __str__(self):
        return f"{self.username} ({self.display_role})"

    class Meta:
        verbose_name        = "مستخدم"
        verbose_name_plural = "المستخدمون"
        ordering            = ['-date_joined']


# ═══════════════════════════════════════════════════════════
# ACTIVATION TOKEN — رمز تفعيل حساب الوكالة بعد الموافقة
# ═══════════════════════════════════════════════════════════

class AgencyActivationToken(models.Model):
    """
    Token يُنشأ عند موافقة HQ على الوكالة.
    يُرسَل بالإيميل للوكالة — عند الضغط عليه تضع username + password
    لتفعيل حسابها وتسجيل الدخول.
    """

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    agency = models.OneToOneField(
        Agency,
        on_delete=models.CASCADE,
        related_name='activation_token',
        verbose_name="الوكالة"
    )
    token = models.CharField(
        max_length=64, unique=True, db_index=True,
        verbose_name="رمز التفعيل"
    )
    is_used    = models.BooleanField(default=False, verbose_name="مُستخدم")
    used_at    = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(verbose_name="تاريخ الانتهاء")
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.token:
            self.token = get_random_string(64)
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(days=7)
        super().save(*args, **kwargs)

    @property
    def is_valid(self) -> bool:
        return (not self.is_used) and (timezone.now() < self.expires_at)

    def __str__(self):
        return f"Token for {self.agency.name}"

    class Meta:
        verbose_name        = "رمز تفعيل وكالة"
        verbose_name_plural = "رموز تفعيل الوكالات"


# ═══════════════════════════════════════════════════════════
# EmailOTP — رمز دخول لمرة واحدة عبر الإيميل (للموردين)
# ═══════════════════════════════════════════════════════════

class EmailOTP(models.Model):
    """
    رمز دخول لمرة واحدة يُرسَل إلى إيميل المورد.
    صالح 10 دقائق، يُستخدَم مرة واحدة فقط.
    """
    email      = models.EmailField(db_index=True, verbose_name="البريد الإلكتروني")
    code       = models.CharField(max_length=6, verbose_name="الرمز")
    expires_at = models.DateTimeField(db_index=True, verbose_name="تاريخ الانتهاء")
    used       = models.BooleanField(default=False, verbose_name="مُستخدم")
    used_at    = models.DateTimeField(null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    def save(self, *args, **kwargs):
        if not self.code:
            self.code = get_random_string(6, allowed_chars='0123456789')
        if not self.expires_at:
            self.expires_at = timezone.now() + timezone.timedelta(minutes=10)
        super().save(*args, **kwargs)

    @property
    def is_valid(self) -> bool:
        return (not self.used) and (timezone.now() < self.expires_at)

    def mark_used(self):
        self.used = True
        self.used_at = timezone.now()
        self.save(update_fields=['used', 'used_at'])

    def __str__(self):
        return f"OTP for {self.email} ({'used' if self.used else 'valid'})"

    class Meta:
        verbose_name        = "رمز دخول OTP"
        verbose_name_plural = "رموز الدخول OTP"
        ordering            = ['-created_at']
        indexes = [
            models.Index(fields=['email', '-created_at']),
        ]