# apps/accounts/serializers/agency_serializers.py

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.core.validators import URLValidator, FileExtensionValidator
from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import Agency, AgencyActivationToken

User = get_user_model()


# ═══════════════════════════════════════════════════════════
# CONSTANTS — حدود الملفات المرفوعة
# ═══════════════════════════════════════════════════════════

MAX_DOC_SIZE_MB  = 5           # كل وثيقة حد أقصى 5 ميجا
MAX_LOGO_SIZE_MB = 2           # الشعار حد أقصى 2 ميجا

DOC_EXTENSIONS   = ['pdf', 'jpg', 'jpeg', 'png']
IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp']


def _validate_file_size(f, max_mb: int, field_label: str):
    """Helper: يتحقق من حجم الملف."""
    if f and f.size > max_mb * 1024 * 1024:
        raise serializers.ValidationError(
            f"حجم {field_label} يجب أن لا يتجاوز {max_mb} ميجابايت."
        )


# ═══════════════════════════════════════════════════════════
# AGENCY REGISTRATION — Serializer التسجيل
# ═══════════════════════════════════════════════════════════

class AgencyRegisterSerializer(serializers.Serializer):
    """
    Serializer تسجيل وكالة جديدة.

    ⚠️ لا يقبل: password, commission_rate, status, is_active
        - password → تضعه الوكالة عند التفعيل (بعد الموافقة)
        - commission_rate → HQ يضبطه عند الموافقة
        - status → يبدأ 'pending' دائماً
        - is_active → False حتى التفعيل
    """

    # ── معلومات أساسية (مطلوبة) ──────────────────────────
    name = serializers.CharField(
        max_length=200,
        error_messages={'required': 'اسم الوكالة مطلوب.'}
    )
    name_en = serializers.CharField(max_length=200, required=False, allow_blank=True)
    registration_number = serializers.CharField(
        max_length=100,
        error_messages={'required': 'رقم السجل التجاري مطلوب.'}
    )
    agency_type = serializers.ChoiceField(
        choices=Agency.AGENCY_TYPE_CHOICES,
        default='b2b'
    )

    # ── الموقع ───────────────────────────────────────────
    country = serializers.CharField(
        max_length=100,
        error_messages={'required': 'الدولة مطلوبة.'}
    )
    city = serializers.CharField(
        max_length=100,
        error_messages={'required': 'المدينة مطلوبة.'}
    )
    address = serializers.CharField(
        error_messages={'required': 'العنوان مطلوب.'}
    )

    # ── تواصل ────────────────────────────────────────────
    email = serializers.EmailField(
        error_messages={'required': 'البريد الإلكتروني مطلوب.'}
    )
    phone = serializers.CharField(
        max_length=20,
        error_messages={'required': 'رقم الهاتف مطلوب.'}
    )
    website = serializers.URLField(required=False, allow_blank=True)
    currency = serializers.ChoiceField(
        choices=Agency.CURRENCY_CHOICES,
        default='MYR',
        required=False,
    )

    # ── جهة الاتصال (مطلوبة) ─────────────────────────────
    contact_person_name = serializers.CharField(
        max_length=150,
        error_messages={'required': 'اسم المسؤول مطلوب.'}
    )
    contact_person_position = serializers.CharField(
        max_length=100,
        error_messages={'required': 'منصب المسؤول مطلوب.'}
    )
    contact_person_phone = serializers.CharField(
        max_length=20,
        error_messages={'required': 'هاتف المسؤول مطلوب.'}
    )

    # ── الوثائق (مطلوبة) ─────────────────────────────────
    trade_license = serializers.FileField(
        validators=[FileExtensionValidator(allowed_extensions=DOC_EXTENSIONS)],
        error_messages={'required': 'الرخصة التجارية مطلوبة.'}
    )
    tax_certificate = serializers.FileField(
        validators=[FileExtensionValidator(allowed_extensions=DOC_EXTENSIONS)],
        error_messages={'required': 'الشهادة الضريبية مطلوبة.'}
    )
    owner_id_document = serializers.FileField(
        validators=[FileExtensionValidator(allowed_extensions=DOC_EXTENSIONS)],
        error_messages={'required': 'هوية المالك مطلوبة.'}
    )

    # ── الشعار (اختياري) ─────────────────────────────────
    logo = serializers.ImageField(
        required=False, allow_null=True,
        validators=[FileExtensionValidator(allowed_extensions=IMAGE_EXTENSIONS)],
    )

    # ═══════════════════════════════════════════════════
    # VALIDATIONS
    # ═══════════════════════════════════════════════════

    def validate_email(self, value: str) -> str:
        """تتحقق من أن الإيميل غير مستخدم بوكالة أخرى."""
        value = value.lower().strip()
        if Agency.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError(
                "هذا البريد الإلكتروني مسجّل بالفعل لوكالة أخرى."
            )
        return value

    def validate_registration_number(self, value: str) -> str:
        """رقم السجل التجاري فريد."""
        value = value.strip()
        if Agency.objects.filter(registration_number__iexact=value).exists():
            raise serializers.ValidationError(
                "رقم السجل التجاري مسجّل بالفعل."
            )
        return value

    def validate_trade_license(self, f):
        _validate_file_size(f, MAX_DOC_SIZE_MB, "الرخصة التجارية")
        return f

    def validate_tax_certificate(self, f):
        _validate_file_size(f, MAX_DOC_SIZE_MB, "الشهادة الضريبية")
        return f

    def validate_owner_id_document(self, f):
        _validate_file_size(f, MAX_DOC_SIZE_MB, "هوية المالك")
        return f

    def validate_logo(self, f):
        if f:
            _validate_file_size(f, MAX_LOGO_SIZE_MB, "الشعار")
        return f

    # ═══════════════════════════════════════════════════
    # CREATE
    # ═══════════════════════════════════════════════════

    @transaction.atomic
    def create(self, validated_data: dict) -> Agency:
        """
        ينشئ Agency فقط (بدون User).
        User سيُنشأ لاحقاً عند الموافقة من HQ.
        """
        agency = Agency.objects.create(
            # معلومات أساسية
            name                = validated_data['name'],
            name_en             = validated_data.get('name_en', ''),
            registration_number = validated_data['registration_number'],
            agency_type         = validated_data.get('agency_type', 'b2b'),
            # الموقع
            country             = validated_data['country'],
            city                = validated_data['city'],
            address             = validated_data['address'],
            # تواصل
            email               = validated_data['email'],
            phone               = validated_data['phone'],
            website             = validated_data.get('website', ''),
            currency            = validated_data.get('currency', 'MYR'),
            # جهة الاتصال
            contact_person_name     = validated_data['contact_person_name'],
            contact_person_position = validated_data['contact_person_position'],
            contact_person_phone    = validated_data['contact_person_phone'],
            # الوثائق
            trade_license       = validated_data['trade_license'],
            tax_certificate     = validated_data['tax_certificate'],
            owner_id_document   = validated_data['owner_id_document'],
            logo                = validated_data.get('logo'),
            # الحالة (ثابتة — ليست من client)
            status              = 'pending',
            is_active           = False,
        )
        return agency


# ═══════════════════════════════════════════════════════════
# AGENCY RESPONSE — Serializer العرض بعد التسجيل
# ═══════════════════════════════════════════════════════════

class AgencyCreatedResponseSerializer(serializers.ModelSerializer):
    """Response بعد نجاح التسجيل (بدون حقول حساسة)."""

    class Meta:
        model  = Agency
        fields = [
            'id', 'name', 'name_en', 'email', 'status',
            'country', 'city', 'created_at',
        ]
        read_only_fields = fields


# ═══════════════════════════════════════════════════════════
# AGENCY ACTIVATION — Serializer تفعيل الحساب بعد الموافقة
# ═══════════════════════════════════════════════════════════

class AgencyActivationSerializer(serializers.Serializer):
    """
    يُستخدم عند ضغط الوكالة على activation link المُرسَل بالإيميل.
    تضع الوكالة username + password وتفعّل حسابها.
    """

    token            = serializers.CharField(max_length=64)
    username         = serializers.CharField(max_length=150, min_length=4)
    password         = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)

    def validate_username(self, value: str) -> str:
        value = value.strip().lower()
        if User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("اسم المستخدم مسجّل بالفعل.")
        return value

    def validate_password(self, value: str) -> str:
        validate_password(value)
        return value

    def validate(self, attrs: dict) -> dict:
        # تطابق كلمات السر
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'كلمتا المرور غير متطابقتين.'
            })

        # التحقق من الـ token
        try:
            token_obj = AgencyActivationToken.objects.select_related('agency').get(
                token=attrs['token']
            )
        except AgencyActivationToken.DoesNotExist:
            raise serializers.ValidationError({
                'token': 'رمز التفعيل غير صالح.'
            })

        if not token_obj.is_valid:
            raise serializers.ValidationError({
                'token': 'رمز التفعيل مُستخدم أو منتهي الصلاحية.'
            })

        if token_obj.agency.status != 'active':
            raise serializers.ValidationError({
                'token': 'الوكالة ليست في حالة "نشط". راجع HQ.'
            })

        attrs['token_obj'] = token_obj
        attrs['agency']    = token_obj.agency
        return attrs

    @transaction.atomic
    def save(self) -> User:
        """
        ينشئ User المرتبط بالوكالة ويُعلّم الـ token كمُستخدم.
        """
        from django.utils import timezone

        agency    = self.validated_data['agency']
        token_obj = self.validated_data['token_obj']

        user = User.objects.create_user(
            username   = self.validated_data['username'],
            email      = agency.email,
            password   = self.validated_data['password'],
            role       = 'agency',
            agency     = agency,
            is_active  = True,
            first_name = agency.contact_person_name.split()[0] if agency.contact_person_name else '',
            last_name  = ' '.join(agency.contact_person_name.split()[1:]) if agency.contact_person_name and len(agency.contact_person_name.split()) > 1 else '',
            phone      = agency.contact_person_phone or agency.phone,
        )

        token_obj.is_used = True
        token_obj.used_at = timezone.now()
        token_obj.save(update_fields=['is_used', 'used_at'])

        return user

# ═══════════════════════════════════════════════════════════
# AGENCY LIST — لعرض كل الوكالات في لوحة Admin
# ═══════════════════════════════════════════════════════════

class AgencyListSerializer(serializers.ModelSerializer):
    """
    Serializer لقائمة الوكالات في Admin Dashboard.
    يُرجع الحقول الأساسية اللازمة للعرض.
    """
    employees_count = serializers.SerializerMethodField()

    class Meta:
        model  = Agency
        fields = [
            'id', 'name', 'name_en', 'email', 'phone', 'address',
            'logo', 'commission_rate', 'currency',
            'status', 'is_active',
            'registration_number', 'agency_type',
            'country', 'city',
            'approved_at', 'created_at', 'updated_at',
            'rejection_reason',
            'employees_count',
        ]
        read_only_fields = ['id', 'status', 'approved_at', 'created_at', 'updated_at']

    def get_employees_count(self, obj) -> int:
        """عدد المستخدمين المرتبطين بالوكالة."""
        try:
            return obj.users.count() if hasattr(obj, 'users') else 0
        except Exception:
            return 0


# ═══════════════════════════════════════════════════════════
# AGENCY UPDATE — تعديل بيانات وكالة من Admin
# ═══════════════════════════════════════════════════════════

class AgencyUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer لتحديث بيانات وكالة (PATCH).
    لا يسمح بتعديل status أو is_active (لهما endpoints منفصلة).
    """
    class Meta:
        model  = Agency
        fields = [
            'name', 'name_en', 'email', 'phone', 'address',
            'commission_rate', 'currency',
            'registration_number', 'agency_type',
            'country', 'city',
        ]

    def validate_commission_rate(self, value):
        if value is not None and not (0 <= value <= 100):
            raise serializers.ValidationError(
                "نسبة العمولة يجب أن تكون بين 0 و 100."
            )
        return value

    def validate_email(self, value):
        if value:
            # تحقق أن الإيميل غير مستخدم من قِبَل وكالة أخرى
            qs = Agency.objects.filter(email=value)
            if self.instance:
                qs = qs.exclude(pk=self.instance.pk)
            if qs.exists():
                raise serializers.ValidationError(
                    "هذا البريد الإلكتروني مُستخدم من قِبَل وكالة أخرى."
                )
        return value
