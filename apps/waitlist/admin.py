# apps/waitlist/admin.py

from django.contrib import admin
from .models import (
    PropertyWaitlist, TransportWaitlist, RestaurantWaitlist,
    GuideWaitlist, ActivityWaitlist, WellnessWaitlist, OtherServiceWaitlist,
)

class WaitlistBaseAdmin(admin.ModelAdmin):
    readonly_fields   = ('id', 'ref_number', 'created_at', 'updated_at', 'ip_address', 'device_type')
    list_per_page     = 25
    search_fields     = ('full_name', 'email', 'phone', 'company_name', 'ref_number')
    list_filter       = ('status', 'how_did_you_hear', 'worked_before', 'created_at')
    date_hierarchy    = 'created_at'
    ordering          = ('-created_at',)

    list_display = (
        'ref_number', 'full_name', 'company_name',
        'email', 'phone', 'city',
        'status', 'email_sent', 'created_at',
    )

    fieldsets = (
        ('المعلومات الأساسية', {
            'fields': ('ref_number', 'full_name', 'email', 'phone', 'company_name', 'city', 'region')
        }),
        ('مصدر التسجيل', {
            'fields': ('how_did_you_hear', 'how_did_you_hear_other', 'worked_before'),
            'classes': ('collapse',),
        }),
        ('UTM & التتبع', {
            'fields': ('utm_source', 'utm_medium', 'utm_campaign', 'ip_address', 'device_type'),
            'classes': ('collapse',),
        }),
        ('الحالة', {
            'fields': ('status', 'email_sent', 'notes'),
        }),
        ('التواريخ', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    actions = ['mark_contacted', 'mark_registered', 'mark_rejected']

    def mark_contacted(self, request, queryset):
        queryset.update(status='CONTACTED')
    mark_contacted.short_description = 'تعيين كـ: تم التواصل'

    def mark_registered(self, request, queryset):
        queryset.update(status='REGISTERED')
    mark_registered.short_description = 'تعيين كـ: مسجل'

    def mark_rejected(self, request, queryset):
        queryset.update(status='REJECTED')
    mark_rejected.short_description = 'تعيين كـ: مرفوض'


@admin.register(PropertyWaitlist)
class PropertyWaitlistAdmin(WaitlistBaseAdmin):
    list_display = WaitlistBaseAdmin.list_display + ('property_type', 'rooms_count', 'star_rating')
    list_filter  = WaitlistBaseAdmin.list_filter + ('property_type', 'listed_online')
    fieldsets    = WaitlistBaseAdmin.fieldsets + (
        ('بيانات العقار', {
            'fields': ('property_type', 'rooms_count', 'star_rating', 'listed_online', 'extra_data'),
        }),
        ('الوثائق', {
            'fields': ('property_photo', 'license_doc'),
        }),
    )


@admin.register(TransportWaitlist)
class TransportWaitlistAdmin(WaitlistBaseAdmin):
    list_display = WaitlistBaseAdmin.list_display + ('transport_type', 'vehicles_count', 'has_license')
    list_filter  = WaitlistBaseAdmin.list_filter + ('transport_type', 'has_license')
    fieldsets    = WaitlistBaseAdmin.fieldsets + (
        ('بيانات النقل', {
            'fields': ('transport_type', 'vehicles_count', 'has_license', 'extra_data'),
        }),
        ('الوثائق', {
            'fields': ('vehicle_license', 'tourism_license'),
        }),
    )


@admin.register(RestaurantWaitlist)
class RestaurantWaitlistAdmin(WaitlistBaseAdmin):
    list_display = WaitlistBaseAdmin.list_display + ('restaurant_type', 'capacity', 'is_halal')
    list_filter  = WaitlistBaseAdmin.list_filter + ('restaurant_type', 'is_halal')
    fieldsets    = WaitlistBaseAdmin.fieldsets + (
        ('بيانات المطعم', {
            'fields': ('restaurant_type', 'capacity', 'is_halal', 'extra_data'),
        }),
        ('الوثائق', {
            'fields': ('restaurant_license', 'halal_certificate'),
        }),
    )


@admin.register(GuideWaitlist)
class GuideWaitlistAdmin(WaitlistBaseAdmin):
    list_display = WaitlistBaseAdmin.list_display + ('experience_years', 'has_license', 'accepts_groups')
    list_filter  = WaitlistBaseAdmin.list_filter + ('has_license', 'accepts_groups')
    fieldsets    = WaitlistBaseAdmin.fieldsets + (
        ('بيانات المرشد', {
            'fields': ('specialties', 'languages', 'experience_years', 'regions_covered', 'has_license', 'accepts_groups'),
        }),
        ('الوثائق', {
            'fields': ('id_document', 'guide_license'),
        }),
    )


@admin.register(ActivityWaitlist)
class ActivityWaitlistAdmin(WaitlistBaseAdmin):
    list_display = WaitlistBaseAdmin.list_display + ('capacity', 'has_insurance', 'has_license')
    list_filter  = WaitlistBaseAdmin.list_filter + ('has_insurance', 'has_license', 'suitable_kids')
    fieldsets    = WaitlistBaseAdmin.fieldsets + (
        ('بيانات النشاط', {
            'fields': ('activity_types', 'capacity', 'suitable_kids', 'suitable_elderly', 'has_insurance', 'has_license'),
        }),
        ('الوثائق', {
            'fields': ('activity_license', 'insurance_doc'),
        }),
    )


@admin.register(WellnessWaitlist)
class WellnessWaitlistAdmin(WaitlistBaseAdmin):
    list_display = WaitlistBaseAdmin.list_display + ('gender_policy', 'is_halal_certified', 'has_license')
    list_filter  = WaitlistBaseAdmin.list_filter + ('gender_policy', 'is_halal_certified', 'has_license')
    fieldsets    = WaitlistBaseAdmin.fieldsets + (
        ('بيانات السبا', {
            'fields': ('wellness_types', 'capacity', 'is_independent', 'gender_policy', 'is_halal_certified', 'has_license'),
        }),
        ('الوثائق', {
            'fields': ('wellness_license', 'staff_certificates'),
        }),
    )


@admin.register(OtherServiceWaitlist)
class OtherServiceWaitlistAdmin(WaitlistBaseAdmin):
    list_display = WaitlistBaseAdmin.list_display + ('target_audience', 'has_license')
    list_filter  = WaitlistBaseAdmin.list_filter + ('target_audience', 'has_license')
    fieldsets    = WaitlistBaseAdmin.fieldsets + (
        ('بيانات الخدمة', {
            'fields': ('service_types', 'service_description', 'target_audience', 'has_license'),
        }),
        ('الوثائق', {
            'fields': ('id_document', 'service_proof'),
        }),
    )
