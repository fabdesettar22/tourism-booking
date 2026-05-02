from apps.accounts.permissions import IsAdminUser


class IsBlogEditor(IsAdminUser):
    """Currently delegates to project IsAdminUser (is_admin flag). Extend later for an Editor role."""
    pass
