"""
apps/advertising/views.py

API endpoints للنظام الإعلاني.

Endpoints:
- GET  /api/v1/advertising/ads/        - قائمة الإعلانات النشطة
- POST /api/v1/advertising/ads/{uid}/track/ - تسجيل event
- GET  /api/v1/advertising/placements/ - قائمة الـ placements (للأدمن)

Permissions:
- GET ads + POST track : عام (AllowAny)
- GET placements       : للأدمن فقط
"""

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAdminUser
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from django.shortcuts import get_object_or_404

from .models import (

    AdCreative,
    Placement,
    AdType,
    DeviceType,
    UserType,
    AdEvent,
)
from .serializers import (
    AdCreativePublicSerializer,
    AdEventCreateSerializer,
)
from .services import (
    get_active_ads_for_placement,
    track_event,
    detect_device_type,
    detect_user_type,
    check_frequency_cap,
)


# ═══════════════════════════════════════════════════════════
# Throttling: حدود معدّل الطلبات لمنع spam
# ═══════════════════════════════════════════════════════════

class AdEventThrottle(AnonRateThrottle):
    """حد لتسجيل events: 100/دقيقة للزائر المجهول."""
    scope = 'ad_events'
    rate = '100/min'


# ═══════════════════════════════════════════════════════════
# 1. GET /api/v1/advertising/ads/
#    قائمة الإعلانات النشطة للمكان والاستهداف المطلوب
# ═══════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def list_active_ads(request):
    """
    الإعلانات النشطة لمكان معين.
    
    Query params:
        placement (required) : مفتاح الموقع (HOME_HERO_TOP, ...)
        lang (optional)      : اللغة (ar/en/ms) — افتراضي en
        country (optional)   : رمز الدولة (MY, SA, ...) — يُكشف تلقائياً إن أُمكن
        limit (optional)     : عدد الإعلانات (افتراضي 1, max 10)
    
    Response:
        200: list of AdCreativePublicSerializer
        400: placement مفقود أو غير صحيح
    
    Example:
        GET /api/v1/advertising/ads/?placement=HOME_HERO_TOP&lang=ar
    """
    
    # ─── 1. Parse query params ─────────────────────────
    placement_key = request.GET.get('placement', '').strip().upper()
    if not placement_key:
        return Response(
            {'error': 'parameter "placement" required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    valid_placements = [p[0] for p in Placement.choices]
    if placement_key not in valid_placements:
        return Response(
            {
                'error': f'invalid placement: {placement_key}',
                'valid_placements': valid_placements,
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    language = request.GET.get('lang', 'en').strip().lower()[:2]
    country = request.GET.get('country', '').strip().upper()[:2] or None
    
    # Limit
    try:
        limit = int(request.GET.get('limit', 1))
        limit = max(1, min(limit, 10))
    except (ValueError, TypeError):
        limit = 1
    
    # ─── 2. Detect device + user type ──────────────────
    user_agent = request.META.get('HTTP_USER_AGENT', '')
    device_type = detect_device_type(user_agent)
    user_type = detect_user_type(request.user)
    
    # ─── 3. Get matching ads ───────────────────────────
    ads = get_active_ads_for_placement(
        placement_key=placement_key,
        language=language,
        country=country,
        device_type=device_type,
        user_type=user_type,
        limit=limit,
    )
    
    # ─── 4. Serialize ──────────────────────────────────
    serializer = AdCreativePublicSerializer(
        ads,
        many=True,
        context={
            'request': request,
            'language': language,
        }
    )
    
    return Response({
        'placement': placement_key,
        'language': language,
        'count': len(ads),
        'ads': serializer.data,
    })


# ═══════════════════════════════════════════════════════════
# 2. POST /api/v1/advertising/ads/{uid}/track/
#    تسجيل event (view/click/close/dismiss)
# ═══════════════════════════════════════════════════════════

@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([AdEventThrottle])
def track_ad_event(request, creative_uid):
    """
    تسجيل حدث على إعلان.
    
    Args:
        creative_uid (UUID): معرّف الإعلان
    
    Body:
        {
            "event_type": "VIEW" | "CLICK" | "CLOSE" | "DISMISS",
            "placement_key": "HOME_HERO_TOP",
            "session_id": "uuid-string",  // optional
            "language": "ar",              // optional
            "country": "MY",                // optional
            "device_type": "mobile"         // optional, auto-detected
        }
    
    Response:
        201: { "tracked": true, "event_id": "..." }
        400: validation error
        404: creative not found
    """
    
    # ─── 1. التحقق من وجود الإعلان ──────────────────────
    try:
        creative = AdCreative.objects.get(uid=creative_uid)
    except AdCreative.DoesNotExist:
        return Response(
            {'error': 'إعلان غير موجود'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    # ─── 2. التحقق من البيانات ──────────────────────────
    serializer = AdEventCreateSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )
    
    data = serializer.validated_data
    
    # ─── 3. تسجيل الحدث ────────────────────────────────
    event = track_event(
        creative=creative,
        event_type=data['event_type'],
        placement_key=data['placement_key'],
        request=request,
        user=request.user,
        session_id=data.get('session_id', ''),
        language=data.get('language', ''),
        country=data.get('country', ''),
        device_type=data.get('device_type', ''),
    )
    
    if event is None:
        return Response(
            {'error': 'فشل تسجيل الحدث'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
    
    return Response(
        {
            'tracked': True,
            'event_id': str(event.uid),
            'event_type': event.event_type,
        },
        status=status.HTTP_201_CREATED
    )


# ═══════════════════════════════════════════════════════════
# 3. GET /api/v1/advertising/placements/
#    قائمة الـ placements (للأدمن - مفيد للـ frontend)
# ═══════════════════════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def list_placements(request):
    """
    قائمة الـ placements المتاحة + الـ ad types.
    
    مفيد للـ frontend ليعرف ما هي الأماكن الممكنة.
    
    Response:
        200: {
            "placements": [{key, label}],
            "ad_types": [{key, label}],
            "device_types": [{key, label}],
            "user_types": [{key, label}],
        }
    """
    
    return Response({
        'placements': [
            {'key': key, 'label': label}
            for key, label in Placement.choices
        ],
        'ad_types': [
            {'key': key, 'label': label}
            for key, label in AdType.choices
        ],
        'device_types': [
            {'key': key, 'label': label}
            for key, label in DeviceType.choices
        ],
        'user_types': [
            {'key': key, 'label': label}
            for key, label in UserType.choices
        ],
    })


# ═══════════════════════════════════════════════════════════
# ADMIN ENDPOINTS (CRUD للأدمن فقط)
# ═══════════════════════════════════════════════════════════

from rest_framework.permissions import IsAdminUser
from .models import AdTargeting, AdPlacement
from .serializers import AdCreativeAdminSerializer
from django.utils import timezone


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_list_ads(request):
    """قائمة كل الإعلانات (للأدمن)."""
    qs = AdCreative.objects.select_related('targeting').prefetch_related('placements').order_by('-created_at')
    serializer = AdCreativeAdminSerializer(qs, many=True, context={'request': request})
    return Response({
        'count': qs.count(),
        'ads': serializer.data,
    })


def _parse_json_field(data, field, default=None):
    """يقرأ حقل JSON من FormData أو dict."""
    import json
    value = data.get(field)
    if value is None:
        return default
    if isinstance(value, (list, dict)):
        return value
    if isinstance(value, str):
        try:
            return json.loads(value)
        except (json.JSONDecodeError, ValueError):
            return default
    return value


def _parse_bool(value):
    """يحول 'true'/'false' string إلى bool."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    return bool(value)


def _parse_int(value, default=None):
    """يحول string إلى int."""
    if value is None or value == '':
        return default
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_create_ad(request):
    """إنشاء إعلان جديد مع targeting + placement."""
    data = request.data
    
    # تحقق أساسي
    if not data.get('name'):
        return Response({'error': 'name مطلوب'}, status=status.HTTP_400_BAD_REQUEST)
    if not data.get('placement_key'):
        return Response({'error': 'placement_key مطلوب'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        # الإعلان نفسه
        ad = AdCreative.objects.create(
            name=data.get('name'),
            ad_type=data.get('ad_type', 'BANNER'),
            content=_parse_json_field(data, 'content', {}),
            image_alt_text=data.get('image_alt_text', ''),
            link_url=data.get('link_url', ''),
            link_target=data.get('link_target', 'SAME_TAB'),
            is_active=_parse_bool(data.get('is_active', False)),
            priority=_parse_int(data.get('priority'), 50),
            weight=_parse_int(data.get('weight'), 1),
            created_by=request.user,
        )
        
        # حفظ الصورة إن وُجدت
        if 'image_desktop' in request.FILES:
            ad.image_desktop = request.FILES['image_desktop']
        if 'image_mobile' in request.FILES:
            ad.image_mobile = request.FILES['image_mobile']
        ad.save()
        
        # Placement
        AdPlacement.objects.create(
            creative=ad,
            placement_key=data.get('placement_key'),
            start_date=data.get('start_date') or timezone.now(),
            end_date=data.get('end_date') or None,
        )
        
        # Targeting (default: للجميع)
        AdTargeting.objects.create(
            creative=ad,
            languages=_parse_json_field(data, 'languages', ['all']),
            countries=_parse_json_field(data, 'countries', ['all']),
            devices=_parse_json_field(data, 'devices', ['mobile', 'desktop', 'tablet']),
            user_types=_parse_json_field(data, 'user_types', ['anonymous', 'tourist', 'agency', 'supplier', 'admin']),
            max_views_per_user_day=_parse_int(data.get('max_views_per_user_day')),
            max_views_per_session=_parse_int(data.get('max_views_per_session')),
        )
        
        serializer = AdCreativeAdminSerializer(ad, context={'request': request})
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def admin_ad_detail(request, ad_id):
    """تفاصيل / تعديل / حذف إعلان."""
    try:
        ad = AdCreative.objects.select_related('targeting').prefetch_related('placements').get(id=ad_id)
    except AdCreative.DoesNotExist:
        return Response({'error': 'إعلان غير موجود'}, status=status.HTTP_404_NOT_FOUND)
    
    if request.method == 'GET':
        serializer = AdCreativeAdminSerializer(ad, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'PATCH':
        data = request.data
        
        # تحديث الحقول الأساسية
        if 'name' in data: ad.name = data['name']
        if 'ad_type' in data: ad.ad_type = data['ad_type']
        if 'content' in data: ad.content = _parse_json_field(data, 'content', ad.content)
        if 'image_alt_text' in data: ad.image_alt_text = data['image_alt_text']
        if 'link_url' in data: ad.link_url = data['link_url']
        if 'link_target' in data: ad.link_target = data['link_target']
        if 'is_active' in data: ad.is_active = _parse_bool(data['is_active'])
        if 'priority' in data: ad.priority = _parse_int(data['priority'], ad.priority)
        if 'weight' in data: ad.weight = _parse_int(data['weight'], ad.weight)
        
        # تحديث الصور
        if 'image_desktop' in request.FILES:
            ad.image_desktop = request.FILES['image_desktop']
        if 'image_mobile' in request.FILES:
            ad.image_mobile = request.FILES['image_mobile']
        
        ad.save()
        
        # تحديث Placement
        if 'placement_key' in data:
            placement = ad.placements.first()
            if placement:
                placement.placement_key = data['placement_key']
                if data.get('start_date'):
                    placement.start_date = data['start_date']
                if 'end_date' in data:
                    placement.end_date = data.get('end_date') or None
                placement.save()
            else:
                AdPlacement.objects.create(
                    creative=ad,
                    placement_key=data['placement_key'],
                    start_date=data.get('start_date') or timezone.now(),
                    end_date=data.get('end_date') or None,
                )
        
        # تحديث Targeting
        try:
            targeting = ad.targeting
            if 'languages' in data:
                targeting.languages = _parse_json_field(data, 'languages', targeting.languages)
            if 'countries' in data:
                targeting.countries = _parse_json_field(data, 'countries', targeting.countries)
            if 'devices' in data:
                targeting.devices = _parse_json_field(data, 'devices', targeting.devices)
            if 'user_types' in data:
                targeting.user_types = _parse_json_field(data, 'user_types', targeting.user_types)
            if 'max_views_per_user_day' in data:
                targeting.max_views_per_user_day = _parse_int(data['max_views_per_user_day'])
            if 'max_views_per_session' in data:
                targeting.max_views_per_session = _parse_int(data['max_views_per_session'])
            targeting.save()
        except AdTargeting.DoesNotExist:
            AdTargeting.objects.create(
                creative=ad,
                languages=data.get('languages', ['all']),
                countries=data.get('countries', ['all']),
                devices=data.get('devices', ['mobile', 'desktop', 'tablet']),
                user_types=data.get('user_types', ['anonymous', 'tourist', 'agency', 'supplier', 'admin']),
            )
        
        serializer = AdCreativeAdminSerializer(ad, context={'request': request})
        return Response(serializer.data)
    
    elif request.method == 'DELETE':
        ad.delete()
        return Response({'deleted': True}, status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_toggle_ad(request, ad_id):
    """تبديل حالة الإعلان (تفعيل/إيقاف)."""
    try:
        ad = AdCreative.objects.get(id=ad_id)
        ad.is_active = not ad.is_active
        ad.save()
        return Response({
            'id': ad.id,
            'is_active': ad.is_active,
        })
    except AdCreative.DoesNotExist:
        return Response({'error': 'إعلان غير موجود'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_stats(request):
    """إحصائيات عامة للأدمن."""
    from django.db.models import Count, Q
    from datetime import timedelta
    
    now = timezone.now()
    
    # عدد الإعلانات
    total_ads = AdCreative.objects.count()
    active_ads = AdCreative.objects.filter(is_active=True).count()
    
    # الإحصائيات (آخر 30 يوم)
    since_30d = now - timedelta(days=30)
    events = AdEvent.objects.filter(created_at__gte=since_30d).aggregate(
        views=Count('id', filter=Q(event_type='VIEW')),
        clicks=Count('id', filter=Q(event_type='CLICK')),
        closes=Count('id', filter=Q(event_type='CLOSE')),
    )
    views = events['views'] or 0
    clicks = events['clicks'] or 0
    ctr = (clicks / views * 100) if views > 0 else 0
    
    # توزيع حسب النوع
    by_type = list(
        AdCreative.objects.values('ad_type').annotate(count=Count('id')).order_by('-count')
    )
    
    # أفضل 5 إعلانات أداءً (آخر 30 يوم)
    top_ads = []
    for ad in AdCreative.objects.filter(is_active=True)[:20]:
        ad_views = ad.events.filter(
            created_at__gte=since_30d, event_type='VIEW'
        ).count()
        ad_clicks = ad.events.filter(
            created_at__gte=since_30d, event_type='CLICK'
        ).count()
        if ad_views > 0:
            top_ads.append({
                'id': ad.id,
                'name': ad.name,
                'ad_type': ad.ad_type,
                'views': ad_views,
                'clicks': ad_clicks,
                'ctr': round((ad_clicks / ad_views * 100) if ad_views > 0 else 0, 2),
            })
    top_ads.sort(key=lambda x: -x['views'])
    
    return Response({
        'total_ads': total_ads,
        'active_ads': active_ads,
        'inactive_ads': total_ads - active_ads,
        'period_days': 30,
        'views': views,
        'clicks': clicks,
        'closes': events['closes'] or 0,
        'ctr': round(ctr, 2),
        'by_type': by_type,
        'top_ads': top_ads[:5],
    })
