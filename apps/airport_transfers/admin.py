from django.contrib import admin
from .models import Airport, AirportTransfer


@admin.register(Airport)
class AirportAdmin(admin.ModelAdmin):
    list_display  = ['code', 'name', 'city', 'is_active']
    list_filter   = ['is_active']
    search_fields = ['code', 'name']
    raw_id_fields = ['city']
    ordering      = ['code']


@admin.register(AirportTransfer)
class AirportTransferAdmin(admin.ModelAdmin):
    list_display = [
        'airport', 'hotel',
        'price_pax_1_2', 'price_pax_3_4', 'price_pax_5_6',
        'price_pax_7_8', 'price_pax_10_12',
        'tour_guide_fee_myr', 'currency',
    ]
    list_filter   = ['airport', 'currency']
    search_fields = ['airport__code', 'airport__name', 'hotel__name']
    raw_id_fields = ['service', 'hotel']
    fieldsets = (
        ('الربط', {
            'fields': ('service', 'airport', 'hotel'),
        }),
        ('الأسعار حسب شرائح pax (MYR، اتجاه واحد)', {
            'fields': (
                'price_pax_1_2', 'price_pax_3_4', 'price_pax_5_6',
                'price_pax_7_8', 'price_pax_10_12', 'price_pax_14',
                'price_pax_40_bus',
            ),
        }),
        ('نسبة الربح % لكل شريحة', {
            'classes': ('collapse',),
            'fields': (
                'margin_pct_1_2', 'margin_pct_3_4', 'margin_pct_5_6',
                'margin_pct_7_8', 'margin_pct_10_12', 'margin_pct_14',
                'margin_pct_40_bus',
            ),
        }),
        ('إضافات', {
            'fields': ('tour_guide_fee_myr', 'currency', 'notes'),
        }),
    )
