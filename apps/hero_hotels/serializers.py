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
