from rest_framework import serializers
from ..models import Country, City   # تأكد أن models.py موجود في locations

class CountrySerializer(serializers.ModelSerializer):
    class Meta:
        model = Country
        fields = ['id', 'name']

class CitySerializer(serializers.ModelSerializer):
    image = serializers.ImageField(required=False)   # للسماح برفع الصورة

    class Meta:
        model = City
        fields = ['id', 'name', 'country', 'description', 'image']