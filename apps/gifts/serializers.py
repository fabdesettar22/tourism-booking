from rest_framework import serializers
from .models import Gift, GiftPhoto


class GiftPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = GiftPhoto
        fields = ['id', 'image', 'is_primary', 'order', 'caption', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class GiftReadSerializer(serializers.ModelSerializer):
    subcategory_display = serializers.CharField(source='get_subcategory_display', read_only=True)
    service_name        = serializers.CharField(source='service.name', read_only=True)
    service_id          = serializers.IntegerField(source='service.id',  read_only=True)
    photos              = GiftPhotoSerializer(many=True, read_only=True)
    primary_photo       = serializers.SerializerMethodField()

    class Meta:
        model  = Gift
        fields = [
            'service_id', 'service_name',
            'subcategory', 'subcategory_display',
            'default_is_mandatory',
            'base_price', 'currency', 'profit_margin_pct',
            'description_ar', 'description_en',
            'notes',
            'photos', 'primary_photo',
        ]

    def get_primary_photo(self, obj):
        primary = obj.photos.filter(is_primary=True).first() or obj.photos.first()
        if not primary:
            return None
        request = self.context.get('request')
        url = primary.image.url
        return request.build_absolute_uri(url) if request else url


class GiftWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Gift
        fields = [
            'service', 'subcategory',
            'default_is_mandatory',
            'base_price', 'profit_margin_pct',
            'description_ar', 'description_en',
            'notes',
        ]


class GiftQuoteSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1, max_value=999, default=1)
