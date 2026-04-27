"""
apps/advertising/services.py

منطق الأعمال للنظام الإعلاني.

الخدمات الرئيسية:
- get_active_ads_for_placement() : اختيار الإعلانات المناسبة لكل زائر
- track_event()                  : تسجيل مشاهدة/نقرة
- detect_device_type()           : كشف نوع الجهاز من User Agent
- check_frequency_cap()          : فحص حد التكرار

الفلسفة:
- كل المنطق هنا (لا في views أو serializers)
- استعلامات محسنة (select_related/prefetch)
- آمن من None values
- سجل أحداث = sync (Phase 1) — Async في Phase 2
"""

import random
from typing import Optional

from django.db import transaction
from django.db.models import Q, Prefetch
from django.utils import timezone

from .models import (
    AdCreative,
    AdPlacement,
    AdEvent,
    EventType,
    DeviceType,
    UserType,
    Placement,
)


# ═══════════════════════════════════════════════════════════
# Selection: اختيار الإعلانات للعرض
# ═══════════════════════════════════════════════════════════

def get_active_ads_for_placement(
    *,
    placement_key: str,
    language: str = 'en',
    country: Optional[str] = None,
    device_type: str = DeviceType.DESKTOP,
    user_type: str = UserType.ANONYMOUS,
    limit: int = 1,
) -> list[AdCreative]:
    """
    إرجاع الإعلانات النشطة لمكان معين، مرتبة حسب priority + weighted random.
    
    الفلترة بالترتيب:
    1. is_active=True على الـ creative
    2. placement_key مطابق
    3. تواريخ start_date / end_date
    4. Dayparting (active_hours)
    5. أيام الأسبوع
    6. Targeting: language, country, device, user_type
    
    Returns:
        list of AdCreative (مع targeting و placements مُحمَّلة مسبقاً)
    """
    
    # تطبيع المدخلات
    placement_key = placement_key.upper().strip()
    language = (language or 'en').lower().strip()[:2]
    country = country.upper().strip()[:2] if country else None
    device_type = (device_type or DeviceType.DESKTOP).lower().strip()
    user_type = (user_type or UserType.ANONYMOUS).lower().strip()
    
    # تحقق من صحة placement_key
    valid_placements = [p[0] for p in Placement.choices]
    if placement_key not in valid_placements:
        return []
    
    now = timezone.now()
    today_weekday = now.weekday()  # 0=Mon, 6=Sun
    current_time = now.time()
    
    # ─── Query أولي ─────────────────────────────────────
    # نُحضّر بـ select_related/prefetch لتجنب N+1
    qs = (
        AdCreative.objects
        .filter(
            is_active=True,
            placements__placement_key=placement_key,
            placements__start_date__lte=now,
        )
        .filter(
            Q(placements__end_date__isnull=True) |
            Q(placements__end_date__gte=now)
        )
        .select_related(
            'targeting',
            'campaign',
            'linked_hotel',
            'linked_package',
            'linked_agency',
        )
        .prefetch_related(
            Prefetch(
                'placements',
                queryset=AdPlacement.objects.filter(placement_key=placement_key),
                to_attr='active_placements_list',
            )
        )
        .distinct()
    )
    
    # ─── Filter في Python (لأن الفلترة معقدة على JSON) ──
    # ملاحظة: يمكن نقلها إلى DB Query لكن سيُعقّد الكود.
    #         في Phase 1، Python filter كافٍ (الإعلانات قليلة العدد).
    
    valid_ads = []
    for ad in qs:
        if not _ad_passes_filters(
            ad,
            placement_key=placement_key,
            current_time=current_time,
            today_weekday=today_weekday,
            language=language,
            country=country,
            device_type=device_type,
            user_type=user_type,
        ):
            continue
        valid_ads.append(ad)
    
    # ─── Sort by priority DESC ──────────────────────────
    valid_ads.sort(key=lambda a: -a.priority)
    
    # ─── Weighted Random Selection ──────────────────────
    # عند تساوي الأولوية، نختار بالـ weight
    if not valid_ads:
        return []
    
    if limit >= len(valid_ads):
        return valid_ads
    
    # نُجمّع الإعلانات بنفس الـ priority
    grouped = {}
    for ad in valid_ads:
        grouped.setdefault(ad.priority, []).append(ad)
    
    selected = []
    for priority in sorted(grouped.keys(), reverse=True):
        if len(selected) >= limit:
            break
        ads_in_group = grouped[priority]
        weights = [ad.weight or 1 for ad in ads_in_group]
        
        # نختار weighted random من المجموعة
        remaining = limit - len(selected)
        if remaining >= len(ads_in_group):
            selected.extend(ads_in_group)
        else:
            chosen = _weighted_sample(ads_in_group, weights, remaining)
            selected.extend(chosen)
    
    return selected[:limit]


def _ad_passes_filters(
    ad: AdCreative,
    *,
    placement_key: str,
    current_time,
    today_weekday: int,
    language: str,
    country: Optional[str],
    device_type: str,
    user_type: str,
) -> bool:
    """يفحص كل شروط الفلترة لإعلان واحد."""
    
    # ─── 1. Placement scheduling ────────────────────────
    placement = next(
        (p for p in getattr(ad, 'active_placements_list', [])
         if p.placement_key == placement_key),
        None
    )
    if not placement:
        return False
    
    # Dayparting (ساعات اليوم)
    if placement.active_hours_start and current_time < placement.active_hours_start:
        return False
    if placement.active_hours_end and current_time > placement.active_hours_end:
        return False
    
    # أيام الأسبوع
    if placement.active_weekdays and len(placement.active_weekdays) > 0:
        if today_weekday not in placement.active_weekdays:
            return False
    
    # ─── 2. Targeting ───────────────────────────────────
    try:
        targeting = ad.targeting
    except Exception:
        # لا يوجد targeting → نعتبره مفتوح للجميع
        return True
    
    return targeting.matches(
        language=language,
        country=country,
        device=device_type,
        user_type=user_type,
    )


def _weighted_sample(items: list, weights: list, k: int) -> list:
    """اختيار k عناصر عشوائياً مع weights — بدون تكرار."""
    if k >= len(items):
        return list(items)
    
    items = list(items)
    weights = list(weights)
    selected = []
    
    for _ in range(k):
        if not items:
            break
        # نختار عنصراً واحداً
        chosen = random.choices(items, weights=weights, k=1)[0]
        idx = items.index(chosen)
        selected.append(chosen)
        items.pop(idx)
        weights.pop(idx)
    
    return selected


# ═══════════════════════════════════════════════════════════
# Tracking: تسجيل الأحداث
# ═══════════════════════════════════════════════════════════

def track_event(
    *,
    creative: AdCreative,
    event_type: str,
    placement_key: str,
    request=None,
    user=None,
    session_id: str = '',
    language: str = '',
    country: str = '',
    device_type: str = '',
) -> Optional[AdEvent]:
    """
    تسجيل حدث (view/click/close/dismiss) على إعلان.
    
    GDPR-safe:
    - IP يُشفّر بـ SHA256
    - User Agent يُقطّع
    
    Returns:
        AdEvent المُنشأ، أو None إن فشل التسجيل.
    """
    
    # تحقق من صحة event_type
    valid_types = [e[0] for e in EventType.choices]
    if event_type not in valid_types:
        return None
    
    # استخراج البيانات من request إن وُجد
    ip_hash = ''
    user_agent = ''
    referrer = ''
    
    if request is not None:
        ip = _get_client_ip(request)
        if ip:
            ip_hash = AdEvent.hash_ip(ip)
        
        ua = request.META.get('HTTP_USER_AGENT', '')
        user_agent = ua[:500] if ua else ''
        
        ref = request.META.get('HTTP_REFERER', '')
        referrer = ref[:200] if ref else ''
        
        # كشف الـ device_type تلقائياً إن لم يُمرَّر
        if not device_type:
            device_type = detect_device_type(user_agent)
    
    # تطبيع
    language = (language or '').lower()[:2]
    country = (country or '').upper()[:2]
    
    try:
        event = AdEvent.objects.create(
            creative=creative,
            placement_key=placement_key,
            event_type=event_type,
            user=user if user and user.is_authenticated else None,
            session_id=(session_id or '')[:64],
            ip_hash=ip_hash,
            language=language,
            country=country,
            device_type=device_type,
            user_agent=user_agent,
            referrer=referrer,
        )
        return event
    except Exception as e:
        # نُسجّل ولا نكسر تجربة المستخدم
        import logging
        logging.getLogger(__name__).warning(f'Failed to track ad event: {e}')
        return None


def _get_client_ip(request) -> str:
    """استخراج IP الحقيقي مع احترام proxies (Render/Vercel)."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if x_forwarded:
        # أول IP في القائمة (هو الفعلي)
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


# ═══════════════════════════════════════════════════════════
# Device Detection
# ═══════════════════════════════════════════════════════════

_MOBILE_KEYWORDS = (
    'mobile', 'android', 'iphone', 'ipod', 'blackberry',
    'opera mini', 'opera mobi', 'webos', 'palm', 'phone',
)
_TABLET_KEYWORDS = ('ipad', 'tablet', 'kindle', 'silk', 'playbook')


def detect_device_type(user_agent: str) -> str:
    """
    يكشف نوع الجهاز من User Agent.
    
    Returns: 'mobile' | 'desktop' | 'tablet'
    """
    if not user_agent:
        return DeviceType.DESKTOP
    
    ua = user_agent.lower()
    
    # Tablet أولاً (لأن iPad يحوي 'mobile' أحياناً)
    if any(kw in ua for kw in _TABLET_KEYWORDS):
        return DeviceType.TABLET
    
    if any(kw in ua for kw in _MOBILE_KEYWORDS):
        return DeviceType.MOBILE
    
    return DeviceType.DESKTOP


# ═══════════════════════════════════════════════════════════
# User Type Detection
# ═══════════════════════════════════════════════════════════

def detect_user_type(user) -> str:
    """يحدد نوع المستخدم من Django user object."""
    if not user or not user.is_authenticated:
        return UserType.ANONYMOUS
    
    role = getattr(user, 'role', '')
    
    if role in ('super_admin', 'admin') or user.is_superuser:
        return UserType.ADMIN
    if role == 'agency':
        return UserType.AGENCY
    if role == 'supplier':
        return UserType.SUPPLIER
    if role == 'tourist':
        return UserType.TOURIST
    
    return UserType.ANONYMOUS


# ═══════════════════════════════════════════════════════════
# Frequency Capping (في Phase 1: cookie-based في frontend)
# ═══════════════════════════════════════════════════════════

def check_frequency_cap(
    creative: AdCreative,
    *,
    user=None,
    session_id: str = '',
) -> bool:
    """
    يفحص ما إذا كان الزائر قد تجاوز حد المشاهدات.
    
    ملاحظة:
    - في Phase 1، الـ frequency cap يُفحص في DB (ad_events)
    - في Phase 2 سننقله لـ Redis للسرعة
    
    Returns:
        True إذا كان مسموحاً، False إذا تجاوز الحد.
    """
    try:
        targeting = creative.targeting
    except Exception:
        return True  # لا targeting = لا حد
    
    today = timezone.now().date()
    
    # حد يومي للمستخدم
    if targeting.max_views_per_user_day:
        events_qs = AdEvent.objects.filter(
            creative=creative,
            event_type=EventType.VIEW,
            created_at__date=today,
        )
        
        if user and user.is_authenticated:
            count = events_qs.filter(user=user).count()
        elif session_id:
            count = events_qs.filter(session_id=session_id).count()
        else:
            count = 0
        
        if count >= targeting.max_views_per_user_day:
            return False
    
    # حد لكل جلسة
    if targeting.max_views_per_session and session_id:
        session_count = AdEvent.objects.filter(
            creative=creative,
            event_type=EventType.VIEW,
            session_id=session_id,
        ).count()
        
        if session_count >= targeting.max_views_per_session:
            return False
    
    return True


# ═══════════════════════════════════════════════════════════
# Stats helpers (للأدمن)
# ═══════════════════════════════════════════════════════════

def get_creative_stats(creative: AdCreative, days: int = 30) -> dict:
    """
    يُرجع إحصائيات أساسية لإعلان.
    
    Args:
        creative: AdCreative instance
        days: آخر N يوم (افتراضي 30)
    
    Returns:
        dict: { views, clicks, ctr, closes, by_device, by_country }
    """
    from django.db.models import Count
    from datetime import timedelta
    
    since = timezone.now() - timedelta(days=days)
    events = creative.events.filter(created_at__gte=since)
    
    total_views = events.filter(event_type=EventType.VIEW).count()
    total_clicks = events.filter(event_type=EventType.CLICK).count()
    total_closes = events.filter(event_type=EventType.CLOSE).count()
    ctr = (total_clicks / total_views * 100) if total_views > 0 else 0
    
    by_device = list(
        events.filter(event_type=EventType.VIEW)
        .values('device_type')
        .annotate(count=Count('id'))
        .order_by('-count')
    )
    
    by_country = list(
        events.filter(event_type=EventType.VIEW)
        .exclude(country='')
        .values('country')
        .annotate(count=Count('id'))
        .order_by('-count')[:10]
    )
    
    return {
        'period_days': days,
        'views': total_views,
        'clicks': total_clicks,
        'closes': total_closes,
        'ctr': round(ctr, 2),
        'by_device': by_device,
        'by_country': by_country,
    }
