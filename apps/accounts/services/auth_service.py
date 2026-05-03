"""
Auth Service — منطق تسجيل الدخول/الخروج/تحديث التوكن.
يفصل المنطق عن الـ Views (Views رفيعة، تستدعي هذه الدوال فقط).

يستخدم Redis لتخزين JTI الخاص بـ Refresh:
    Key:    refresh:<user_id>:<jti>
    Value:  "1"
    TTL:    7 أيام
"""
import logging
from typing import Optional

from django.conf import settings
from django.contrib.auth import authenticate
from django.core.cache import cache as django_cache
from django.db import transaction

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import User
from apps.accounts.tokens import CustomRefreshToken

logger = logging.getLogger(__name__)


# ─── Redis helpers ─────────────────────────────────────────

def _redis_client():
    """يحاول جلب redis client مباشر؛ إن لم يتوفر يرجع cache مع كائن وسيط."""
    try:
        from django_redis import get_redis_connection
        return get_redis_connection('default')
    except Exception:
        return None


def _refresh_key(user_id, jti: str) -> str:
    return f"{settings.JWT_REFRESH_REDIS_PREFIX}:{user_id}:{jti}"


def _store_refresh_jti(user_id, jti: str) -> None:
    key = _refresh_key(user_id, jti)
    ttl = settings.JWT_REFRESH_TTL_SECONDS
    client = _redis_client()
    if client is not None:
        client.setex(key, ttl, "1")
    else:
        django_cache.set(key, "1", timeout=ttl)


def _has_refresh_jti(user_id, jti: str) -> bool:
    key = _refresh_key(user_id, jti)
    client = _redis_client()
    if client is not None:
        return client.exists(key) > 0
    return django_cache.get(key) is not None


def _delete_refresh_jti(user_id, jti: str) -> None:
    key = _refresh_key(user_id, jti)
    client = _redis_client()
    if client is not None:
        client.delete(key)
    else:
        django_cache.delete(key)


# ─── Audit log helper ──────────────────────────────────────

def _resolve_user(claim_user_id) -> Optional[User]:
    """يجد User بـ uid (UUID) أو id (int) — claim قد يكون أيهما."""
    if claim_user_id is None or claim_user_id == '':
        return None
    s = str(claim_user_id)
    # UUID first (الـ claim حالياً UUID)
    try:
        u = User.objects.filter(uid=s).first()
        if u:
            return u
    except (ValueError, Exception):
        pass
    # fallback: int PK
    try:
        return User.objects.filter(pk=int(s)).first()
    except (ValueError, TypeError):
        return None


def _audit(*, user: Optional[User], action: str, request=None, metadata: Optional[dict] = None):
    """كتابة سجل تدقيق — تتجنب الفشل لو الـ model لم تُهاجَر بعد."""
    try:
        from apps.accounts.models import AuthAuditLog
    except ImportError:
        logger.warning("AuthAuditLog not available; skipping audit for %s", action)
        return

    ip = ''
    ua = ''
    if request is not None:
        ip = (request.META.get('HTTP_X_FORWARDED_FOR') or request.META.get('REMOTE_ADDR') or '')[:45]
        ua = request.META.get('HTTP_USER_AGENT', '')[:1024]

    try:
        AuthAuditLog.objects.create(
            user       = user,
            tenant     = getattr(user, 'agency', None) if user else None,
            action     = action,
            ip_address = ip,
            user_agent = ua,
            metadata   = metadata or {},
        )
    except Exception as exc:
        logger.exception("Failed to write AuthAuditLog (%s): %s", action, exc)


# ═══════════════════════════════════════════════════════════
# Public service functions
# ═══════════════════════════════════════════════════════════

@transaction.atomic
def login(*, identifier: str, password: str, request=None) -> dict:
    """يصادق المستخدم؛ يصدر access+refresh ويحفظ refresh-jti في Redis.

    يرفع ValueError عند فشل المصادقة (View يحوّلها إلى 401).
    """
    from django.db.models import Q

    identifier = (identifier or '').strip()
    user = User.objects.filter(
        Q(username__iexact=identifier) | Q(email__iexact=identifier)
    ).first()

    if user is None or not user.check_password(password) or not user.is_active:
        _audit(user=user, action='LOGIN_FAIL', request=request,
               metadata={'identifier': identifier})
        raise ValueError('بيانات الدخول غير صحيحة.')

    refresh = CustomRefreshToken.for_user(user)
    access  = refresh.access_token

    user_id_claim = str(getattr(user, 'uid', None) or user.id)
    _store_refresh_jti(user_id_claim, refresh['jti'])

    _audit(user=user, action='LOGIN_SUCCESS', request=request)

    return {
        'access' : str(access),
        'refresh': str(refresh),
        'user'   : user,
    }


def logout(*, refresh_token: str, request=None) -> None:
    """يحذف Refresh من Redis. Access ينتهي تلقائياً خلال ≤15 دقيقة."""
    try:
        token = RefreshToken(refresh_token)
    except TokenError as exc:
        raise ValueError(f'refresh token غير صالح: {exc}')

    user_id = token.payload.get('user_id') or token.payload.get(settings.SIMPLE_JWT.get('USER_ID_CLAIM', 'user_id'))
    jti     = token.payload.get('jti')

    if user_id and jti:
        _delete_refresh_jti(str(user_id), jti)

    user = _resolve_user(user_id) if user_id else None

    _audit(user=user, action='LOGOUT', request=request, metadata={'jti': jti})


def refresh_token(*, refresh_token: str, request=None) -> dict:
    """يدوّر Refresh: يتحقق من الـ JTI القديم في Redis → يحذفه → يصدر access+refresh جديد."""
    try:
        old = RefreshToken(refresh_token)
    except TokenError as exc:
        raise ValueError(f'refresh token غير صالح: {exc}')

    user_id = str(old.payload.get('user_id') or '')
    old_jti = old.payload.get('jti')

    if not user_id or not old_jti:
        raise ValueError('refresh token ناقص الـ claims.')

    if not _has_refresh_jti(user_id, old_jti):
        _audit(user=None, action='LOGIN_FAIL', request=request,
               metadata={'reason': 'refresh-not-in-redis', 'jti': old_jti})
        raise ValueError('refresh token مُلغى أو منتهي الصلاحية.')

    user = _resolve_user(user_id)
    if user is None or not user.is_active:
        _delete_refresh_jti(user_id, old_jti)
        raise ValueError('الحساب غير متاح.')

    # rotate: delete old jti, mint a new pair, store new jti
    _delete_refresh_jti(user_id, old_jti)

    new_refresh = CustomRefreshToken.for_user(user)
    new_access  = new_refresh.access_token
    _store_refresh_jti(user_id, new_refresh['jti'])

    _audit(user=user, action='TOKEN_REFRESH', request=request)

    return {
        'access' : str(new_access),
        'refresh': str(new_refresh),
    }
