# apps/accounts/admin.py

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from django.utils.translation import gettext_lazy as _
from .models import User, Agency


@admin.register(Agency)
class AgencyAdmin(admin.ModelAdmin):
    list_display  = ['name', 'email', 'phone', 'currency', 'commission_rate', 'is_active', 'created_at']
    list_filter   = ['is_active', 'currency', 'status', 'agency_type']
    search_fields = ['name', 'email', 'phone', 'registration_number']
    list_editable = ['is_active', 'commission_rate']
    readonly_fields = ['created_at', 'updated_at', 'approved_at']

    fieldsets = (
        ('المعلومات الأساسية', {
            'fields': ('name', 'name_en', 'logo', 'agency_type', 'registration_number')
        }),
        ('معلومات الاتصال', {
            'fields': ('email', 'phone', 'address', 'website', 'country', 'city')
        }),
        ('جهة الاتصال', {
            'fields': ('contact_person_name', 'contact_person_position', 'contact_person_phone')
        }),
        ('الإعدادات المالية', {
            'fields': ('currency', 'commission_rate')
        }),
        ('الحالة والاعتماد', {
            'fields': ('status', 'is_active', 'rejection_reason', 'approved_at', 'approved_by')
        }),
        ('الوثائق', {
            'fields': ('trade_license', 'tax_certificate', 'owner_id_document'),
            'classes': ('collapse',)
        }),
        ('التواريخ', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display  = ['username', 'email', 'first_name', 'last_name', 'role', 'agency', 'is_active']
    list_filter   = ['role', 'is_active', 'is_staff', 'agency']
    search_fields = ['username', 'email', 'phone', 'first_name', 'last_name']
    list_editable = ['role']

    # ترجمة fieldsets المدمجة من Django + إضافة المخصصة
    fieldsets = (
        (None, {
            'fields': ('username', 'password')
        }),
        ('المعلومات الشخصية', {
            'fields': ('first_name', 'last_name', 'email', 'phone', 'avatar')
        }),
        ('الدور والوكالة', {
            'fields': ('role', 'agency')
        }),
        ('الصلاحيات', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions'),
            'classes': ('collapse',)
        }),
        ('تواريخ مهمة', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )

    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role'),
        }),
    )
