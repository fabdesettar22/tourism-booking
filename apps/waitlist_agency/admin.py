# apps/waitlist_agency/admin.py

from django.contrib import admin
from django.utils.html import format_html
from .models import AgencyWaitlist


@admin.register(AgencyWaitlist)
class AgencyWaitlistAdmin(admin.ModelAdmin):
    """
    لوحة إدارة Agency Waitlist.
    تعرض السجلات مع معاينة الوثائق وإمكانية الموافقة/الرفض السريع.
    """

    list_display = (
        'ref_number',
        'name',
        'city',
        'email',
        'status_badge',
        'email_sent_badge',
        'created_at',
    )

    list_filter = (
        'status',
        'email_sent',
        'country',
        'how_did_you_hear',
        'created_at',
    )

    search_fields = (
        'ref_number',
        'name',
        'registration_number',
        'email',
        'phone',
        'contact_person_name',
        'city',
    )

    readonly_fields = (
        'id',
        'ref_number',
        'email_sent',
        'ip_address',
        'device_type',
        'created_at',
        'updated_at',
        'trade_license_preview',
        'owner_id_preview',
        'logo_preview',
    )

    fieldsets = (
        ('🔖 معرّفات', {
            'fields': ('id', 'ref_number', 'status', 'email_sent')
        }),
        ('🏢 معلومات الوكالة', {
            'fields': (
                'name', 'registration_number',
                'country', 'city', 'address', 'website',
            )
        }),
        ('📞 التواصل', {
            'fields': ('email', 'phone')
        }),
        ('👤 الشخص المسؤول', {
            'fields': (
                'contact_person_name',
                'contact_person_position',
                'contact_person_phone',
            )
        }),
        ('📎 الوثائق', {
            'fields': (
                'trade_license', 'trade_license_preview',
                'owner_id_document', 'owner_id_preview',
                'logo', 'logo_preview',
            )
        }),
        ('📊 مصدر التسجيل', {
            'fields': (
                'how_did_you_hear',
                'utm_source', 'utm_medium', 'utm_campaign',
            ),
            'classes': ('collapse',)
        }),
        ('🔐 بيانات تقنية', {
            'fields': ('ip_address', 'device_type', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('📝 ملاحظات', {
            'fields': ('notes',)
        }),
    )

    list_per_page = 50
    date_hierarchy = 'created_at'
    ordering = ('-created_at',)

    actions = [
        'mark_as_contacted',
        'mark_as_approved',
        'mark_as_rejected',
    ]

    # ── Custom Display Methods ────────────────────────────

    @admin.display(description='الحالة', ordering='status')
    def status_badge(self, obj):
        colors = {
            'PENDING':   '#f59e0b',
            'CONTACTED': '#3b82f6',
            'APPROVED':  '#10b981',
            'REJECTED':  '#ef4444',
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background:{};color:white;padding:3px 10px;'
            'border-radius:10px;font-size:11px;font-weight:bold;">{}</span>',
            color,
            obj.get_status_display()
        )

    @admin.display(description='الإيميل', ordering='email_sent', boolean=True)
    def email_sent_badge(self, obj):
        return obj.email_sent

    # ── Document Previews ─────────────────────────────────

    @admin.display(description='معاينة الرخصة التجارية')
    def trade_license_preview(self, obj):
        if not obj.trade_license:
            return '-'
        url = obj.trade_license.url
        name = obj.trade_license.name.split('/')[-1]
        return format_html(
            '<a href="{}" target="_blank" style="color:#FF6B35;font-weight:bold;">'
            '📄 عرض الملف ({})</a>',
            url, name
        )

    @admin.display(description='معاينة هوية المالك')
    def owner_id_preview(self, obj):
        if not obj.owner_id_document:
            return '-'
        url = obj.owner_id_document.url
        name = obj.owner_id_document.name.split('/')[-1]
        return format_html(
            '<a href="{}" target="_blank" style="color:#FF6B35;font-weight:bold;">'
            '🆔 عرض الملف ({})</a>',
            url, name
        )

    @admin.display(description='معاينة الشعار')
    def logo_preview(self, obj):
        if not obj.logo:
            return '-'
        return format_html(
            '<img src="{}" style="max-width:150px;max-height:150px;'
            'border-radius:8px;border:1px solid #ddd;"/>',
            obj.logo.url
        )

    # ── Bulk Actions ──────────────────────────────────────

    @admin.action(description='✉️ تحديد الحالة إلى: تم التواصل')
    def mark_as_contacted(self, request, queryset):
        updated = queryset.update(status='CONTACTED')
        self.message_user(
            request,
            f'تم تحديث {updated} وكالة إلى حالة "تم التواصل".'
        )

    @admin.action(description='✅ تحديد الحالة إلى: موافَق عليه')
    def mark_as_approved(self, request, queryset):
        updated = queryset.update(status='APPROVED')
        self.message_user(
            request,
            f'تمت الموافقة على {updated} وكالة.'
        )

    @admin.action(description='❌ تحديد الحالة إلى: مرفوض')
    def mark_as_rejected(self, request, queryset):
        updated = queryset.update(status='REJECTED')
        self.message_user(
            request,
            f'تم رفض {updated} وكالة.'
        )
