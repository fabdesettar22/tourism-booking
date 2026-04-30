from rest_framework import serializers
from ..models import Hotel
from apps.locations.models import City


class HotelSerializer(serializers.ModelSerializer):
    city_name = serializers.SerializerMethodField()
    country = serializers.SerializerMethodField()

    # 🆕 Properties محسوبة (read-only)
    is_ready_for_activation = serializers.ReadOnlyField()
    missing_for_activation  = serializers.ReadOnlyField()

    class Meta:
        model = Hotel
        fields = [
            'id', 'name',
            'city',        # ID للكتابة والقراءة
            'city_name',   # اسم المدينة للعرض
            'country',     # اسم الدولة للعرض
            'address', 'stars', 'description', 'image',
            # 🆕 العمولة والتفعيل
            'commission_percentage', 'is_active',
            'is_ready_for_activation', 'missing_for_activation',
        ]

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None

    def get_country(self, obj):
        return obj.city.country.name if obj.city and obj.city.country else None
