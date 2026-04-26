# apps/locations/serializers/serializers.py
from rest_framework import serializers
from ..models import Country, City


# ─── Lite Serializers (للـ dropdowns + autocomplete) ──────

class CountryLiteSerializer(serializers.ModelSerializer):
    """مختصر للقوائم المنسدلة + autocomplete."""
    label = serializers.SerializerMethodField()

    class Meta:
        model  = Country
        fields = ['id', 'iso2', 'iso3', 'name_en', 'name_ar', 'phone_code', 'label']

    def get_label(self, obj):
        # ما يُعرَض في الواجهة (يفضّل العربي إن وُجد)
        return obj.name_ar or obj.name_en or obj.name


class CityLiteSerializer(serializers.ModelSerializer):
    """مختصر للقوائم المنسدلة + autocomplete."""
    label        = serializers.SerializerMethodField()
    country_iso2 = serializers.CharField(source='country.iso2', read_only=True)

    class Meta:
        model  = City
        fields = ['id', 'name', 'name_ar', 'name_en', 'admin1',
                  'country_id', 'country_iso2', 'population', 'label']

    def get_label(self, obj):
        return obj.name_ar or obj.name_en or obj.name


# ─── Full Serializers (للـ admin / detail views) ──────────

class CountrySerializer(serializers.ModelSerializer):
    """Serializer كامل — متوافق مع الكود القديم."""
    class Meta:
        model  = Country
        fields = ['id', 'name', 'name_ar', 'name_en',
                  'iso2', 'iso3', 'phone_code', 'continent', 'geoname_id']


class CitySerializer(serializers.ModelSerializer):
    """Serializer كامل — متوافق مع الكود القديم."""
    image        = serializers.ImageField(required=False)
    country_name = serializers.CharField(source='country.name_ar', read_only=True)

    class Meta:
        model  = City
        fields = ['id', 'name', 'name_ar', 'name_en', 'country', 'country_name',
                  'admin1', 'latitude', 'longitude', 'population',
                  'description', 'image', 'geoname_id']
