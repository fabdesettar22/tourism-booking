from rest_framework import serializers

from .models import (
    HotelGuestPricing,
    HotelSeason,
    HotelSeasonDateRange,
    HotelSurcharge,
    PricingTierDef,
    RoomCategory,
    RoomCategoryPhoto,
    RoomInclusion,
    RoomRate,
)


class RoomCategoryPhotoSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = RoomCategoryPhoto
        fields = ['id', 'room_category', 'image', 'is_primary', 'order', 'caption', 'uploaded_at']

    def get_image(self, obj):
        if not obj.image:
            return None
        request = self.context.get('request')
        url = obj.image.url
        return request.build_absolute_uri(url) if request else url


# ─── RoomInclusion ─────────────────────────────────────────

class RoomInclusionSerializer(serializers.ModelSerializer):
    unit_display = serializers.CharField(source='get_unit_display', read_only=True)

    class Meta:
        model = RoomInclusion
        fields = ['id', 'room_category', 'label', 'quantity', 'unit', 'unit_display', 'sort_order']


# ─── RoomCategory ──────────────────────────────────────────

class RoomCategorySerializer(serializers.ModelSerializer):
    base_type_display = serializers.CharField(source='get_base_type_display', read_only=True)
    view_type_display = serializers.CharField(source='get_view_type_display', read_only=True)
    inclusions = RoomInclusionSerializer(many=True, read_only=True)
    photos = RoomCategoryPhotoSerializer(many=True, read_only=True)

    class Meta:
        model = RoomCategory
        fields = [
            'id', 'hotel', 'name', 'name_ar',
            'base_type', 'base_type_display',
            'view_type', 'view_type_display', 'view_custom',
            'pax', 'max_occupancy', 'bed_config',
            'quantity_in_hotel',
            'max_extra_beds', 'max_child_beds',
            'is_package', 'description', 'image',
            'is_active', 'sort_order',
            'inclusions', 'photos',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


# ─── HotelSeason ───────────────────────────────────────────

class HotelSeasonDateRangeSerializer(serializers.ModelSerializer):
    class Meta:
        model = HotelSeasonDateRange
        fields = ['id', 'season', 'start_date', 'end_date', 'label']


class HotelSeasonSerializer(serializers.ModelSerializer):
    season_type_display = serializers.CharField(source='get_season_type_display', read_only=True)
    date_ranges = HotelSeasonDateRangeSerializer(many=True, read_only=True)

    class Meta:
        model = HotelSeason
        fields = [
            'id', 'hotel', 'name',
            'season_type', 'season_type_display',
            'sort_order', 'notes', 'is_active',
            'date_ranges',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


# ─── RoomRate ──────────────────────────────────────────────

class RoomRateSerializer(serializers.ModelSerializer):
    pricing_tier_display = serializers.CharField(source='pricing_tier', read_only=True)
    day_type_display     = serializers.CharField(source='get_day_type_display', read_only=True)
    occupancy_display    = serializers.CharField(source='get_occupancy_display', read_only=True)

    class Meta:
        model = RoomRate
        fields = [
            'id', 'room_category', 'season',
            'pricing_tier', 'pricing_tier_display',
            'day_type', 'day_type_display',
            'occupancy', 'occupancy_display',
            'base_rate', 'rate_with_breakfast',
            'extra_bed_price',
            'child_with_bed_price', 'child_without_bed_price', 'infant_bed_price',
            'kid_breakfast_price', 'kid_breakfast_free', 'kid_breakfast_age_limit',
            'tax_inclusive', 'markup_pct', 'currency',
            'notes', 'is_active',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['created_at', 'updated_at']


# ─── HotelSurcharge ────────────────────────────────────────

class HotelSurchargeSerializer(serializers.ModelSerializer):
    surcharge_type_display = serializers.CharField(source='get_surcharge_type_display', read_only=True)
    weekday_display        = serializers.CharField(source='get_weekday_display', read_only=True)

    class Meta:
        model = HotelSurcharge
        fields = [
            'id', 'hotel', 'room_category', 'name',
            'surcharge_type', 'surcharge_type_display', 'amount',
            'weekday', 'weekday_display', 'date_start', 'date_end',
            'applies_to_tier', 'notes', 'is_active',
        ]


# ─── PricingTierDef ────────────────────────────────────────

class PricingTierDefSerializer(serializers.ModelSerializer):
    class Meta:
        model = PricingTierDef
        fields = [
            "id", "hotel", "name",
            "min_rooms_required", "max_rooms_required",
            "profit_margin_pct",
            "sort_order", "is_active",
        ]


class HotelGuestPricingSerializer(serializers.ModelSerializer):
    tier_name = serializers.CharField(source='tier.name', read_only=True)

    class Meta:
        model = HotelGuestPricing
        fields = [
            'id', 'hotel', 'tier', 'tier_name',
            'extra_bed_price',
            'infant_age_from', 'infant_age_to', 'infant_price',
            'child_with_bed_age_from', 'child_with_bed_age_to', 'child_with_bed_price',
            'child_no_bed_age_from', 'child_no_bed_age_to', 'child_no_bed_price',
            'child_breakfast_age_from', 'child_breakfast_age_to', 'child_breakfast_price',
            'notes',
        ]

