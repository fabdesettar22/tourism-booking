"""
JWT Tokens — مع claims مخصصة:
    user_id, tenant_id, tenant_type, role, email

Refresh tokens مخزّنة في Redis تحت  refresh:<user_id>:<jti>  مع TTL = 7 أيام.
Access tokens stateless (تُتحقَّق بالتوقيع فقط).
"""
from typing import TYPE_CHECKING

from rest_framework_simplejwt.tokens import AccessToken, RefreshToken

if TYPE_CHECKING:
    from apps.accounts.models import User


# ─── Role / Tenant Mapping ─────────────────────────────────
# الموديل يستخدم: super_admin | admin | agency | supplier | tourist
# الـ JWT يصدر: hq_admin | agency_admin | supplier_user | tourist
ROLE_CLAIM_MAP = {
    'super_admin': 'hq_admin',
    'admin'      : 'hq_admin',
    'agency'     : 'agency_admin',
    'supplier'   : 'supplier_user',
    'tourist'    : 'tourist',
}

TENANT_TYPE_MAP = {
    'super_admin': 'HQ',
    'admin'      : 'HQ',
    'agency'     : 'PARTNER',
    'supplier'   : 'SUB',
    'tourist'    : 'SUB',
}


def _build_claims(user: 'User') -> dict:
    """يبني الـ claims المشتركة من المستخدم."""
    role = user.role or 'tourist'
    return {
        'user_id'    : str(getattr(user, 'uid', None) or user.id),
        'tenant_id'  : str(user.agency_id) if user.agency_id else '',
        'tenant_type': TENANT_TYPE_MAP.get(role, 'SUB'),
        'role'       : ROLE_CLAIM_MAP.get(role, role),
        'email'      : user.email or '',
    }


class CustomAccessToken(AccessToken):
    """Access Token قصير العمر (15 دقيقة) — stateless."""

    @classmethod
    def for_user(cls, user: 'User') -> 'CustomAccessToken':  # type: ignore[override]
        token = super().for_user(user)
        for k, v in _build_claims(user).items():
            token[k] = v
        return token


class CustomRefreshToken(RefreshToken):
    """Refresh Token (7 أيام) — يخزَّن JTI الخاص به في Redis ليُلغى عند الـ logout/refresh."""

    access_token_class = CustomAccessToken

    @classmethod
    def for_user(cls, user: 'User') -> 'CustomRefreshToken':  # type: ignore[override]
        token = super().for_user(user)
        for k, v in _build_claims(user).items():
            token[k] = v
        return token
