"""Template-only serializers لـ apps.packages.

موجَّه للـ:
1. **HQ admin**  → يبني/يعدّل قوالب الباقات (مع كل التفاصيل)
2. **Agency**    → يرى الباقات المنشورة فقط (بدون أي أسعار)

السعر النهائي يُحسب آلياً عبر apps.pricing.services + apps.bookings.views_calculator
عند فتح ودجت الحجز — لا يُخزَّن سعر مسبق على القالب.
"""
from rest_framework import serializers

from apps.locations.models import City
from apps.hotels.models import Hotel
from apps.tours_excursions.models import Tour
from apps.airport_transfers.models import AirportTransfer
from apps.flights.models import FlightRoute
from apps.gifts.models import Gift
from apps.packages.models import CustomPackage, PackageCity


# ════════════════════════════════════════════════════════════
# Lightweight nested serializers (للعرض فقط، آمنة للوكالة)
# ════════════════════════════════════════════════════════════


class _CityMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model  = City
        fields = ['id', 'name', 'country']


class _HotelMiniSerializer(serializers.ModelSerializer):
    """فندق للوكالة: لا يكشف commission_percentage."""
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model  = Hotel
        fields = ['id', 'name', 'city_name', 'address', 'stars', 'image', 'is_active']
        read_only_fields = fields


class _TourMiniSerializer(serializers.ModelSerializer):
    """جولة للوكالة: تكشف نوع/وجهة، لا تكشف الأسعار."""
    name = serializers.CharField(source='service.name', read_only=True)
    city_name = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model  = Tour
        fields = ['service', 'name', 'tour_type', 'duration', 'city_name',
                  'destination_text', 'origin_text']
        read_only_fields = fields


class _TransferMiniSerializer(serializers.ModelSerializer):
    name         = serializers.CharField(source='service.name', read_only=True)
    airport_code = serializers.CharField(source='airport.code', read_only=True)
    hotel_name   = serializers.CharField(source='hotel.name', read_only=True)
    city_name    = serializers.CharField(source='city.name', read_only=True)

    class Meta:
        model  = AirportTransfer
        fields = ['service', 'name', 'airport_code', 'hotel_name', 'city_name']
        read_only_fields = fields


class _FlightRouteMiniSerializer(serializers.ModelSerializer):
    class Meta:
        model  = FlightRoute
        fields = ['id', 'origin_iata', 'destination_iata', 'display_title',
                  'currency', 'is_active']
        read_only_fields = fields


class _GiftMiniSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='service.name', read_only=True)

    class Meta:
        model  = Gift
        fields = ['service', 'name', 'subcategory']
        read_only_fields = fields


# ════════════════════════════════════════════════════════════
# PackageCity serializer (allowed_hotels nested)
# ════════════════════════════════════════════════════════════


class PackageCityTemplateSerializer(serializers.ModelSerializer):
    """مدينة في القالب + الفنادق المسموحة فيها."""
    city_name      = serializers.CharField(source='city.name', read_only=True)
    allowed_hotels = _HotelMiniSerializer(many=True, read_only=True)
    allowed_hotel_ids = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(), source='allowed_hotels',
        many=True, write_only=True, required=False,
    )

    class Meta:
        model  = PackageCity
        fields = ['id', 'city', 'city_name', 'nights', 'order',
                  'allowed_hotels', 'allowed_hotel_ids']


# ════════════════════════════════════════════════════════════
# HQ Admin — full template serializer (CRUD + manage allowed_*)
# ════════════════════════════════════════════════════════════


class CustomPackageTemplateSerializer(serializers.ModelSerializer):
    """القالب الكامل من منظور HQ.

    HQ يستطيع:
    - تعديل الحقول الأساسية
    - إضافة/تعديل المدن (PackageCity nested)
    - تحديد الهدية الإجبارية
    - تحديد allowed_tours / allowed_transfers / allowed_flight_routes
    - تفعيل is_template للنشر
    """
    cities         = PackageCityTemplateSerializer(many=True, read_only=True)
    allowed_tours  = _TourMiniSerializer(many=True, read_only=True)
    allowed_transfers     = _TransferMiniSerializer(many=True, read_only=True)
    allowed_flight_routes = _FlightRouteMiniSerializer(many=True, read_only=True)
    gift_detail    = _GiftMiniSerializer(source='gift', read_only=True)

    # Write-only IDs for M2M management
    allowed_tour_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tour.objects.all(), source='allowed_tours',
        many=True, write_only=True, required=False,
    )
    allowed_transfer_ids = serializers.PrimaryKeyRelatedField(
        queryset=AirportTransfer.objects.all(), source='allowed_transfers',
        many=True, write_only=True, required=False,
    )
    allowed_flight_route_ids = serializers.PrimaryKeyRelatedField(
        queryset=FlightRoute.objects.all(), source='allowed_flight_routes',
        many=True, write_only=True, required=False,
    )

    # Helper computed
    ready_for_publish = serializers.SerializerMethodField()
    missing_for_publish = serializers.SerializerMethodField()

    class Meta:
        model = CustomPackage
        fields = [
            'id', 'title', 'description', 'image', 'country', 'agency',
            'total_nights', 'total_days', 'status', 'is_template', 'is_custom_order',
            'gift', 'gift_detail',
            'cities',
            'allowed_tours', 'allowed_tour_ids',
            'allowed_transfers', 'allowed_transfer_ids',
            'allowed_flight_routes', 'allowed_flight_route_ids',
            # ── ملاحظة: currency_cost/currency_sell/peak_surcharge_pct محذوفة من
            # واجهة القالب لأن الأسعار تُحسب آلياً وقت الحجز عبر apps.pricing.services
            # (المدخلات MYR، العرض EUR + USD باستخدام ExchangeRate). ──
            'ready_for_publish', 'missing_for_publish',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_ready_for_publish(self, obj):
        ok, _ = obj.is_ready_for_publish()
        return ok

    def get_missing_for_publish(self, obj):
        _, missing = obj.is_ready_for_publish()
        return missing


# ════════════════════════════════════════════════════════════
# Agency Public — published templates listing (NO PRICES)
# ════════════════════════════════════════════════════════════


class CustomPackageAgencyListSerializer(serializers.ModelSerializer):
    """عرض قائمة الباقات المنشورة للوكالة. لا أسعار."""
    cities = serializers.SerializerMethodField()
    nights_total = serializers.IntegerField(source='total_nights', read_only=True)

    class Meta:
        model = CustomPackage
        fields = ['id', 'title', 'description', 'image', 'nights_total',
                  'total_days', 'cities']
        read_only_fields = fields

    def get_cities(self, obj):
        return [
            {'id': pc.city_id, 'name': pc.city.name, 'order': pc.order, 'nights': pc.nights}
            for pc in obj.cities.select_related('city').all()
        ]


class CustomPackageAgencyDetailSerializer(serializers.ModelSerializer):
    """تفاصيل الباقة المنشورة للوكالة (مع المكوّنات المسموحة، بدون أسعار)."""
    cities         = PackageCityTemplateSerializer(many=True, read_only=True)
    allowed_tours  = _TourMiniSerializer(many=True, read_only=True)
    allowed_transfers     = _TransferMiniSerializer(many=True, read_only=True)
    allowed_flight_routes = _FlightRouteMiniSerializer(many=True, read_only=True)
    gift           = _GiftMiniSerializer(read_only=True)

    class Meta:
        model = CustomPackage
        fields = ['id', 'title', 'description', 'image', 'total_nights', 'total_days',
                  'gift', 'cities',
                  'allowed_tours', 'allowed_transfers', 'allowed_flight_routes']
        read_only_fields = fields


# ════════════════════════════════════════════════════════════
# Configurator response — يساعد ودجت الحجز في الفرونت
# ════════════════════════════════════════════════════════════


class PackageConfiguratorSerializer(serializers.Serializer):
    """يصف ما يستطيع الزبون اختياره عند فتح الباقة:
    - المدن وترتيبها
    - الفنادق المسموحة لكل مدينة (مع أنواع غرفها وحدها الأقصى)
    - الجولات المسموحة (مفلترة حسب المدن)
    - النقل المسموح
    - مسارات الطيران الداخلي/الدولي
    - الهدية المرتبطة
    """
    package_id    = serializers.IntegerField()
    title         = serializers.CharField()
    cities        = serializers.ListField()
    components    = serializers.DictField()
    gift          = serializers.DictField(required=False, allow_null=True)
