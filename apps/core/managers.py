"""Tenant-aware managers and querysets.

Models that inherit from `TenantAwareModel` (or set a `tenant_id` field) can
use this manager to auto-filter by the current request's tenant. Activate
the filter via `Model.objects.for_tenant(request.tenant_id)`.
"""
from django.db import models


class TenantAwareQuerySet(models.QuerySet):
    def for_tenant(self, tenant_id):
        """Filter to a specific tenant. None disables filtering (HQ scope)."""
        if tenant_id is None:
            return self
        return self.filter(tenant_id=tenant_id)


class TenantAwareManager(models.Manager.from_queryset(TenantAwareQuerySet)):
    """Convenience manager exposing `.for_tenant()` directly on the model."""
    pass


class TenantAwareModel(models.Model):
    """Optional abstract base — adds tenant_id FK + the manager."""
    tenant = models.ForeignKey(
        "tenants.Tenant", on_delete=models.PROTECT,
        null=True, blank=True, related_name="+",
    )

    objects = TenantAwareManager()

    class Meta:
        abstract = True
        indexes = [models.Index(fields=["tenant"])]
