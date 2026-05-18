# apps/waitlist_agency/serializers.py

from django.contrib.auth import get_user_model
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from .models import AgencyWaitlist

User = get_user_model()


class AgencyWaitlistSerializer(serializers.ModelSerializer):
    """
    Serializer لقائمة انتظار الوكالات.

    - يقبل multipart/form-data (للملفات والنصوص معاً)
    - يقبل username/password لإنشاء حساب مستخدم فوري (غير مفعّل)
    - ref_number و status و email_sent تُحدَّد تلقائياً (read-only)
    """

    # ── بيانات الحساب (write-only — لا تُخزَّن في جدول الـ Waitlist) ──
    username  = serializers.CharField(max_length=150, write_only=True)
    password  = serializers.CharField(write_only=True, min_length=8, style={'input_type': 'password'})
    password2 = serializers.CharField(write_only=True, style={'input_type': 'password'})

    class Meta:
        model  = AgencyWaitlist
        fields = [
            'id', 'ref_number',
            # معلومات الوكالة
            'name', 'registration_number',
            'country', 'city', 'address', 'website',
            # التواصل
            'email', 'phone',
            # الشخص المسؤول
            'contact_person_name', 'contact_person_position', 'contact_person_phone',
            # الوثائق
            'trade_license', 'owner_id_document', 'logo',
            # مصدر التسجيل
            'how_did_you_hear',
            # UTM
            'utm_source', 'utm_medium', 'utm_campaign',
            # بيانات الحساب
            'username', 'password', 'password2',
            # readonly
            'status', 'email_sent', 'created_at',
        ]
        read_only_fields = (
            'id', 'ref_number', 'status', 'email_sent', 'created_at',
        )

    # ── Validators ───────────────────────────────────────

    def validate_username(self, value):
        value = value.strip()
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('اسم المستخدم مستخدم بالفعل.')
        return value

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, data):
        if data.get('password') != data.get('password2'):
            raise serializers.ValidationError({'password2': 'كلمتا المرور غير متطابقتين.'})
        return data

    def validate_email(self, value):
        """تطبيع البريد (lowercase + strip)."""
        return value.lower().strip()

    def validate_phone(self, value):
        """التحقق من طول الهاتف."""
        phone = value.strip().replace(' ', '')
        if len(phone) < 8:
            raise serializers.ValidationError('رقم الهاتف قصير جداً.')
        return phone

    def validate_contact_person_phone(self, value):
        """التحقق من طول هاتف المسؤول."""
        phone = value.strip().replace(' ', '')
        if len(phone) < 8:
            raise serializers.ValidationError('هاتف المسؤول قصير جداً.')
        return phone

    def validate_name(self, value):
        """التحقق من طول اسم الوكالة."""
        name = value.strip()
        if len(name) < 2:
            raise serializers.ValidationError('اسم الوكالة قصير جداً.')
        return name

    def validate_trade_license(self, value):
        """التحقق من حجم الرخصة التجارية (أقصى 5MB)."""
        MAX_SIZE = 5 * 1024 * 1024  # 5MB
        if value and value.size > MAX_SIZE:
            raise serializers.ValidationError('حجم الرخصة التجارية يتجاوز 5 ميجابايت.')
        return value

    def validate_owner_id_document(self, value):
        """التحقق من حجم هوية المالك (أقصى 5MB)."""
        MAX_SIZE = 5 * 1024 * 1024
        if value and value.size > MAX_SIZE:
            raise serializers.ValidationError('حجم هوية المالك يتجاوز 5 ميجابايت.')
        return value

    def validate_logo(self, value):
        """التحقق من حجم الشعار (أقصى 2MB)."""
        MAX_SIZE = 2 * 1024 * 1024
        if value and value.size > MAX_SIZE:
            raise serializers.ValidationError('حجم الشعار يتجاوز 2 ميجابايت.')
        return value

    def create(self, validated_data):
        # نزيل حقول الحساب قبل إنشاء سجل الـ Waitlist
        validated_data.pop('username', None)
        validated_data.pop('password', None)
        validated_data.pop('password2', None)
        return super().create(validated_data)
