from rest_framework import serializers
from .models import ServiceCategory, Service, ServicePhoto


class ServiceCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceCategory
        fields = ['id', 'name', 'slug', 'description', 'icon']


class ServiceSerializer(serializers.ModelSerializer):
    category_name = serializers.SerializerMethodField()
    city_name     = serializers.SerializerMethodField()

    # 🆕 Properties محسوبة (read-only)
    commission_amount       = serializers.ReadOnlyField()
    final_price             = serializers.ReadOnlyField()
    is_ready_for_activation = serializers.ReadOnlyField()
    missing_for_activation  = serializers.ReadOnlyField()

    class Meta:
        model  = Service
        fields = [
            'id', 'name', 'description', 'image',
            'category', 'category_name',
            'city', 'city_name',
            'service_type', 'base_price', 'currency',
            'price_per', 'discount_percentage',
            'vehicle_type', 'vehicle_capacity',
            'pickup_location', 'dropoff_location',
            'duration_hours', 'max_participants',
            'includes_guide', 'includes_meals',
            'meeting_point', 'extra_data',
            'is_optional', 'is_active',
            'relative_day', 'created_at',
            # 🆕 العمولة والتفعيل
            'commission_percentage',
            'commission_amount', 'final_price',
            'is_ready_for_activation', 'missing_for_activation',
        ]

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None


# ═══════════════════════════════════════════════════════════
# Public Serializers — لعرض السائح (لا يكشف بيانات إدارية)
# ═══════════════════════════════════════════════════════════

class ServicePhotoPublicSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()

    class Meta:
        model = ServicePhoto
        fields = ['id', 'image', 'is_primary', 'order', 'caption']

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None


class PublicServiceListSerializer(serializers.ModelSerializer):
    """بطاقة خدمة للسائح — يكشف final_price فقط (يخفي base_price + commission)."""
    city_name    = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    image        = serializers.SerializerMethodField()
    final_price  = serializers.ReadOnlyField()

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'service_type',
            'city_name', 'country_name',
            'image',
            'final_price', 'currency', 'price_per',
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


class PublicServiceDetailSerializer(serializers.ModelSerializer):
    """تفاصيل خدمة للسائح — يكشف final_price فقط."""
    city_name    = serializers.SerializerMethodField()
    country_name = serializers.SerializerMethodField()
    country_code = serializers.SerializerMethodField()
    category_name = serializers.SerializerMethodField()
    image        = serializers.SerializerMethodField()
    photos       = ServicePhotoPublicSerializer(many=True, read_only=True)
    final_price  = serializers.ReadOnlyField()

    class Meta:
        model = Service
        fields = [
            'id', 'name', 'description', 'service_type',
            'category_name',
            'city_name', 'country_name', 'country_code',
            'image', 'photos',
            'final_price', 'currency', 'price_per',
            'duration_hours', 'max_participants',
            'includes_guide', 'includes_meals',
            'pickup_location', 'dropoff_location', 'meeting_point',
            'vehicle_type', 'vehicle_capacity',
            'extra_data',
        ]

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None

    def get_country_name(self, obj):
        return obj.city.country.name if obj.city and obj.city.country else None

    def get_country_code(self, obj):
        return obj.city.country.iso2 if obj.city and obj.city.country else None

    def get_category_name(self, obj):
        return obj.category.name if obj.category else None

    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request:
            return request.build_absolute_uri(obj.image.url)
        return obj.image.url if obj.image else None
