"""
Serializers — تحويل بيانات HeroHotelCard إلى JSON للـ Frontend.
"""
from rest_framework import serializers

from apps.hero_hotels.models import HeroHotelCard


def _media_kind(image_field, video_field) -> str:
    if video_field:
        return 'video'
    if image_field:
        return 'image'
    return 'none'


class HeroHotelCardSerializer(serializers.ModelSerializer):
    """Public — يُستخدم للصفحة الرئيسية."""

    card_media_kind = serializers.SerializerMethodField()
    hero_media_kind = serializers.SerializerMethodField()

    class Meta:
        model = HeroHotelCard
        fields = (
            'id', 'card_type',
            'name', 'logo', 'stars', 'description', 'location',
            'card_image', 'card_video',
            'hero_image', 'hero_video',
            'card_media_kind', 'hero_media_kind',
            'link_url', 'cta_text',
            'display_order',
        )
        read_only_fields = fields

    def get_card_media_kind(self, obj):
        return _media_kind(obj.card_image, obj.card_video)

    def get_hero_media_kind(self, obj):
        return _media_kind(obj.hero_image, obj.hero_video)


class HeroHotelCardAdminSerializer(serializers.ModelSerializer):
    """Admin — كل الحقول قابلة للتعديل."""

    logo_url        = serializers.SerializerMethodField()
    card_image_url  = serializers.SerializerMethodField()
    card_video_url  = serializers.SerializerMethodField()
    hero_image_url  = serializers.SerializerMethodField()
    hero_video_url  = serializers.SerializerMethodField()
    card_media_kind = serializers.SerializerMethodField()
    hero_media_kind = serializers.SerializerMethodField()

    class Meta:
        model = HeroHotelCard
        fields = (
            'id', 'card_type',
            'name', 'location', 'stars', 'description',
            'logo', 'card_image', 'card_video',
            'hero_image', 'hero_video',
            'link_url', 'cta_text',
            'logo_url', 'card_image_url', 'card_video_url',
            'hero_image_url', 'hero_video_url',
            'card_media_kind', 'hero_media_kind',
            'display_order', 'is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = (
            'id', 'created_at', 'updated_at',
            'logo_url', 'card_image_url', 'card_video_url',
            'hero_image_url', 'hero_video_url',
            'card_media_kind', 'hero_media_kind',
        )

    def _abs(self, field):
        request = self.context.get('request')
        if field and request:
            return request.build_absolute_uri(field.url)
        return field.url if field else None

    def get_logo_url(self, obj):       return self._abs(obj.logo)
    def get_card_image_url(self, obj): return self._abs(obj.card_image)
    def get_card_video_url(self, obj): return self._abs(obj.card_video)
    def get_hero_image_url(self, obj): return self._abs(obj.hero_image)
    def get_hero_video_url(self, obj): return self._abs(obj.hero_video)
    def get_card_media_kind(self, obj):return _media_kind(obj.card_image, obj.card_video)
    def get_hero_media_kind(self, obj):return _media_kind(obj.hero_image, obj.hero_video)
