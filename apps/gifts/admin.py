from django.contrib import admin
from .models import Gift, GiftPhoto


@admin.register(Gift)
class GiftAdmin(admin.ModelAdmin):
    list_display  = ['service', 'subcategory', 'default_is_mandatory', 'base_price', 'profit_margin_pct', 'currency']
    list_filter   = ['subcategory', 'default_is_mandatory', 'currency']
    search_fields = ['service__name', 'description_ar', 'description_en']
    raw_id_fields = ['service']
    fieldsets = (
        ('الربط', {'fields': ('service', 'subcategory', 'default_is_mandatory')}),
        ('السعر', {'fields': ('base_price', 'profit_margin_pct', 'currency')}),
        ('الوصف', {'fields': ('description_ar', 'description_en', 'notes')}),
    )


@admin.register(GiftPhoto)
class GiftPhotoAdmin(admin.ModelAdmin):
    list_display  = ['gift', 'is_primary', 'order', 'caption', 'uploaded_at']
    list_filter   = ['is_primary']
    raw_id_fields = ['gift']
