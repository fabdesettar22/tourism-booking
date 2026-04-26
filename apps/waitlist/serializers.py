# apps/waitlist/serializers.py

from rest_framework import serializers
from .models import (
    PropertyWaitlist, TransportWaitlist, RestaurantWaitlist,
    GuideWaitlist, ActivityWaitlist, WellnessWaitlist, OtherServiceWaitlist,
)


# ── Base Serializer ────────────────────────────────────────

class WaitlistBaseSerializer(serializers.ModelSerializer):
    """
    Serializer أساسي مشترك بين كل أنواع الـ Waitlist.

    ملاحظة معمارية:
    - supplier_type حقل مطلوب في DB (لا default)
    - لكن Frontend لا يرسله — View هي المسؤولة عن ضبطه
    - لذلك نجعله اختيارياً في Serializer (extra_kwargs)
    - النتيجة: View يحدّد القيمة الصحيحة، Frontend لا يستطيع التلاعب
    """

    class Meta:
        read_only_fields = ('id', 'ref_number', 'status', 'email_sent', 'created_at', 'updated_at')
        extra_kwargs = {
            'supplier_type': {'required': False},  # View تضبطها قبل الـ serializer
        }

    def validate_email(self, value):
        return value.lower().strip()

    def validate_phone(self, value):
        phone = value.strip().replace(' ', '')
        if len(phone) < 8:
            raise serializers.ValidationError('رقم الهاتف قصير جداً.')
        return phone


# ── Property Serializer ────────────────────────────────────

class PropertyWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = PropertyWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            # مشتركة
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            # خاصة
            'property_type', 'rooms_count', 'star_rating', 'listed_online',
            'extra_data',
            # وثائق
            'property_photo', 'license_doc',
            # readonly
            'status', 'email_sent', 'created_at',
        ]

    def validate_star_rating(self, value):
        if value is not None and value not in range(1, 6):
            raise serializers.ValidationError('التصنيف يجب أن يكون بين 1 و 5.')
        return value


# ── Transport Serializer ───────────────────────────────────

class TransportWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = TransportWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            'transport_type', 'vehicles_count', 'has_license',
            'extra_data',
            'vehicle_license', 'tourism_license',
            'status', 'email_sent', 'created_at',
        ]


# ── Restaurant Serializer ──────────────────────────────────

class RestaurantWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = RestaurantWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            'restaurant_type', 'capacity', 'is_halal',
            'extra_data',
            'restaurant_license', 'halal_certificate',
            'status', 'email_sent', 'created_at',
        ]


# ── Guide Serializer ───────────────────────────────────────

class GuideWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = GuideWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            'specialties', 'languages', 'experience_years',
            'regions_covered', 'has_license', 'accepts_groups',
            'id_document', 'guide_license',
            'status', 'email_sent', 'created_at',
        ]

    def validate_specialties(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError('يجب اختيار تخصص واحد على الأقل.')
        return value

    def validate_languages(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError('يجب اختيار لغة واحدة على الأقل.')
        return value


# ── Activity Serializer ────────────────────────────────────

class ActivityWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = ActivityWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            'activity_types', 'capacity', 'suitable_kids',
            'suitable_elderly', 'has_insurance', 'has_license',
            'activity_license', 'insurance_doc',
            'status', 'email_sent', 'created_at',
        ]

    def validate_activity_types(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError('يجب اختيار نشاط واحد على الأقل.')
        return value


# ── Wellness Serializer ────────────────────────────────────

class WellnessWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = WellnessWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            'wellness_types', 'capacity', 'is_independent',
            'gender_policy', 'is_halal_certified', 'has_license',
            'wellness_license', 'staff_certificates',
            'status', 'email_sent', 'created_at',
        ]

    def validate_wellness_types(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError('يجب اختيار نوع خدمة واحد على الأقل.')
        return value


# ── Other Service Serializer ───────────────────────────────

class OtherServiceWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = OtherServiceWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            'service_types', 'service_description', 'target_audience', 'has_license',
            'id_document', 'service_proof',
            'status', 'email_sent', 'created_at',
        ]

    def validate_service_types(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError('يجب اختيار نوع خدمة واحد على الأقل.')
        return value
