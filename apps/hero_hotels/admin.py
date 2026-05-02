"""
Django Admin interface لإدارة بطاقات Hero Hotel.
"""
from django.contrib import admin
from django.utils.html import format_html

from apps.hero_hotels.models import HeroHotelCard


@admin.register(HeroHotelCard)
class HeroHotelCardAdmin(admin.ModelAdmin):
    list_display = (
        'card_thumbnail',
        'name',
        'card_type',
        'location',
        'stars',
        'display_order',
        'is_active',
        'updated_at',
    )
    list_display_links = ('name',)
    list_filter = ('card_type', 'is_active', 'stars', 'location')
    search_fields = ('name', 'location', 'description')
    list_editable = ('display_order', 'is_active')
    readonly_fields = (
        'created_at', 'updated_at',
        'logo_preview', 'card_image_preview', 'hero_image_preview',
    )

    fieldsets = (
        ('نوع البطاقة', {
            'fields': ('card_type',),
            'description': 'فندق / شريك / ممول / عام — يتحكم بطريقة العرض',
        }),
        ('معلومات أساسية', {
            'fields': ('name', 'location', 'stars', 'description'),
        }),
        ('الشعار', {
            'fields': ('logo', 'logo_preview'),
        }),
        ('media البطاقة (صورة أو فيديو)', {
            'description': 'استخدم واحداً منهما — الفيديو يأخذ الأولوية إن وُجد',
            'fields': ('card_image', 'card_image_preview', 'card_video'),
        }),
        ('media الخلفية (صورة أو فيديو)', {
            'description': 'الـ Hero الكبير — الفيديو يأخذ الأولوية إن وُجد',
            'fields': ('hero_image', 'hero_image_preview', 'hero_video'),
        }),
        ('CTA (اختياري)', {
            'fields': ('link_url', 'cta_text'),
            'description': 'زر يظهر داخل البطاقة عند ملء الحقلَين',
        }),
        ('التحكم في العرض', {
            'fields': ('display_order', 'is_active'),
        }),
        ('معلومات النظام', {
            'classes': ('collapse',),
            'fields': ('created_at', 'updated_at'),
        }),
    )

    @admin.display(description='صورة البطاقة')
    def card_thumbnail(self, obj):
        if obj.card_image:
            return format_html(
                '<img src="{}" style="width:80px;height:50px;object-fit:cover;border-radius:6px;"/>',
                obj.card_image.url,
            )
        return '—'

    @admin.display(description='معاينة الشعار')
    def logo_preview(self, obj):
        if obj.logo:
            return format_html(
                '<img src="{}" style="max-width:120px;max-height:120px;background:#f5f5f5;padding:10px;border-radius:8px;"/>',
                obj.logo.url,
            )
        return '—'

    @admin.display(description='معاينة صورة البطاقة')
    def card_image_preview(self, obj):
        if obj.card_image:
            return format_html(
                '<img src="{}" style="max-width:400px;max-height:240px;border-radius:8px;object-fit:cover;"/>',
                obj.card_image.url,
            )
        return '—'

    @admin.display(description='معاينة صورة الخلفية')
    def hero_image_preview(self, obj):
        if obj.hero_image:
            return format_html(
                '<img src="{}" style="max-width:600px;max-height:340px;border-radius:8px;object-fit:cover;"/>',
                obj.hero_image.url,
            )
        return '—'
