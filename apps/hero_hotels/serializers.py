"""
Serializers — تحويل بيانات HeroHotelCard إلى JSON للـ Frontend.
"""
from rest_framework import serializers

from apps.hero_hotels.models import HeroHotelCard


class HeroHotelCardSerializer(serializers.ModelSerializer):
    """
    Serializer عام — يُستخدم للصفحة الرئيسية.
    يعرض فقط البيانات الضرورية للعرض.
    """

    logo = serializers.ImageField(read_only=True)
    card_image = serializers.ImageField(read_only=True)
    hero_image = serializers.ImageField(read_only=True)

    class Meta:
        model = HeroHotelCard
        fields = (
            'id',
            'name',
            'logo',
            'stars',
            'description',
            'location',
            'card_image',
            'hero_image',
            'display_order',
        )
        read_only_fields = fields


class HeroHotelCardAdminSerializer(serializers.ModelSerializer):
    """Serializer للأدمن — كل الحقول قابلة للتعديل."""

    logo_url       = serializers.SerializerMethodField()
    card_image_url = serializers.SerializerMethodField()
    hero_image_url = serializers.SerializerMethodField()

    class Meta:
        model = HeroHotelCard
        fields = (
            'id', 'name', 'location', 'stars', 'description',
            'logo', 'card_image', 'hero_image',
            'logo_url', 'card_image_url', 'hero_image_url',
            'display_order', 'is_active',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at',
                            'logo_url', 'card_image_url', 'hero_image_url')

    def _abs(self, request, field):
        if field and request:
            return request.build_absolute_uri(field.url)
        return field.url if field else None

    def get_logo_url(self, obj):       return self._abs(self.context.get('request'), obj.logo)
    def get_card_image_url(self, obj): return self._abs(self.context.get('request'), obj.card_image)
    def get_hero_image_url(self, obj): return self._abs(self.context.get('request'), obj.hero_image)
