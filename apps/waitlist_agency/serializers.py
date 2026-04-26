# apps/waitlist_agency/serializers.py

from rest_framework import serializers
from .models import AgencyWaitlist


class AgencyWaitlistSerializer(serializers.ModelSerializer):
    """
    Serializer لقائمة انتظار الوكالات.

    - يقبل multipart/form-data (للملفات والنصوص معاً)
    - يتحقق من صحة البريد والهاتف
    - ref_number و status و email_sent تُحدَّد تلقائياً (read-only)
    """

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
            # readonly
            'status', 'email_sent', 'created_at',
        ]
        read_only_fields = (
            'id', 'ref_number', 'status', 'email_sent', 'created_at',
        )

    # ── Validators ───────────────────────────────────────

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
