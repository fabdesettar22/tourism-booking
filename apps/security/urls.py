from django.urls import path
from .views import enroll_totp, confirm_totp, disable_totp, totp_status

urlpatterns = [
    path("2fa/status/",  totp_status,  name="security-totp-status"),
    path("2fa/enroll/",  enroll_totp,  name="security-totp-enroll"),
    path("2fa/confirm/", confirm_totp, name="security-totp-confirm"),
    path("2fa/disable/", disable_totp, name="security-totp-disable"),
]
