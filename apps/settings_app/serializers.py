# apps/settings_app/serializers.py

from rest_framework import serializers
from .models import SiteSettings


class SiteSettingsSerializer(serializers.ModelSerializer):
    site_logo_url = serializers.SerializerMethodField()

    class Meta:
        model  = SiteSettings
        fields = ['id', 'site_name', 'site_logo', 'site_logo_url', 'site_email', 'site_phone', 'site_address']

    def get_site_logo_url(self, obj) -> str | None:
        if obj.site_logo:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.site_logo.url)
            return obj.site_logo.url
        return None

# ═══════════════════════════════════════════════════════════
# HomepageConfig + Testimonial
# ═══════════════════════════════════════════════════════════

from .models import HomepageConfig, Testimonial


class HomepageConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = HomepageConfig
        fields = '__all__'
        read_only_fields = ('id', 'updated_at', 'updated_by')


class TestimonialSerializer(serializers.ModelSerializer):
    avatar_url = serializers.SerializerMethodField()

    class Meta:
        model = Testimonial
        fields = ['id', 'name', 'location', 'country_code', 'text', 'rating',
                  'avatar', 'avatar_url', 'is_active', 'display_order',
                  'created_at', 'updated_at']
        read_only_fields = ('id', 'created_at', 'updated_at')

    def get_avatar_url(self, obj):
        if obj.avatar:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.avatar.url) if request else obj.avatar.url
        return None


# ═══════════════════════════════════════════════════════════
# Destination
# ═══════════════════════════════════════════════════════════

from .models import Destination


class DestinationSerializer(serializers.ModelSerializer):
    """Serializer مشترك (public + admin)."""
    image_url       = serializers.SerializerMethodField()
    city_display    = serializers.SerializerMethodField()
    country_display = serializers.SerializerMethodField()
    country_iso2    = serializers.SerializerMethodField()

    class Meta:
        model  = Destination
        fields = [
            'id', 'name', 'image', 'image_url',
            'city', 'city_display', 'country_display', 'country_iso2',
            'city_name', 'country_code',  # legacy fields (مُحدَّثة تلقائياً)
            'size', 'display_order', 'is_active',
            'description', 'created_at', 'updated_at',
        ]
        read_only_fields = ('id', 'created_at', 'updated_at',
                            'image_url', 'city_display', 'country_display', 'country_iso2',
                            'city_name', 'country_code')

    def get_image_url(self, obj):
        if obj.image:
            request = self.context.get('request')
            return request.build_absolute_uri(obj.image.url) if request else obj.image.url
        return None

    def get_city_display(self, obj):
        if obj.city_id:
            return obj.city.name
        return obj.city_name or ''

    def get_country_display(self, obj):
        if obj.city_id and obj.city.country_id:
            return obj.city.country.name
        return obj.country_code or ''

    def get_country_iso2(self, obj):
        if obj.city_id and obj.city.country_id:
            return obj.city.country.iso2
        return obj.country_code or ''

    def _sync_legacy_from_city(self, validated_data):
        city = validated_data.get('city')
        if city:
            validated_data['city_name']    = city.name
            validated_data['country_code'] = city.country.iso2 if city.country_id else ''
        return validated_data

    def create(self, validated_data):
        return super().create(self._sync_legacy_from_city(validated_data))

    def update(self, instance, validated_data):
        return super().update(instance, self._sync_legacy_from_city(validated_data))
