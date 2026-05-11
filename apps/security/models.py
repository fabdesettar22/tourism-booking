"""Two-factor authentication via TOTP (Google Authenticator, Authy)."""
import secrets
from django.conf import settings
from django.db import models
from django.utils import timezone


def _generate_secret() -> str:
    # 20 bytes → 32 base32 chars (RFC 6238 recommended)
    import base64
    return base64.b32encode(secrets.token_bytes(20)).decode("ascii").rstrip("=")


class TOTPDevice(models.Model):
    """One TOTP device per user. Verified flag set after first successful code."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="totp_device",
    )
    secret = models.CharField(max_length=64, default=_generate_secret)
    confirmed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    confirmed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = "security_totp_device"

    def provisioning_uri(self, issuer: str = "MYBRIDGE") -> str:
        """otpauth://totp/<issuer>:<email>?secret=<base32>&issuer=<issuer>"""
        from urllib.parse import quote
        email = quote(self.user.email)
        return f"otpauth://totp/{issuer}:{email}?secret={self.secret}&issuer={issuer}"

    def verify(self, code: str) -> bool:
        try:
            import pyotp
        except ImportError:
            return False
        totp = pyotp.TOTP(self.secret)
        ok = totp.verify(code, valid_window=1)
        if ok and not self.confirmed:
            self.confirmed = True
            self.confirmed_at = timezone.now()
            self.save(update_fields=["confirmed", "confirmed_at"])
        return ok


class BackupCode(models.Model):
    """One-time backup codes when user loses authenticator."""
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="backup_codes",
    )
    code_hash = models.CharField(max_length=128)
    used = models.BooleanField(default=False)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = "security_backup_code"
        indexes = [models.Index(fields=["user", "used"])]
