"""
apps/advertising/serializers.py

Serializers للـ API.

الفئات:
- AdCreativePublicSerializer  : للعرض في frontend (محسّن للأداء)
- AdEventCreateSerializer     : لتسجيل event من frontend
- AdCreativeAdminSerializer   : للأدمن (كل الحقول)
"""

from rest_framework import serializers

from .models import (
    AdCreative,
    AdEvent,
    EventType,
    Placement,
)


# ═══════════════════════════════════════════════════════════
# Public Serializer (للزوار في frontend)
# ═══════════════════════════════════════════════════════════

class AdCreativePublicSerializer(serializers.ModelSerializer):
    """
    Serializer مبسّط للعرض في frontend.
    
    يحوي:
    - الحقول الأساسية فقط (لا audit, لا internal)
    - المحتوى باللغة المطلوبة (فلترة ذكية)
    - رابط نهائي مُحسوب
    - URLs كاملة للصور
    
    Usage:
        serializer = AdCreativePublicSerializer(
            ad,
            context={'request': request, 'language': 'ar'}
        )
    """
    
    # Identifiers
    uid = serializers.UUIDField(read_only=True)
    
    # Type
    ad_type = serializers.CharField(read_only=True)
    
    # Computed multilingual fields
    title       = serializers.SerializerMethodField()
    description = serializers.SerializerMethodField()
    button_text = serializers.SerializerMethodField()
    
    # Images (full URLs)
    image_desktop = serializers.SerializerMethodField()
    image_mobile  = serializers.SerializerMethodField()
    image_alt_text = serializers.CharField(read_only=True)
    
    # Link
    link        = serializers.SerializerMethodField()
    link_target = serializers.CharField(read_only=True)
    
    # Linked entities (basic info only)
    linked_hotel_id   = serializers.SerializerMethodField()
    linked_package_id = serializers.SerializerMethodField()
    linked_agency_id  = serializers.SerializerMethodField()
    
    # Display config
    priority = serializers.IntegerField(read_only=True)

    class Meta:
        model = AdCreative
        fields = (
            'uid',
            'ad_type',
            'title',
            'description',
            'button_text',
            'image_desktop',
            'image_mobile',
            'image_alt_text',
            'link',
            'link_target',
            'linked_hotel_id',
            'linked_package_id',
            'linked_agency_id',
            'priority',
        )
    
    # ─── Helpers ─────────────────────────────────────────
    
    def _get_lang(self) -> str:
        """يُرجع اللغة من context أو من request."""
        ctx = self.context or {}
        if 'language' in ctx:
            return ctx['language']
        request = ctx.get('request')
        if request:
            return request.GET.get('lang', 'en')
        return 'en'
    
    def _absolute_url(self, image_field) -> str:
        """يُرجع URL كاملة للصورة (مع scheme/host)."""
        if not image_field:
            return ''
        try:
            url = image_field.url
        except Exception:
            return ''
        request = self.context.get('request')
        if request and not url.startswith('http'):
            return request.build_absolute_uri(url)
        return url
    
    # ─── SerializerMethodFields ──────────────────────────
    
    def get_title(self, obj) -> str:
        return obj.get_content(lang=self._get_lang(), field='title')
    
    def get_description(self, obj) -> str:
        return obj.get_content(lang=self._get_lang(), field='description')
    
    def get_button_text(self, obj) -> str:
        return obj.get_content(lang=self._get_lang(), field='button')
    
    def get_image_desktop(self, obj) -> str:
        return self._absolute_url(obj.image_desktop)
    
    def get_image_mobile(self, obj) -> str:
        # Fallback إلى desktop إن لم تكن mobile موجودة
        if obj.image_mobile:
            return self._absolute_url(obj.image_mobile)
        return self._absolute_url(obj.image_desktop)
    
    def get_link(self, obj) -> str:
        return obj.get_link()
    
    def get_linked_hotel_id(self, obj):
        return obj.linked_hotel_id if obj.linked_hotel_id else None
    
    def get_linked_package_id(self, obj):
        return obj.linked_package_id if obj.linked_package_id else None
    
    def get_linked_agency_id(self, obj):
        return obj.linked_agency_id if obj.linked_agency_id else None


# ═══════════════════════════════════════════════════════════
# Event Tracking Serializer
# ═══════════════════════════════════════════════════════════

class AdEventCreateSerializer(serializers.Serializer):
    """
    لتسجيل event (view/click/close/dismiss) من frontend.
    
    Note: نستخدم Serializer (لا ModelSerializer) لأن AdEvent
          فيه حقول حسّاسة (ip_hash) لا نسمح بإرسالها من العميل.
    """
    
    event_type    = serializers.ChoiceField(choices=EventType.choices)
    placement_key = serializers.ChoiceField(choices=Placement.choices)
    session_id    = serializers.CharField(max_length=64, required=False, allow_blank=True)
    language      = serializers.CharField(max_length=2, required=False, allow_blank=True)
    country       = serializers.CharField(max_length=2, required=False, allow_blank=True)
    device_type   = serializers.CharField(max_length=10, required=False, allow_blank=True)
    
    def validate_session_id(self, value):
        """نقبل أي string لكن نُحدّ الحجم."""
        return (value or '')[:64]


# ═══════════════════════════════════════════════════════════
# Admin Serializer (للداشبورد المستقبلي)
# ═══════════════════════════════════════════════════════════

class AdCreativeAdminSerializer(serializers.ModelSerializer):
    """
    Serializer للأدمن — يكشف كل الحقول.
    سيُستخدم في Phase 2 لـ admin React dashboard.
    """
    
    targeting_summary = serializers.SerializerMethodField()
    placements_count  = serializers.SerializerMethodField()
    stats             = serializers.SerializerMethodField()
    
    class Meta:
        model = AdCreative
        fields = (
            'id',
            'uid',
            'name',
            'campaign',
            'ad_type',
            'content',
            'image_desktop',
            'image_mobile',
            'image_alt_text',
            'link_url',
            'link_target',
            'linked_hotel',
            'linked_package',
            'linked_agency',
            'is_active',
            'priority',
            'weight',
            'cost',
            'created_by',
            'created_at',
            'updated_at',
            'targeting_summary',
            'placements_count',
            'stats',
        )
        read_only_fields = ('uid', 'created_by', 'created_at', 'updated_at')
    
    def get_targeting_summary(self, obj) -> dict:
        try:
            t = obj.targeting
            return {
                'languages': t.languages or [],
                'countries': t.countries or [],
                'devices': t.devices or [],
                'user_types': t.user_types or [],
                'max_views_per_user_day': t.max_views_per_user_day,
                'max_views_per_session': t.max_views_per_session,
            }
        except Exception:
            return {}
    
    def get_placements_count(self, obj) -> int:
        return obj.placements.count()
    
    def get_stats(self, obj) -> dict:
        from django.db.models import Count, Q
        events = obj.events.aggregate(
            views=Count('id', filter=Q(event_type=EventType.VIEW)),
            clicks=Count('id', filter=Q(event_type=EventType.CLICK)),
        )
        views = events['views'] or 0
        clicks = events['clicks'] or 0
        ctr = (clicks / views * 100) if views > 0 else 0
        return {
            'views': views,
            'clicks': clicks,
            'ctr': round(ctr, 2),
        }
