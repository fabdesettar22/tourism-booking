from rest_framework import serializers
from ..models import TourPackage, PackageCity, PackageCityHotel, PackageCityService
from apps.locations.models import City
from apps.hotels.models import Hotel
from apps.services.models import Service


class CitySerializer(serializers.ModelSerializer):
    class Meta:
        model = City
        fields = ['id', 'name']


class HotelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Hotel
        fields = ['id', 'name']


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['id', 'name', 'base_price', 'currency']


class PackageCityHotelSerializer(serializers.ModelSerializer):
    hotel = HotelSerializer(read_only=True)
    class Meta:
        model = PackageCityHotel
        fields = ['id', 'hotel', 'nights']


class PackageCityServiceSerializer(serializers.ModelSerializer):
    service = ServiceSerializer(read_only=True)
    class Meta:
        model = PackageCityService
        fields = ['id', 'service', 'custom_price']


class PackageCitySerializer(serializers.ModelSerializer):
    city = CitySerializer(read_only=True)
    hotels = PackageCityHotelSerializer(many=True, read_only=True)
    services = PackageCityServiceSerializer(many=True, read_only=True)

    class Meta:
        model = PackageCity
        fields = ['id', 'city', 'nights', 'hotels', 'services']


class TourPackageSerializer(serializers.ModelSerializer):
    cities = PackageCitySerializer(many=True, read_only=True)

    class Meta:
        model = TourPackage
        fields = [
            'id', 'name', 'slug', 'description', 'base_price',
            'currency', 'discount_percentage', 'image', 'highlights',
            'is_active', 'cities'
        ]