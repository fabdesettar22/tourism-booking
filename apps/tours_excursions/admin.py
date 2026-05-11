from django.contrib import admin
from .models import Tour


@admin.register(Tour)
class TourAdmin(admin.ModelAdmin):
    list_display = [
        'tour_type', 'duration',
        'origin_text', 'destination_text',
        'price_pax_1_2', 'price_pax_3_4', 'price_pax_7_8', 'price_pax_10_12',
        'tour_guide_fee_myr', 'currency',
    ]
    list_filter   = ['tour_type', 'duration', 'currency']
    search_fields = ['origin_text', 'destination_text', 'service__name']
    raw_id_fields = ['service', 'origin_city', 'destination_city']
    fieldsets = (
        ('الربط', {
            'fields': ('service', 'tour_type', 'duration'),
        }),
        ('الموقع', {
            'fields': ('origin_city', 'origin_text', 'destination_city', 'destination_text'),
        }),
        ('الأسعار حسب شرائح pax (MYR)', {
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
