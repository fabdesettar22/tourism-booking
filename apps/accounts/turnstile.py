import logging
import requests
from django.conf import settings
from rest_framework.permissions import BasePermission
from rest_framework.exceptions import PermissionDenied

logger = logging.getLogger(__name__)

VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'
TIMEOUT = 5


def verify_turnstile(token: str | None, remote_ip: str | None) -> bool:
    secret = getattr(settings, 'TURNSTILE_SECRET_KEY', '') or ''
    if not secret:
        if settings.DEBUG:
            return True
        logger.warning('TURNSTILE_SECRET_KEY missing in production')
        return False
    if not token:
        return False
    try:
        payload = {'secret': secret, 'response': token}
        if remote_ip:
            payload['remoteip'] = remote_ip
        r = requests.post(VERIFY_URL, data=payload, timeout=TIMEOUT)
        data = r.json()
        if not data.get('success'):
            logger.warning('TURNSTILE_FAIL codes=%s token_len=%s ip=%s hostname_in_resp=%s action=%s',
                           data.get('error-codes'), len(token or ''), remote_ip,
                           data.get('hostname'), data.get('action'))
        return bool(data.get('success'))
    except Exception as exc:
        logger.warning('Turnstile verify error: %s', exc)
        return False


def _client_ip(request) -> str | None:
    xff = request.META.get('HTTP_X_FORWARDED_FOR', '')
    if xff:
        return xff.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


class TurnstileRequired(BasePermission):
    """
    Verifies Cloudflare Turnstile token in `cf_turnstile_token` request data.
    Skip for non-POST. Raises 403 with localized message on failure.
    """
    MESSAGES = {
        'ar': 'فشل التحقّق من أنك لست روبوتاً. حدّث الصفحة وأعد المحاولة.',
        'en': 'Bot verification failed. Please refresh and try again.',
        'ms': 'Pengesahan bot gagal. Sila muat semula dan cuba lagi.',
    }

    def has_permission(self, request, view) -> bool:
        if request.method != 'POST':
            return True
        token = request.data.get('cf_turnstile_token') if hasattr(request.data, 'get') else None
        if verify_turnstile(token, _client_ip(request)):
            return True
        lang = (request.headers.get('Accept-Language') or 'en').split(',')[0].split('-')[0].lower()
        raise PermissionDenied(self.MESSAGES.get(lang, self.MESSAGES['en']))
