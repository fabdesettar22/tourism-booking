from rest_framework.permissions import BasePermission, IsAdminUser


class IsBlogEditor(IsAdminUser):
    """Currently delegates to IsAdminUser. Extend later for an Editor role."""
    pass
