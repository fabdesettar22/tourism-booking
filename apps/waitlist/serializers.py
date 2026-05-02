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

    def validate_description(self, value):
        if not value or not value.strip():
            raise serializers.ValidationError('الوصف مطلوب.')
        return value.strip()

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
            'description',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            # 🆕 المراجع الصحيحة (من قائمة منسدلة)
            'country_ref', 'city_ref',
            # خاصة
            'property_type', 'rooms_count', 'star_rating', 'listed_online',
            'extra_data',
            # وثائق
            'property_photo', 'license_doc',
            # readonly
            'status', 'email_sent', 'created_at',
            # 🆕 الفندق المُنشأ تلقائياً (للقراءة فقط — يُملأ عند الموافقة)
            'created_hotel',
        ]
        read_only_fields = WaitlistBaseSerializer.Meta.read_only_fields + ('created_hotel',)

    def validate(self, attrs):
        """
        نتحقق أن المدينة المختارة تنتمي فعلاً للدولة المختارة.
        يحمي من التلاعب أو الخطأ في Frontend.
        """
        country_ref = attrs.get('country_ref')
        city_ref    = attrs.get('city_ref')

        if city_ref and country_ref:
            if city_ref.country_id != country_ref.id:
                raise serializers.ValidationError({
                    'city_ref': 'المدينة المختارة لا تنتمي للدولة المختارة.'
                })

        return super().validate(attrs) if hasattr(super(), 'validate') else attrs

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
            'description',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            # 🆕 مراجع الموقع
            'country_ref', 'city_ref',
            'transport_type', 'vehicles_count', 'has_license',
            # 🆕 الأسعار + العملة
            'price_airport_transfer', 'price_hourly', 'price_intercity', 'price_full_day',
            'currency',
            'extra_data',
            'vehicle_license', 'tourism_license',
            'status', 'email_sent', 'created_at',
            # 🆕 الخدمة المُنشأة (read-only)
            'created_service',
        ]
        read_only_fields = WaitlistBaseSerializer.Meta.read_only_fields + ('created_service',)

    def validate(self, attrs):
        country_ref = attrs.get('country_ref')
        city_ref    = attrs.get('city_ref')
        if city_ref and country_ref and city_ref.country_id != country_ref.id:
            raise serializers.ValidationError({
                'city_ref': 'المدينة المختارة لا تنتمي للدولة المختارة.'
            })
        return attrs


# ── Restaurant Serializer ──────────────────────────────────

class RestaurantWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = RestaurantWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'description',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            # 🆕 مراجع الموقع
            'country_ref', 'city_ref',
            'restaurant_type', 'capacity', 'is_halal',
            # 🆕 الأسعار + العملة
            'price_per_person', 'price_set_menu', 'currency',
            'extra_data',
            'restaurant_license', 'halal_certificate',
            'status', 'email_sent', 'created_at',
            # 🆕 الخدمة المُنشأة (read-only)
            'created_service',
        ]
        read_only_fields = WaitlistBaseSerializer.Meta.read_only_fields + ('created_service',)

    def validate(self, attrs):
        country_ref = attrs.get('country_ref')
        city_ref    = attrs.get('city_ref')
        if city_ref and country_ref and city_ref.country_id != country_ref.id:
            raise serializers.ValidationError({
                'city_ref': 'المدينة المختارة لا تنتمي للدولة المختارة.'
            })
        return attrs


# ── Guide Serializer ───────────────────────────────────────

class GuideWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = GuideWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'description',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            # 🆕 مراجع الموقع
            'country_ref', 'city_ref',
            'specialties', 'languages', 'experience_years',
            'regions_covered', 'has_license', 'accepts_groups',
            # 🆕 الأسعار + العملة
            'price_half_day', 'price_full_day', 'price_hourly', 'currency',
            'id_document', 'guide_license',
            'status', 'email_sent', 'created_at',
            # 🆕 الخدمة المُنشأة (read-only)
            'created_service',
        ]
        read_only_fields = WaitlistBaseSerializer.Meta.read_only_fields + ('created_service',)

    def validate_specialties(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError('يجب اختيار تخصص واحد على الأقل.')
        return value

    def validate(self, attrs):
        country_ref = attrs.get('country_ref')
        city_ref    = attrs.get('city_ref')
        if city_ref and country_ref and city_ref.country_id != country_ref.id:
            raise serializers.ValidationError({
                'city_ref': 'المدينة المختارة لا تنتمي للدولة المختارة.'
            })
        return attrs

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
            'description',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            # 🆕 مراجع الموقع
            'country_ref', 'city_ref',
            'activity_types', 'capacity', 'suitable_kids',
            'suitable_elderly', 'has_insurance', 'has_license',
            # 🆕 الأسعار + العملة
            'price_per_person', 'price_per_group', 'min_group_size', 'currency',
            'activity_license', 'insurance_doc',
            'status', 'email_sent', 'created_at',
            # 🆕 الخدمة المُنشأة (read-only)
            'created_service',
        ]
        read_only_fields = WaitlistBaseSerializer.Meta.read_only_fields + ('created_service',)

    def validate_activity_types(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError('يجب اختيار نشاط واحد على الأقل.')
        return value

    def validate(self, attrs):
        country_ref = attrs.get('country_ref')
        city_ref    = attrs.get('city_ref')
        if city_ref and country_ref and city_ref.country_id != country_ref.id:
            raise serializers.ValidationError({
                'city_ref': 'المدينة المختارة لا تنتمي للدولة المختارة.'
            })
        return attrs


# ── Wellness Serializer ────────────────────────────────────

class WellnessWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = WellnessWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'description',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            # 🆕 مراجع الموقع
            'country_ref', 'city_ref',
            'wellness_types', 'capacity', 'is_independent',
            'gender_policy', 'is_halal_certified', 'has_license',
            # 🆕 الأسعار + العملة
            'price_per_session', 'session_duration_min', 'price_package', 'currency',
            'wellness_license', 'staff_certificates',
            'status', 'email_sent', 'created_at',
            # 🆕 الخدمة المُنشأة (read-only)
            'created_service',
        ]
        read_only_fields = WaitlistBaseSerializer.Meta.read_only_fields + ('created_service',)

    def validate_wellness_types(self, value):
        if not value or len(value) == 0:
            raise serializers.ValidationError('يجب اختيار نوع خدمة واحد على الأقل.')
        return value

    def validate(self, attrs):
        country_ref = attrs.get('country_ref')
        city_ref    = attrs.get('city_ref')
        if city_ref and country_ref and city_ref.country_id != country_ref.id:
            raise serializers.ValidationError({
                'city_ref': 'المدينة المختارة لا تنتمي للدولة المختارة.'
            })
        return attrs


# ── Other Service Serializer ───────────────────────────────

class OtherServiceWaitlistSerializer(WaitlistBaseSerializer):

    class Meta(WaitlistBaseSerializer.Meta):
        model  = OtherServiceWaitlist
        fields = [
            'id', 'ref_number', 'supplier_type',
            'full_name', 'email', 'phone', 'company_name', 'country', 'country_code', 'city', 'region',
            'description',
            'sync_mode', 'channel_name',
            'worked_before', 'how_did_you_hear', 'how_did_you_hear_other',
            'utm_source', 'utm_medium', 'utm_campaign',
            # 🆕 مراجع الموقع
            'country_ref', 'city_ref',
            'service_types', 'service_description', 'target_audience', 'has_license',
            # 🆕 الأسعار + العملة
            'base_price', 'price_unit', 'pricing_notes', 'currency',
            # 🆕 فئة مقترحة + حقول مخصصة
            'proposed_category_name', 'custom_fields',
            'id_document', 'service_proof',
            'status', 'email_sent', 'created_at',
            # 🆕 الخدمة المُنشأة (read-only)
            'created_service',
        ]
        read_only_fields = WaitlistBaseSerializer.Meta.read_only_fields + ('created_service',)

    def validate_service_types(self, value):
        # يُسمح بقائمة فارغة إن قدّم المورد proposed_category_name (فئة مخصصة)
        if (not value or len(value) == 0) and not self.initial_data.get('proposed_category_name'):
            raise serializers.ValidationError(
                'يجب اختيار نوع خدمة واحد على الأقل أو تقديم اسم فئة مقترحة.'
            )
        return value

    def validate(self, attrs):
        country_ref = attrs.get('country_ref')
        city_ref    = attrs.get('city_ref')
        if city_ref and country_ref and city_ref.country_id != country_ref.id:
            raise serializers.ValidationError({
                'city_ref': 'المدينة المختارة لا تنتمي للدولة المختارة.'
            })
        return attrs

# ── WaitlistPhoto Serializer ───────────────────────────

class WaitlistPhotoSerializer(serializers.Serializer):
    """
    Serializer لرفع صورة واحدة مرتبطة بـ Waitlist.
    يُستخدم في POST /api/v1/waitlist/photos/upload/
    """
    # الصورة المرفوعة
    image          = serializers.ImageField()

    # نوع الـ Waitlist (مثلاً: propertywaitlist, transportwaitlist)
    content_type   = serializers.CharField(
        max_length=50,
        help_text='اسم نموذج الـ Waitlist بالحروف الصغيرة (مثلاً: propertywaitlist)',
    )

    # UUID الطلب
    object_id      = serializers.UUIDField()

    # معلومات الصورة
    is_primary     = serializers.BooleanField(default=False)
    order          = serializers.IntegerField(default=0, min_value=0)
    caption        = serializers.CharField(
        max_length=200, required=False, allow_blank=True, default=''
    )

    def validate_content_type(self, value):
        from django.contrib.contenttypes.models import ContentType
        try:
            ContentType.objects.get(app_label='waitlist', model=value.lower())
        except ContentType.DoesNotExist:
            raise serializers.ValidationError(
                f'نوع غير معروف: {value}. يجب أن يكون اسم model صحيح من app waitlist.'
            )
        return value.lower()

    def validate(self, attrs):
        """نتحقق أن object_id يخص سجلاً موجوداً فعلاً."""
        from django.contrib.contenttypes.models import ContentType
        ct = ContentType.objects.get(app_label='waitlist', model=attrs['content_type'])
        Model = ct.model_class()
        if not Model.objects.filter(pk=attrs['object_id']).exists():
            raise serializers.ValidationError({
                'object_id': 'لا يوجد طلب بهذا الـ ID.'
            })
        return attrs


class WaitlistPhotoReadSerializer(serializers.ModelSerializer):
    """للقراءة: يُرجع بيانات الصورة كاملة."""
    url = serializers.SerializerMethodField()

    class Meta:
        from apps.waitlist.models import WaitlistPhoto
        model  = WaitlistPhoto
        fields = ['id', 'image', 'url', 'is_primary', 'order', 'caption', 'uploaded_at']

    def get_url(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return None
