from rest_framework import serializers
from ..models import Hotel, HotelPhoto
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


# ═══════════════════════════════════════════════════════════
# Public Serializers — لعرض السائح (لا يكشف بيانات إدارية)
# ═══════════════════════════════════════════════════════════

class HotelPhotoPublicSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = HotelPhoto
        fields = ['id', 'image', 'is_primary', 'order', 'caption']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class PublicHotelListSerializer(serializers.ModelSerializer):
    city_name    = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    image        = serializers.SerializerMethodField()

    class Meta:
        model = Hotel
        fields = [
            'id', 'name', 'stars',
            'city_name', 'country_name',
            'image',
        ]

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None

    def get_country_name(self, obj):
        return obj.city.country.name if obj.city and obj.city.country else None

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class PublicHotelDetailSerializer(serializers.ModelSerializer):
    city_name    = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    country_code = serializers.SerializerMethodField()
    image        = serializers.SerializerMethodField()
    photos       = HotelPhotoPublicSerializer(many=True, read_only=True)

    class Meta:
        model = Hotel
        fields = [
            'id', 'name', 'description', 'address', 'stars',
            'city_name', 'country_name', 'country_code',
            'latitude', 'longitude',
            'amenities', 'check_in_time', 'check_out_time',
            'image', 'photos',
        ]

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None

    def get_country_name(self, obj):
        return obj.city.country.name if obj.city and obj.city.country else None

    def get_country_code(self, obj):
        return obj.city.country.iso2 if obj.city and obj.city.country else None

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None
