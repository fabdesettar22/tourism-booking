# apps/accounts/serializers/auth_serializers.py

import uuid
from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from django.db.models import Q
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from apps.accounts.tokens import CustomRefreshToken, _build_claims
from apps.suppliers.models import Supplier, HotelSupplier, SupplierType


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """يصدر Access + Refresh مع الـ claims المخصصة (user_id, tenant_id, tenant_type, role, email)."""

    @classmethod
    def get_token(cls, user):
        token = CustomRefreshToken.for_user(user)
        # SimpleJWT يضيف user_id من USER_ID_CLAIM تلقائياً، لكننا نضمن البقية:
        for k, v in _build_claims(user).items():
            token[k] = v
        return token

User = get_user_model()


# ─────────────────────────────────────────────
# STEP 1 — إنشاء حساب المورد
# ─────────────────────────────────────────────

class SupplierStep1Serializer(serializers.Serializer):
    """
    الخطوة الأولى: بيانات الحساب الأساسية.
    تُنشئ User + Supplier بحالة PENDING.
    """
    email            = serializers.EmailField()
    username         = serializers.CharField(max_length=150)
    password         = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)
    supplier_type    = serializers.ChoiceField(choices=SupplierType.choices)
    company_name     = serializers.CharField(max_length=255)
    phone            = serializers.CharField(max_length=30)
    country          = serializers.CharField(max_length=100)
    city             = serializers.CharField(max_length=100)

    def validate_email(self, value):
        from apps.accounts.email_validation import assert_email_unique
        return assert_email_unique(value)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("اسم المستخدم مأخوذ، اختر اسماً آخر.")
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        if data['password'] != data['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'كلمتا السر غير متطابقتين.'
            })
        return data

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        supplier_type = validated_data.pop('supplier_type')
        company_name  = validated_data.pop('company_name')
        phone         = validated_data.pop('phone')
        country       = validated_data.pop('country')
        city          = validated_data.pop('city')
        password      = validated_data.pop('password')

        # إنشاء المستخدم
        user = User.objects.create_user(
            email     = validated_data['email'],
            username  = validated_data['username'],
            password  = password,
            role      = 'supplier',
            is_active = False,  # غير مفعّل حتى تأكيد الإيميل
        )

        # إنشاء بروفايل المورد
        supplier = Supplier.objects.create(
            user          = user,
            supplier_type = supplier_type,
            company_name  = company_name,
            phone         = phone,
            country       = country,
            city          = city,
            email         = user.email,
            status        = 'PENDING',
        )

        return user, supplier


# ─────────────────────────────────────────────
# STEP 2 — بيانات الفندق التفصيلية
# ─────────────────────────────────────────────

class HotelSupplierStep2Serializer(serializers.ModelSerializer):
    """الخطوة الثانية: تفاصيل الفندق."""
    class Meta:
        model  = HotelSupplier
        fields = [
            'hotel_name', 'star_rating', 'country', 'city',
            'address', 'latitude', 'longitude',
            'description', 'check_in_time', 'check_out_time',
            'cancellation_policy',
        ]

    def validate_star_rating(self, value):
        if value and value not in range(1, 6):
            raise serializers.ValidationError("التصنيف يجب أن يكون بين 1 و 5 نجوم.")
        return value


# ─────────────────────────────────────────────
# STEP 3 — المرافق والصور
# ─────────────────────────────────────────────

class HotelSupplierStep3Serializer(serializers.ModelSerializer):
    """الخطوة الثالثة: المرافق والصور."""
    class Meta:
        model  = HotelSupplier
        fields = ['amenities', 'images']

    def validate_images(self, value):
        if not value or len(value) < 1:
            raise serializers.ValidationError("يجب رفع صورة واحدة على الأقل.")
        if len(value) > 20:
            raise serializers.ValidationError("الحد الأقصى 20 صورة.")
        return value


# ─────────────────────────────────────────────
# STEP 4 — الوثائق والإرسال للمراجعة
# ─────────────────────────────────────────────

class SupplierStep4Serializer(serializers.ModelSerializer):
    """الخطوة الرابعة: رفع الوثائق وإرسال الطلب."""
    class Meta:
        model  = Supplier
        fields = ['trade_license', 'contract_document']


# ═══════════════════════════════════════════════════════════
# LOGIN — 🆕 محدّث: يقبل email أو username
# ═══════════════════════════════════════════════════════════

class LoginSerializer(serializers.Serializer):
    """
    يقبل تسجيل الدخول بـ email أو username.
    
    الأمثلة المقبولة:
      1. {"email": "admin@mybridge.my", "password": "..."}
      2. {"username": "admin",          "password": "..."}
      3. {"email": "admin",             "password": "..."}   # يعامل كـ username
    
    هذا يسمح لـ:
      - Admins بالدخول بـ username
      - Agencies بالدخول بـ email (الأكثر شيوعاً)
      - Suppliers بالدخول بـ email
    """
    # كلاهما اختياري، لكن واحد منهما مطلوب
    email    = serializers.CharField(required=False, allow_blank=True)
    username = serializers.CharField(required=False, allow_blank=True)
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # استخراج identifier (email أو username)
        identifier = (data.get('email') or data.get('username') or '').strip()
        password   = data.get('password', '')

        # ── تحقق: حقل واحد على الأقل ────────────────
        if not identifier:
            raise serializers.ValidationError({
                'identifier': 'يرجى إدخال البريد الإلكتروني أو اسم المستخدم.'
            })
        
        if not password:
            raise serializers.ValidationError({
                'password': 'كلمة المرور مطلوبة.'
            })

        # ── البحث عن User بـ email أو username ──────
        # نستخدم Q لبحث مرن
        user = User.objects.filter(
            Q(email__iexact=identifier) | Q(username__iexact=identifier)
        ).first()

        if not user:
            # رسالة موحدة (لا نكشف إن كان الحساب موجوداً)
            raise serializers.ValidationError(
                "البريد الإلكتروني / اسم المستخدم أو كلمة السر غير صحيحة."
            )

        # ── تحقق من كلمة المرور ─────────────────────
        if not user.check_password(password):
            raise serializers.ValidationError(
                "البريد الإلكتروني / اسم المستخدم أو كلمة السر غير صحيحة."
            )

        # ── تحقق من تفعيل الحساب ────────────────────
        if not user.is_active:
            raise serializers.ValidationError(
                "الحساب غير مفعّل. يرجى تأكيد بريدك الإلكتروني أو التواصل مع الدعم."
            )

        data['user'] = user
        return data


# ─────────────────────────────────────────────
# ME (بيانات المستخدم الحالي)
# ─────────────────────────────────────────────

class UserMeSerializer(serializers.ModelSerializer):
    """
    Serializer لبيانات المستخدم الحالي (GET /api/v1/accounts/me/).
    يُرجع كل الحقول التي تحتاجها واجهة Frontend (AuthUser interface).
    """
    # Supplier fields
    supplier_status = serializers.SerializerMethodField()
    supplier_type   = serializers.SerializerMethodField()

    # Agency fields
    agency          = serializers.SerializerMethodField()
    agency_name     = serializers.SerializerMethodField()
    agency_logo     = serializers.SerializerMethodField()
    agency_currency = serializers.SerializerMethodField()

    # User extras
    avatar          = serializers.SerializerMethodField()
    is_admin        = serializers.SerializerMethodField()
    is_approved     = serializers.SerializerMethodField()

    class Meta:
        model  = User
        fields = [
            'id', 'email', 'username', 'role',
            'first_name', 'last_name', 'phone',
            'is_active',
            'supplier_status', 'supplier_type',
            'agency', 'agency_name', 'agency_logo', 'agency_currency',
            'avatar',
            'is_admin', 'is_approved',
            'date_joined',
        ]

    # ─── Supplier ────────────────────────────────────
    def get_supplier_status(self, obj):
        try:
            return obj.supplier_profile.status
        except Exception:
            return None

    def get_supplier_type(self, obj):
        try:
            return obj.supplier_profile.supplier_type
        except Exception:
            return None

    # ─── Agency ──────────────────────────────────────
    def get_agency(self, obj):
        """Agency UUID كـ string (أو None)."""
        try:
            return str(obj.agency_id) if obj.agency_id else None
        except Exception:
            return None

    def get_agency_name(self, obj):
        try:
            return obj.agency.name if obj.agency else None
        except Exception:
            return None

    def get_agency_logo(self, obj):
        """URL كامل للـ logo (أو None)."""
        try:
            if obj.agency and obj.agency.logo:
                request = self.context.get('request')
                url = obj.agency.logo.url
                return request.build_absolute_uri(url) if request else url
            return None
        except Exception:
            return None

    def get_agency_currency(self, obj):
        """عملة الوكالة (افتراضي: MYR)."""
        try:
            return obj.agency.currency if obj.agency else 'MYR'
        except Exception:
            return 'MYR'

    # ─── User extras ─────────────────────────────────
    def get_avatar(self, obj):
        """URL كامل للـ avatar (أو None)."""
        try:
            if obj.avatar:
                request = self.context.get('request')
                url = obj.avatar.url
                return request.build_absolute_uri(url) if request else url
            return None
        except Exception:
            return None

    def get_is_admin(self, obj):
        """True إن كان super_admin أو admin."""
        return obj.role in ('super_admin', 'admin')

    def get_is_approved(self, obj):
        """
        للوكالات: وكالتهم موافَق عليها.
        للمشرفين: دائماً True.
        للموردين: حسب حالة supplier_profile.
        لغيرهم: True افتراضياً.
        """
        try:
            # يستخدم property المُعرَّف في User model
            return obj.is_approved
        except Exception:
            return True

    def get_agency_id(self, obj):
        try:
            return str(obj.agency_id) if obj.agency_id else None
        except Exception:
            return None


# ─────────────────────────────────────────────
# ADMIN SERIALIZERS
# ─────────────────────────────────────────────

class SupplierAdminSerializer(serializers.ModelSerializer):
    """للمسؤول — بيانات كاملة عن المورد."""
    user_email    = serializers.CharField(source='user.email',     read_only=True)
    user_username = serializers.CharField(source='user.username',  read_only=True)
    user_active   = serializers.BooleanField(source='user.is_active', read_only=True)
    supplier_type_display = serializers.CharField(
        source='get_supplier_type_display', read_only=True
    )
    status_display = serializers.CharField(
        source='get_status_display', read_only=True
    )

    class Meta:
        model  = Supplier
        fields = [
            'id', 'company_name', 'supplier_type', 'supplier_type_display',
            'status', 'status_display', 'country', 'city',
            'phone', 'email', 'trade_license', 'contract_document',
            'user_email', 'user_username', 'user_active',
            'rejection_reason', 'approved_at', 'created_at',
        ]
