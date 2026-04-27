"""
apps/advertising/admin.py

لوحة تحكم احترافية للنظام الإعلاني — بالعربية بالكامل.
"""

from django.contrib import admin, messages
from django.db.models import Count, Q
from django.urls import reverse
from django.utils.html import format_html
from django.utils.safestring import mark_safe

from .models import (
    AdCampaign,
    AdCreative,
    AdPlacement,
    AdTargeting,
    AdEvent,
    AdType,
    EventType,
)


# ═══════════════════════════════════════════════════════════
# Inlines
# ═══════════════════════════════════════════════════════════

class AdTargetingInline(admin.StackedInline):
    model = AdTargeting
    can_delete = False
    extra = 0
    verbose_name = 'الاستهداف'
    verbose_name_plural = 'الاستهداف'
    
    fieldsets = (
        ('اللغات والدول', {
            'fields': ('languages', 'countries'),
        }),
        ('الأجهزة وأنواع المستخدمين', {
            'fields': ('devices', 'user_types'),
        }),
        ('Frequency Capping (اختياري)', {
            'fields': ('max_views_per_user_day', 'max_views_per_session'),
            'classes': ('collapse',),
        }),
    )


class AdPlacementInline(admin.TabularInline):
    model = AdPlacement
    extra = 1
    verbose_name = 'موقع عرض'
    verbose_name_plural = 'مواقع العرض'
    
    fields = (
        'placement_key',
        'start_date',
        'end_date',
        'active_hours_start',
        'active_hours_end',
        'active_weekdays',
        'is_currently_active_display',
    )
    readonly_fields = ('is_currently_active_display',)
    
    @admin.display(description='نشط الآن؟')
    def is_currently_active_display(self, obj):
        if obj.pk and obj.is_currently_active():
            return mark_safe('<span style="color:green;font-weight:bold;">✓ نشط</span>')
        elif obj.pk:
            return mark_safe('<span style="color:#999;">— غير نشط</span>')
        return '—'


# ═══════════════════════════════════════════════════════════
# Filters مخصصة
# ═══════════════════════════════════════════════════════════

class IsCurrentlyActiveFilter(admin.SimpleListFilter):
    title = 'حالة العرض'
    parameter_name = 'is_running'
    
    def lookups(self, request, model_admin):
        return [
            ('running', 'يعرض الآن'),
            ('inactive', 'متوقف'),
            ('scheduled', 'مجدول مستقبلاً'),
            ('expired', 'منتهي'),
        ]
    
    def queryset(self, request, queryset):
        from django.utils import timezone
        now = timezone.now()
        
        if self.value() == 'running':
            return queryset.filter(
                is_active=True,
                placements__start_date__lte=now,
            ).filter(
                Q(placements__end_date__isnull=True) |
                Q(placements__end_date__gte=now)
            ).distinct()
        elif self.value() == 'inactive':
            return queryset.filter(is_active=False)
        elif self.value() == 'scheduled':
            return queryset.filter(
                is_active=True,
                placements__start_date__gt=now
            ).distinct()
        elif self.value() == 'expired':
            return queryset.filter(
                is_active=True,
                placements__end_date__lt=now
            ).distinct()
        return queryset


# ═══════════════════════════════════════════════════════════
# AdCampaign Admin
# ═══════════════════════════════════════════════════════════

@admin.register(AdCampaign)
class AdCampaignAdmin(admin.ModelAdmin):
    list_display  = (
        'name',
        'is_active',
        'creatives_count_display',
        'start_date',
        'end_date',
        'created_by',
        'created_at',
    )
    list_filter   = ('is_active', 'created_at')
    search_fields = ('name', 'description')
    list_editable = ('is_active',)
    readonly_fields = ('uid', 'created_at', 'updated_at', 'creatives_count_display')
    
    fieldsets = (
        ('المعلومات الأساسية', {
            'fields': ('name', 'description', 'is_active')
        }),
        ('الجدولة', {
            'fields': ('start_date', 'end_date')
        }),
        ('الميزانية (Phase 2)', {
            'fields': ('budget_total', 'budget_daily', 'currency'),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('uid', 'created_by', 'created_at', 'updated_at', 'creatives_count_display'),
            'classes': ('collapse',)
        }),
    )
    
    @admin.display(description='عدد الإعلانات')
    def creatives_count_display(self, obj):
        if not obj.pk:
            return '—'
        count = obj.creatives.count()
        url = reverse('admin:advertising_adcreative_changelist') + f'?campaign__id__exact={obj.pk}'
        return format_html('<a href="{}">{} إعلان</a>', url, count)
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


# ═══════════════════════════════════════════════════════════
# AdCreative Admin
# ═══════════════════════════════════════════════════════════

@admin.register(AdCreative)
class AdCreativeAdmin(admin.ModelAdmin):
    list_display = (
        'image_preview_small',
        'name',
        'ad_type_badge',
        'status_badge',
        'placements_summary',
        'priority',
        'stats_summary',
        'created_at',
    )
    list_filter = (
        IsCurrentlyActiveFilter,
        'ad_type',
        'is_active',
        'placements__placement_key',
        'created_at',
    )
    search_fields = ('name', 'image_alt_text')
    list_editable = ('priority',)
    
    readonly_fields = (
        'uid',
        'created_by',
        'created_at',
        'updated_at',
        'image_preview_large',
        'mobile_image_preview',
        'stats_card',
    )
    
    fieldsets = (
        ('المعلومات الأساسية', {
            'fields': (
                'name',
                'campaign',
                'ad_type',
                'is_active',
                'priority',
                'weight',
            )
        }),
        ('الصور', {
            'fields': (
                'image_desktop',
                'image_preview_large',
                'image_mobile',
                'mobile_image_preview',
                'image_alt_text',
            )
        }),
        ('المحتوى متعدد اللغات', {
            'fields': ('content',),
            'description': 'صيغة JSON: {"ar": {"title": "...", "description": "...", "button": "..."}, "en": {...}, "ms": {...}}'
        }),
        ('الرابط', {
            'fields': (
                'link_url',
                'link_target',
                'linked_hotel',
                'linked_package',
                'linked_agency',
            ),
        }),
        ('الإحصائيات', {
            'fields': ('stats_card',),
            'classes': ('collapse',)
        }),
        ('Audit', {
            'fields': ('uid', 'created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
        ('Phase 2 — البيلينج', {
            'fields': ('cost',),
            'classes': ('collapse',)
        }),
    )
    
    inlines = [AdTargetingInline, AdPlacementInline]
    actions = ['activate_creatives', 'deactivate_creatives', 'duplicate_creative']
    list_per_page = 25
    save_on_top = True
    
    @admin.display(description='صورة')
    def image_preview_small(self, obj):
        if obj.image_desktop:
            return format_html(
                '<img src="{}" style="width:80px;height:50px;object-fit:cover;border-radius:6px;border:1px solid #ddd;" />',
                obj.image_desktop.url
            )
        return mark_safe('<span style="color:#ccc;">— لا صورة —</span>')
    
    @admin.display(description='معاينة الصورة (سطح المكتب)')
    def image_preview_large(self, obj):
        if obj.image_desktop:
            return format_html(
                '<img src="{}" style="max-width:600px;max-height:400px;border-radius:8px;border:2px solid #ddd;" />',
                obj.image_desktop.url
            )
        return '— لم تُرفع صورة بعد —'
    
    @admin.display(description='معاينة صورة الهاتف')
    def mobile_image_preview(self, obj):
        if obj.image_mobile:
            return format_html(
                '<img src="{}" style="max-width:300px;max-height:500px;border-radius:8px;border:2px solid #ddd;" />',
                obj.image_mobile.url
            )
        return '— يستخدم صورة سطح المكتب —'
    
    @admin.display(description='النوع', ordering='ad_type')
    def ad_type_badge(self, obj):
        colors = {
            AdType.BANNER:        '#3B82F6',
            AdType.HERO_BANNER:   '#FF6B35',
            AdType.POPUP:         '#EF4444',
            AdType.FEATURED_CARD: '#10B981',
            AdType.CAROUSEL_ITEM: '#8B5CF6',
        }
        color = colors.get(obj.ad_type, '#6B7280')
        return format_html(
            '<span style="background:{};color:white;padding:3px 8px;border-radius:4px;font-size:11px;font-weight:600;">{}</span>',
            color,
            obj.get_ad_type_display()
        )
    
    @admin.display(description='الحالة')
    def status_badge(self, obj):
        if obj.is_active:
            return mark_safe(
                '<span style="background:#10B981;color:white;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;">نشط</span>'
            )
        return mark_safe(
            '<span style="background:#9CA3AF;color:white;padding:3px 10px;border-radius:12px;font-size:11px;">متوقف</span>'
        )
    
    @admin.display(description='المواقع')
    def placements_summary(self, obj):
        total = obj.placements.count()
        if total == 0:
            return mark_safe('<span style="color:#999;">لا مواقع</span>')
        active = sum(1 for p in obj.placements.all() if p.is_currently_active())
        return format_html(
            '<span style="background:#10B981;color:white;padding:2px 6px;border-radius:3px;font-size:10px;">{}/{}</span>',
            active, total
        )
    
    @admin.display(description='Views | Clicks | CTR')
    def stats_summary(self, obj):
        events = obj.events.aggregate(
            views=Count('id', filter=Q(event_type=EventType.VIEW)),
            clicks=Count('id', filter=Q(event_type=EventType.CLICK)),
        )
        views = events['views'] or 0
        clicks = events['clicks'] or 0
        ctr = (clicks / views * 100) if views > 0 else 0
        return format_html(
            '<span style="font-family:monospace;font-size:11px;">{} | {} | <b>{}%</b></span>',
            views, clicks, f'{ctr:.2f}'
        )
    
    @admin.display(description='ملخص الإحصائيات')
    def stats_card(self, obj):
        if not obj.pk:
            return '—'
        events = obj.events.aggregate(
            views=Count('id', filter=Q(event_type=EventType.VIEW)),
            clicks=Count('id', filter=Q(event_type=EventType.CLICK)),
            closes=Count('id', filter=Q(event_type=EventType.CLOSE)),
        )
        views = events['views'] or 0
        clicks = events['clicks'] or 0
        closes = events['closes'] or 0
        ctr = (clicks / views * 100) if views > 0 else 0
        return format_html(
            'مشاهدات: <b>{}</b> | نقرات: <b>{}</b> | إغلاق: <b>{}</b> | CTR: <b>{}%</b>',
            views, clicks, closes, f'{ctr:.2f}'
        )
    
    @admin.action(description='تفعيل الإعلانات المحددة')
    def activate_creatives(self, request, queryset):
        n = queryset.update(is_active=True)
        self.message_user(request, f'تم تفعيل {n} إعلان', messages.SUCCESS)
    
    @admin.action(description='إيقاف الإعلانات المحددة')
    def deactivate_creatives(self, request, queryset):
        n = queryset.update(is_active=False)
        self.message_user(request, f'تم إيقاف {n} إعلان', messages.WARNING)
    
    @admin.action(description='تكرار الإعلان (نسخة جديدة)')
    def duplicate_creative(self, request, queryset):
        for orig in queryset:
            new = AdCreative.objects.create(
                name=f'{orig.name} (نسخة)',
                campaign=orig.campaign,
                ad_type=orig.ad_type,
                content=orig.content,
                image_desktop=orig.image_desktop,
                image_mobile=orig.image_mobile,
                image_alt_text=orig.image_alt_text,
                link_url=orig.link_url,
                link_target=orig.link_target,
                linked_hotel=orig.linked_hotel,
                linked_package=orig.linked_package,
                linked_agency=orig.linked_agency,
                is_active=False,
                priority=orig.priority,
                weight=orig.weight,
                created_by=request.user,
            )
            try:
                AdTargeting.objects.create(
                    creative=new,
                    languages=orig.targeting.languages,
                    countries=orig.targeting.countries,
                    devices=orig.targeting.devices,
                    user_types=orig.targeting.user_types,
                    max_views_per_user_day=orig.targeting.max_views_per_user_day,
                    max_views_per_session=orig.targeting.max_views_per_session,
                )
            except AdTargeting.DoesNotExist:
                AdTargeting.objects.create(
                    creative=new,
                    languages=['all'],
                    countries=['all'],
                    devices=['mobile', 'desktop', 'tablet'],
                    user_types=['anonymous', 'tourist'],
                )
        self.message_user(request, f'تم تكرار {queryset.count()} إعلان', messages.SUCCESS)
    
    def save_model(self, request, obj, form, change):
        if not change:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)
    
    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        creative = form.instance
        if not hasattr(creative, 'targeting'):
            AdTargeting.objects.create(
                creative=creative,
                languages=['all'],
                countries=['all'],
                devices=['mobile', 'desktop', 'tablet'],
                user_types=['anonymous', 'tourist'],
            )


# ═══════════════════════════════════════════════════════════
# AdEvent Admin (read-only)
# ═══════════════════════════════════════════════════════════

@admin.register(AdEvent)
class AdEventAdmin(admin.ModelAdmin):
    list_display = (
        'creative',
        'event_type_badge',
        'placement_key',
        'language',
        'country',
        'device_type',
        'created_at',
    )
    list_filter = (
        'event_type',
        'placement_key',
        'device_type',
        'language',
        'country',
        'created_at',
    )
    search_fields = ('creative__name', 'session_id')
    readonly_fields = (
        'uid', 'creative', 'placement_key', 'event_type',
        'user', 'session_id', 'ip_hash',
        'language', 'country', 'device_type', 'user_agent', 'referrer',
        'created_at',
    )
    date_hierarchy = 'created_at'
    
    @admin.display(description='النوع')
    def event_type_badge(self, obj):
        colors = {
            EventType.VIEW:    '#3B82F6',
            EventType.CLICK:   '#10B981',
            EventType.CLOSE:   '#EF4444',
            EventType.DISMISS: '#6B7280',
        }
        color = colors.get(obj.event_type, '#6B7280')
        return format_html(
            '<span style="background:{};color:white;padding:2px 8px;border-radius:10px;font-size:11px;">{}</span>',
            color,
            obj.get_event_type_display()
        )
    
    def has_add_permission(self, request):
        return False
    
    def has_change_permission(self, request, obj=None):
        return False
