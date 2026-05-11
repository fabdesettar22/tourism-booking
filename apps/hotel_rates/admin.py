from django.contrib import admin

from .models import (
    HotelSeason,
    HotelSeasonDateRange,
    HotelSurcharge,
    PricingTierDef,
    RoomCategory,
    RoomCategoryPhoto,
    RoomInclusion,
    RoomRate,
)


@admin.register(RoomCategoryPhoto)
class RoomCategoryPhotoAdmin(admin.ModelAdmin):
    list_display = ['room_category', 'is_primary', 'order', 'uploaded_at']
    list_filter = ['is_primary']
    search_fields = ['room_category__name', 'caption']
    raw_id_fields = ['room_category']


@admin.register(PricingTierDef)
class PricingTierDefAdmin(admin.ModelAdmin):
    list_display  = ['hotel', 'name', 'min_rooms_required', 'profit_margin_pct', 'sort_order', 'is_active']
    list_filter   = ['is_active']
    search_fields = ['hotel__name', 'name']
    raw_id_fields = ['hotel']


class RoomInclusionInline(admin.TabularInline):
    model = RoomInclusion
    extra = 0
    fields = ['label', 'quantity', 'unit', 'sort_order']


class HotelSeasonDateRangeInline(admin.TabularInline):
    model = HotelSeasonDateRange
    extra = 0
    fields = ['start_date', 'end_date', 'label']


@admin.register(RoomCategory)
class RoomCategoryAdmin(admin.ModelAdmin):
    list_display  = ['hotel', 'name', 'base_type', 'view_type', 'pax', 'is_package', 'is_active']
    list_filter   = ['base_type', 'view_type', 'is_package', 'is_active']
    search_fields = ['name', 'name_ar', 'hotel__name']
    raw_id_fields = ['hotel']
    inlines       = [RoomInclusionInline]
    ordering      = ['hotel', 'sort_order', 'name']


@admin.register(HotelSeason)
class HotelSeasonAdmin(admin.ModelAdmin):
    list_display  = ['hotel', 'name', 'season_type', 'sort_order', 'is_active']
    list_filter   = ['season_type', 'is_active']
    search_fields = ['name', 'hotel__name']
    raw_id_fields = ['hotel']
    inlines       = [HotelSeasonDateRangeInline]


@admin.register(HotelSeasonDateRange)
class HotelSeasonDateRangeAdmin(admin.ModelAdmin):
    list_display  = ['season', 'start_date', 'end_date', 'label']
    list_filter   = ['season__hotel']
    raw_id_fields = ['season']


@admin.register(RoomRate)
class RoomRateAdmin(admin.ModelAdmin):
    list_display  = [
        'room_category', 'season', 'pricing_tier', 'day_type', 'occupancy',
        'base_rate', 'currency', 'tax_inclusive', 'is_active',
    ]
    list_filter   = ['pricing_tier', 'day_type', 'occupancy', 'tax_inclusive', 'currency', 'is_active']
    search_fields = ['room_category__name', 'room_category__hotel__name']
    raw_id_fields = ['room_category', 'season']
    fieldsets = (
        ('الربط', {'fields': ('room_category', 'season')}),
        ('المصفوفة', {'fields': ('pricing_tier', 'day_type', 'occupancy')}),
        ('الأسعار', {'fields': ('base_rate', 'rate_with_breakfast', 'extra_bed_price')}),
        ('فطور الأطفال', {'fields': ('kid_breakfast_price', 'kid_breakfast_free', 'kid_breakfast_age_limit')}),
        ('الضرائب والربح', {'fields': ('tax_inclusive', 'markup_pct', 'currency')}),
        ('أخرى', {'fields': ('notes', 'is_active')}),
    )


@admin.register(HotelSurcharge)
class HotelSurchargeAdmin(admin.ModelAdmin):
    list_display  = ['hotel', 'name', 'surcharge_type', 'amount', 'weekday', 'date_start', 'date_end', 'is_active']
    list_filter   = ['surcharge_type', 'weekday', 'is_active']
    search_fields = ['name', 'hotel__name']
    raw_id_fields = ['hotel', 'room_category']


@admin.register(RoomInclusion)
class RoomInclusionAdmin(admin.ModelAdmin):
    list_display  = ['room_category', 'label', 'quantity', 'unit', 'sort_order']
    search_fields = ['label', 'room_category__name']
    raw_id_fields = ['room_category']
