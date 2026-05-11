"""Multi-tenancy middleware.

Extracts the tenant context from the authenticated user and attaches it to
request as `request.tenant_id`. Downstream queryset managers filter by this.

The User model has `tenant` FK (nullable). For HQ admins and unauthenticated
requests, tenant_id is None — the TenantAwareManager treats that as "no
filter" so cross-tenant queries from HQ continue to work.
"""
from typing import Callable
from django.http import HttpRequest, HttpResponse


class TenantMiddleware:
    """Attach tenant_id to every request based on the authenticated user.

    Use after AuthenticationMiddleware in MIDDLEWARE.
    """

    def __init__(self, get_response: Callable[[HttpRequest], HttpResponse]):
        self.get_response = get_response

    def __call__(self, request: HttpRequest) -> HttpResponse:
        request.tenant_id = self._resolve_tenant(request)
        return self.get_response(request)

    @staticmethod
    def _resolve_tenant(request: HttpRequest):
        user = getattr(request, "user", None)
        if user is None or not user.is_authenticated:
            return None
        # HQ admins/superusers see everything — no tenant scoping
        if getattr(user, "is_superuser", False) or getattr(user, "role", None) == "admin":
            return None
        return getattr(user, "tenant_id", None)
