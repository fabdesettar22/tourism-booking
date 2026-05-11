# apps/notifications/serializers.py

from rest_framework import serializers
from .models import Notification
from .translations import nt


def _resolve_params(params: dict, lang: str) -> dict:
    """Replace {"i18n": "key"} entries with translated strings."""
    out = {}
    for k, v in (params or {}).items():
        if isinstance(v, dict) and "i18n" in v:
            out[k] = nt(v["i18n"], lang)
        else:
            out[k] = v
    return out


class NotificationSerializer(serializers.ModelSerializer):
    title   = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()

    class Meta:
        model  = Notification
        fields = ['id', 'type', 'title', 'message', 'is_read', 'link', 'created_at']

    def _lang(self):
        request = self.context.get('request')
        if request and getattr(request, 'user', None) and request.user.is_authenticated:
            return getattr(request.user, 'language', None) or 'ar'
        return 'ar'

    def get_title(self, obj):
        if obj.title_key:
            lang = self._lang()
            params = _resolve_params(obj.params, lang)
            base = nt(obj.title_key, lang, **params)
            display = (obj.params or {}).get('display_name')
            if display and obj.title_key in ('new_supplier.title', 'new_agency.title'):
                return f"{base}: {display}"
            return base
        return obj.title

    def get_message(self, obj):
        if obj.message_key:
            lang = self._lang()
            params = _resolve_params(obj.params, lang)
            return nt(obj.message_key, lang, **params)
        return obj.message
