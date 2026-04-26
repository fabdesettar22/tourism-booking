# apps/suppliers/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import (
    Supplier, SupplierStatus, ContentStatus,
    HotelSupplier, HotelRoomType, HotelAmenity,
    HotelPropertyAmenity, HotelPricePlan,
    PropertyImage, RoomOccupancyPrice,
    SupplierWaitlist,
    RoomTypeSupplier, RoomRateSupplier,
    TourSupplier, TourRateSupplier,
    TransferRouteSupplier, TransferRateSupplier,
    FlightRouteSupplier, FlightRateSupplier,
)


# ═══════════════════════════════════════════════════════
# SUPPLIER
# ═══════════════════════════════════════════════════════

class SupplierSerializer(serializers.ModelSerializer):
    supplier_type_display = serializers.CharField(source='get_supplier_type_display', read_only=True)
    status_display        = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model  = Supplier
        fields = [
            'id', 'supplier_type', 'supplier_type_display',
            'status', 'status_display', 'is_trusted',
            'company_name', 'company_name_en', 'registration_number',
            'country', 'city', 'address', 'phone', 'email', 'website',
            'default_currency', 'trade_license', 'contract_document',
            'approved_at', 'rejection_reason', 'created_at', 'updated_at',
        ]
        read_only_fields = [
            'id', 'status', 'is_trusted', 'approved_at',
            'rejection_reason', 'created_at', 'updated_at',
        ]


# ═══════════════════════════════════════════════════════
# HOTEL ONBOARDING — خطوة بخطوة
# ═══════════════════════════════════════════════════════

class HotelStep0Serializer(serializers.Serializer):
    """
    Step 0 — نوع العقار وعدد الفنادق.
    GET  /api/v1/suppliers/hotel/onboarding/status/
    POST /api/v1/suppliers/hotel/onboarding/step0/
    """
    hotel_type   = serializers.ChoiceField(choices=HotelSupplier.hotel_type.field.choices)
    hotels_count = serializers.ChoiceField(choices=HotelSupplier.hotels_count.field.choices)
    listed_on    = serializers.ListField(
        child=serializers.CharField(), required=False, default=list,
        help_text="['airbnb','agoda','vrbo','tripadvisor','other','none']"
    )


class HotelStep1Serializer(serializers.ModelSerializer):
    """
    Step 1 — تفاصيل الفندق: الاسم، النجوم، السلسلة، الموقع، Channel Manager.
    POST /api/v1/suppliers/hotel/onboarding/step1/
    """
    class Meta:
        model  = HotelSupplier
        fields = [
            'hotel_name', 'star_rating',
            'is_chain', 'chain_name',
            'address', 'address_unit',
            'country', 'city', 'postal_code',
            'latitude', 'longitude',
            'has_channel_manager', 'channel_manager_name',
        ]

    def validate(self, data):
        if data.get('is_chain') and not data.get('chain_name', '').strip():
            raise serializers.ValidationError({
                'chain_name': 'اسم السلسلة مطلوب عند تفعيل خيار السلسلة الفندقية.'
            })
        return data


class HotelStep2aSerializer(serializers.ModelSerializer):
    """
    Step 2a — المرافق: قائمة IDs من HotelAmenity.
    POST /api/v1/suppliers/hotel/onboarding/step2/amenities/
    """
    amenity_ids = serializers.ListField(
        child=serializers.UUIDField(), write_only=True
    )

    class Meta:
        model  = HotelSupplier
        fields = ['amenity_ids']

    def validate_amenity_ids(self, value):
        existing = HotelAmenity.objects.filter(
            id__in=value, is_active=True
        ).values_list('id', flat=True)
        missing = set(str(v) for v in value) - set(str(e) for e in existing)
        if missing:
            raise serializers.ValidationError(
                f"المرافق التالية غير موجودة: {missing}"
            )
        return value

    def update(self, instance, validated_data):
        amenity_ids = validated_data.pop('amenity_ids', [])
        HotelPropertyAmenity.objects.filter(hotel=instance).delete()
        HotelPropertyAmenity.objects.bulk_create([
            HotelPropertyAmenity(hotel=instance, amenity_id=aid)
            for aid in amenity_ids
        ])
        return instance


class HotelStep2bSerializer(serializers.ModelSerializer):
    """
    Step 2b — الخدمات: إفطار، موقف سيارات، لغات، قواعد المنزل.
    POST /api/v1/suppliers/hotel/onboarding/step2/services/
    """
    class Meta:
        model  = HotelSupplier
        fields = [
            # الإفطار
            'breakfast_available', 'breakfast_included',
            'breakfast_price', 'breakfast_currency', 'breakfast_types',
            # موقف السيارات
            'parking_available', 'parking_price', 'parking_price_unit',
            'parking_reservation', 'parking_location', 'parking_private',
            # اللغات
            'spoken_languages',
            # قواعد المنزل
            'checkin_from', 'checkin_until',
            'checkout_from', 'checkout_until',
            'children_allowed', 'pets_policy', 'pets_free',
        ]

    def validate(self, data):
        if data.get('breakfast_available') and not data.get('breakfast_included'):
            price = data.get('breakfast_price')
            if price is not None and price < 0:
                raise serializers.ValidationError({
                    'breakfast_price': 'سعر الإفطار لا يمكن أن يكون سالباً.'
                })
        return data


class HotelStep2cSerializer(serializers.ModelSerializer):
    """
    Step 2c — الأوصاف: وصف العقار، المضيف، الحي.
    POST /api/v1/suppliers/hotel/onboarding/step2/description/
    """
    class Meta:
        model  = HotelSupplier
        fields = [
            'description_property',
            'host_name', 'host_bio',
            'description_neighborhood',
        ]


class RoomOccupancyPriceSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RoomOccupancyPrice
        fields = ['guests_count', 'discount_pct', 'final_price', 'is_active']


class HotelRoomTypeSerializer(serializers.ModelSerializer):
    """
    Step 3 — إضافة غرفة كاملة مع أسعار الإشغال.
    POST /api/v1/suppliers/hotel/onboarding/rooms/
    """
    occupancy_prices = RoomOccupancyPriceSerializer(many=True, required=False)

    class Meta:
        model  = HotelRoomType
        fields = [
            'id', 'room_unit_type', 'room_count',
            'beds', 'max_guests', 'exclude_infants',
            'area_sqm', 'area_unit', 'smoking_allowed',
            'bathroom_private', 'bathroom_items',
            'room_amenities',
            'room_name', 'room_custom_name',
            'cost_price_per_night', 'cost_currency',
            'occupancy_prices',
            'content_status', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'content_status', 'created_at', 'updated_at']

    def validate_beds(self, value):
        if not value:
            raise serializers.ValidationError('يجب إضافة نوع سرير واحد على الأقل.')
        for bed in value:
            if 'type' not in bed or 'count' not in bed:
                raise serializers.ValidationError(
                    'كل سرير يجب أن يحتوي على type و count.'
                )
            if bed.get('count', 0) < 1:
                raise serializers.ValidationError(
                    'عدد الأسرة يجب أن يكون 1 على الأقل.'
                )
        return value

    def validate_cost_price_per_night(self, value):
        if value is not None and value <= 0:
            raise serializers.ValidationError('سعر التكلفة يجب أن يكون أكبر من صفر.')
        return value

    def create(self, validated_data):
        occupancy_prices = validated_data.pop('occupancy_prices', [])
        room_type = HotelRoomType.objects.create(**validated_data)
        for op in occupancy_prices:
            RoomOccupancyPrice.objects.create(room_type=room_type, **op)
        return room_type

    def update(self, instance, validated_data):
        occupancy_prices = validated_data.pop('occupancy_prices', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if occupancy_prices is not None:
            RoomOccupancyPrice.objects.filter(room_type=instance).delete()
            for op in occupancy_prices:
                RoomOccupancyPrice.objects.create(room_type=instance, **op)
        return instance


class PropertyImageSerializer(serializers.ModelSerializer):
    """
    Step 4 — رفع صور الفندق.
    POST /api/v1/suppliers/hotel/onboarding/images/
    """
    class Meta:
        model  = PropertyImage
        fields = ['id', 'image', 'is_main', 'order', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']

    def validate_image(self, value):
        max_size = 47 * 1024 * 1024  # 47MB
        if value.size > max_size:
            raise serializers.ValidationError(
                f'حجم الصورة {value.size // 1024 // 1024}MB يتجاوز الحد الأقصى 47MB.'
            )
        allowed = ['image/jpeg', 'image/jpg', 'image/png']
        if value.content_type not in allowed:
            raise serializers.ValidationError(
                'فقط صور JPG و PNG مسموحة.'
            )
        return value


class HotelStep5aSerializer(serializers.ModelSerializer):
    """
    Step 5a — إعدادات الأسعار: نوع الحجز، سياسة الإلغاء، أسعار الأطفال.
    POST /api/v1/suppliers/hotel/onboarding/step5/pricing/
    """
    class Meta:
        model  = HotelSupplier
        fields = [
            'booking_type',
            'cancellation_deadline_days',
            'cancellation_fee_type',
            'accidental_booking_protection',
            'children_pricing_enabled',
            'infant_age_from', 'infant_age_to',
            'infant_price', 'infant_price_type',
            'children_age_from', 'children_age_to',
            'children_price', 'children_price_type',
            'launch_discount_enabled',
            'launch_discount_pct',
            'launch_discount_bookings',
            'launch_discount_days',
        ]


class HotelPricePlanSerializer(serializers.ModelSerializer):
    """
    Step 5b — خطط الأسعار: قياسي / غير قابل للاسترداد / أسبوعي.
    POST /api/v1/suppliers/hotel/onboarding/step5/plans/
    """
    plan_type_display = serializers.CharField(
        source='get_plan_type_display', read_only=True
    )

    class Meta:
        model  = HotelPricePlan
        fields = [
            'id', 'plan_type', 'plan_type_display',
            'is_enabled', 'discount_pct',
            'min_nights', 'cancellation_free_days',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        plan_type = data.get('plan_type', '')
        discount  = data.get('discount_pct', 0)
        if plan_type == 'NON_REFUNDABLE' and discount < 5:
            raise serializers.ValidationError({
                'discount_pct': 'الخطة غير القابلة للاسترداد تحتاج خصماً لا يقل عن 5%.'
            })
        if plan_type == 'WEEKLY' and discount < 5:
            raise serializers.ValidationError({
                'discount_pct': 'الخطة الأسبوعية تحتاج خصماً لا يقل عن 5%.'
            })
        return data


class HotelStep6Serializer(serializers.ModelSerializer):
    """
    Step 6 — التوفر والجدول الزمني.
    POST /api/v1/suppliers/hotel/onboarding/step6/availability/
    """
    class Meta:
        model  = HotelSupplier
        fields = [
            'availability_start',
            'availability_start_date',
            'availability_window',
            'calendar_sync_enabled',
            'calendar_sync_url',
            'allow_long_stays',
            'max_nights',
        ]

    def validate(self, data):
        if data.get('availability_start') == 'SPECIFIC_DATE':
            if not data.get('availability_start_date'):
                raise serializers.ValidationError({
                    'availability_start_date': 'يجب تحديد تاريخ عند اختيار تاريخ محدد.'
                })
        if data.get('calendar_sync_enabled') and not data.get('calendar_sync_url', '').strip():
            raise serializers.ValidationError({
                'calendar_sync_url': 'رابط التقويم مطلوب عند تفعيل المزامنة.'
            })
        return data


class HotelStep7Serializer(serializers.ModelSerializer):
    """
    Step 7 — الخطوات النهائية: الدفع، الفاتورة، بيانات العقد.
    POST /api/v1/suppliers/hotel/onboarding/step7/final/
    """
    class Meta:
        model  = HotelSupplier
        fields = [
            'payment_method',
            'invoice_name_type', 'invoice_legal_name',
            'invoice_same_address', 'invoice_address',
            'owner_type',
            'contract_first_name', 'contract_middle_name', 'contract_last_name',
            'contract_email', 'contract_phone',
            'contract_country', 'contract_address1', 'contract_address2',
            'contract_city', 'contract_zip',
            'business_legal_name',
            'business_country', 'business_address1', 'business_address2',
            'business_city', 'business_zip',
            'license_confirmed', 'terms_accepted',
            'open_immediately',
        ]

    def validate(self, data):
        owner_type = data.get('owner_type', 'INDIVIDUAL')
        if owner_type == 'INDIVIDUAL':
            if not data.get('contract_first_name', '').strip():
                raise serializers.ValidationError({
                    'contract_first_name': 'الاسم الأول مطلوب.'
                })
            if not data.get('contract_last_name', '').strip():
                raise serializers.ValidationError({
                    'contract_last_name': 'اسم العائلة مطلوب.'
                })
        elif owner_type == 'BUSINESS':
            if not data.get('business_legal_name', '').strip():
                raise serializers.ValidationError({
                    'business_legal_name': 'الاسم القانوني للشركة مطلوب.'
                })
        if not data.get('license_confirmed'):
            raise serializers.ValidationError({
                'license_confirmed': 'يجب تأكيد أن العمل يملك جميع التراخيص اللازمة.'
            })
        if not data.get('terms_accepted'):
            raise serializers.ValidationError({
                'terms_accepted': 'يجب قبول شروط الخدمة لإتمام التسجيل.'
            })
        return data

    def update(self, instance, validated_data):
        if validated_data.get('terms_accepted') and not instance.terms_accepted:
            validated_data['terms_accepted_at'] = timezone.now()
        return super().update(instance, validated_data)


# ═══════════════════════════════════════════════════════
# HOTEL STATUS — حالة التسجيل الكاملة
# ═══════════════════════════════════════════════════════

class HotelOnboardingStatusSerializer(serializers.ModelSerializer):
    """
    GET /api/v1/suppliers/hotel/onboarding/status/
    يُظهر نسبة إكمال التسجيل وأي خطوات مكتملة.
    """
    rooms_count      = serializers.SerializerMethodField()
    images_count     = serializers.SerializerMethodField()
    completion_pct   = serializers.SerializerMethodField()
    steps_status     = serializers.SerializerMethodField()
    amenities_count  = serializers.SerializerMethodField()

    class Meta:
        model  = HotelSupplier
        fields = [
            'id', 'hotel_name', 'hotel_type', 'star_rating',
            'content_status', 'booking_type',
            'terms_accepted', 'open_immediately',
            'rooms_count', 'images_count', 'amenities_count',
            'completion_pct', 'steps_status',
            'created_at', 'updated_at',
        ]

    def get_rooms_count(self, obj):
        return obj.room_types.filter(is_active=True).count()

    def get_images_count(self, obj):
        return obj.images.filter(is_active=True).count()

    def get_amenities_count(self, obj):
        return obj.property_amenities.count()

    def get_completion_pct(self, obj):
        steps = self.get_steps_status(obj)
        completed = sum(1 for v in steps.values() if v)
        return round((completed / len(steps)) * 100)

    def get_steps_status(self, obj):
        return {
            'step0_property_type': bool(obj.hotel_type),
            'step1_basic_info':    bool(obj.hotel_name and obj.address and obj.city),
            'step2_amenities':     obj.property_amenities.exists(),
            'step2_services':      bool(obj.checkin_from and obj.checkout_until),
            'step2_description':   bool(obj.description_property),
            'step3_rooms':         obj.room_types.filter(is_active=True).exists(),
            'step4_photos':        obj.images.filter(is_active=True).count() >= 5,
            'step5_pricing':       obj.price_plans.filter(is_enabled=True).exists(),
            'step6_availability':  bool(obj.availability_start),
            'step7_final':         obj.terms_accepted,
        }


# ═══════════════════════════════════════════════════════
# HOTEL AMENITY LIST
# ═══════════════════════════════════════════════════════

class HotelAmenitySerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)

    class Meta:
        model  = HotelAmenity
        fields = [
            'id', 'name_en', 'name_ar', 'name_fr', 'name_ms',
            'category', 'category_display', 'amenity_type',
            'icon', 'sort_order',
        ]


# ═══════════════════════════════════════════════════════
# WAITLIST
# ═══════════════════════════════════════════════════════

class SupplierWaitlistSerializer(serializers.ModelSerializer):
    class Meta:
        model  = SupplierWaitlist
        fields = [
            'id', 'supplier_type', 'full_name', 'company_name',
            'sub_type', 'phone', 'email', 'extra_info',
            'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_email(self, value):
        # منع التسجيل المكرر لنفس النوع ونفس الإيميل
        supplier_type = self.initial_data.get('supplier_type', '')
        if SupplierWaitlist.objects.filter(
            email=value.lower(),
            supplier_type=supplier_type
        ).exists():
            raise serializers.ValidationError(
                'هذا البريد الإلكتروني مسجّل مسبقاً في قائمة الانتظار لهذا النوع.'
            )
        return value.lower()


# ═══════════════════════════════════════════════════════
# LEGACY SERIALIZERS — محفوظة للتوافق
# ═══════════════════════════════════════════════════════

class SupplierPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = ['id', 'company_name', 'supplier_type', 'country', 'city', 'default_currency']


class RoomRateSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = RoomRateSupplier
        fields = ['id', 'room_type', 'season_name', 'date_from', 'date_to',
                  'meal_plan', 'cost_price', 'cost_price_child', 'cost_price_infant',
                  'currency', 'available_rooms', 'min_nights',
                  'is_active', 'content_status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'content_status', 'created_at', 'updated_at']


class RoomTypeSupplierSerializer(serializers.ModelSerializer):
    rates = RoomRateSupplierSerializer(many=True, read_only=True)
    class Meta:
        model  = RoomTypeSupplier
        fields = ['id', 'hotel', 'name', 'description', 'max_occupancy',
                  'bed_config', 'total_rooms', 'amenities', 'images',
                  'is_active', 'created_at', 'updated_at', 'rates']
        read_only_fields = ['id', 'created_at', 'updated_at']


class HotelSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = HotelSupplier
        fields = ['id', 'supplier', 'content_status', 'hotel_name',
                  'star_rating', 'country', 'city', 'address',
                  'latitude', 'longitude', 'is_active',
                  'created_at', 'updated_at']
        read_only_fields = ['id', 'supplier', 'content_status', 'created_at', 'updated_at']


class TourRateSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TourRateSupplier
        fields = ['id', 'tour', 'season_name', 'date_from', 'date_to',
                  'cost_price_per_person', 'cost_price_child', 'currency',
                  'is_active', 'content_status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'content_status', 'created_at', 'updated_at']


class TourSupplierSerializer(serializers.ModelSerializer):
    rates = TourRateSupplierSerializer(many=True, read_only=True)
    class Meta:
        model  = TourSupplier
        fields = ['id', 'supplier', 'content_status', 'name', 'country', 'city',
                  'duration_days', 'duration_nights', 'description', 'itinerary',
                  'inclusions', 'exclusions', 'images', 'min_pax', 'max_pax',
                  'is_active', 'created_at', 'updated_at', 'rates']
        read_only_fields = ['id', 'supplier', 'content_status', 'created_at', 'updated_at']


class TransferRateSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TransferRateSupplier
        fields = ['id', 'route', 'vehicle_type', 'cost_price', 'currency',
                  'is_active', 'content_status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'content_status', 'created_at', 'updated_at']


class TransferRouteSupplierSerializer(serializers.ModelSerializer):
    rates = TransferRateSupplierSerializer(many=True, read_only=True)
    class Meta:
        model  = TransferRouteSupplier
        fields = ['id', 'supplier', 'origin', 'destination', 'country',
                  'estimated_duration_minutes', 'is_active', 'content_status',
                  'created_at', 'updated_at', 'rates']
        read_only_fields = ['id', 'supplier', 'content_status', 'created_at', 'updated_at']


class FlightRateSupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FlightRateSupplier
        fields = ['id', 'route', 'cabin_class', 'season_name', 'date_from', 'date_to',
                  'cost_price_adult', 'cost_price_child', 'cost_price_infant',
                  'currency', 'available_seats', 'baggage_included_kg',
                  'is_active', 'content_status', 'created_at', 'updated_at']
        read_only_fields = ['id', 'content_status', 'created_at', 'updated_at']


class FlightRouteSupplierSerializer(serializers.ModelSerializer):
    rates = FlightRateSupplierSerializer(many=True, read_only=True)
    class Meta:
        model  = FlightRouteSupplier
        fields = ['id', 'supplier', 'origin_city', 'origin_code',
                  'destination_city', 'destination_code', 'airline_name', 'airline_code',
                  'is_active', 'content_status', 'created_at', 'updated_at', 'rates']
        read_only_fields = ['id', 'supplier', 'content_status', 'created_at', 'updated_at']
