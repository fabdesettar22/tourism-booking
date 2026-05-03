"""
Permissions موحَّدة تعتمد على claims الـ JWT (tenant_id / tenant_type / role).

الاستخدام:
    from core.permissions import IsTenantMember, IsTenantAdmin, IsHQStaff, IsSupplierUser

Claims المتوقعة على request.auth.payload:
    user_id, tenant_id, tenant_type ('HQ' | 'PARTNER' | 'SUB'), role, email
"""
from rest_framework.permissions import BasePermission


def _claims(request) -> dict:
    auth = getattr(request, 'auth', None)
    if auth is None:
        return {}
    payload = getattr(auth, 'payload', None)
    return payload or {}


class IsTenantMember(BasePermission):
    """مصادَق + ينتمي إلى أي tenant (PARTNER أو SUB أو HQ)."""

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        c = _claims(request)
        return bool(c.get('tenant_id') or c.get('tenant_type'))


class IsTenantAdmin(BasePermission):
    """مدير داخل وكالته/الـ tenant: agency_admin أو hq_admin."""

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        return _claims(request).get('role') in ('agency_admin', 'hq_admin')


class IsHQStaff(BasePermission):
    """من فريق HQ فقط (super_admin / admin)."""

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        c = _claims(request)
        return c.get('tenant_type') == 'HQ' or c.get('role') == 'hq_admin'


class IsSupplierUser(BasePermission):
    """مورد فقط."""

    def has_permission(self, request, view) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False
        return _claims(request).get('role') == 'supplier_user'
