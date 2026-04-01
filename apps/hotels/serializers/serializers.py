from rest_framework import serializers
from ..models import Hotel
from apps.locations.serializers.serializers import CountrySerializer, CitySerializer  # إذا كان موجود

class HotelSerializer(serializers.ModelSerializer):
    city = serializers.PrimaryKeyRelatedField(read_only=True)  # للعرض
    country = serializers.SerializerMethodField()  # لعرض اسم الدولة

    class Meta:
        model = Hotel
        fields = ['id', 'name', 'city', 'country', 'address', 'stars', 'description', 'image']

    def get_country(self, obj):
        return obj.city.country.name if obj.city and obj.city.country else None