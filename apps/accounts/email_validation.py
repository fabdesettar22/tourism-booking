"""
Helper موحَّد للتحقق أن الإيميل غير مستخدم في أي مكان من النظام.
يُستخدم في جميع نقاط التسجيل (User, Agency, Waitlist).
"""
from rest_framework import serializers

from apps.accounts.models import User, Agency


def assert_email_unique(value: str, *, exclude_user_id=None, exclude_agency_id=None) -> str:
    """يرفع ValidationError إن كان الإيميل موجوداً في User أو Agency.

    الاستخدام:
        def validate_email(self, value):
            return assert_email_unique(value)
    """
    value = (value or '').strip().lower()
    if not value:
        raise serializers.ValidationError('البريد الإلكتروني مطلوب.')

    user_qs = User.objects.filter(email__iexact=value)
    if exclude_user_id is not None:
        user_qs = user_qs.exclude(pk=exclude_user_id)
    if user_qs.exists():
        raise serializers.ValidationError('هذا البريد الإلكتروني مسجَّل بالفعل في النظام.')

    agency_qs = Agency.objects.filter(email__iexact=value)
    if exclude_agency_id is not None:
        agency_qs = agency_qs.exclude(pk=exclude_agency_id)
    if agency_qs.exists():
        raise serializers.ValidationError('هذا البريد الإلكتروني مسجَّل بالفعل لوكالة أخرى.')

    return value
