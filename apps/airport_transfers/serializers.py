from rest_framework import serializers
from .models import Airport, AirportTransfer, AirportTransferPhoto


class AirportTransferPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AirportTransferPhoto
        fields = ['id', 'image', 'is_primary', 'order', 'caption', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class AirportSerializer(serializers.ModelSerializer):
    city_name = serializers.SerializerMethodField()

    class Meta:
        model = Airport
        fields = ['id', 'code', 'name', 'city', 'city_name', 'is_active']
        read_only_fields = ['id']

    def get_city_name(self, obj):
        return obj.city.name if obj.city else None


class AirportTransferReadSerializer(serializers.ModelSerializer):
    airport_detail = AirportSerializer(source='airport', read_only=True)
    photos         = AirportTransferPhotoSerializer(many=True, read_only=True)
    primary_photo  = serializers.SerializerMethodField()
    hotel_name     = serializers.CharField(source='hotel.name', read_only=True)
    hotel_city     = serializers.CharField(source='hotel.city.name', read_only=True)
    country_name   = serializers.CharField(source='country.name', read_only=True, default=None)
    country_code   = serializers.CharField(source='country.iso2', read_only=True, default=None)
    city_name      = serializers.CharField(source='city.name',    read_only=True, default=None)
    service_name   = serializers.CharField(source='service.name', read_only=True)
    service_id     = serializers.IntegerField(source='service.id', read_only=True)

    class Meta:
        model  = AirportTransfer
        fields = [
            'service_id', 'service_name',
            'airport', 'airport_detail',
            'hotel', 'hotel_name', 'hotel_city',
            'country', 'country_name', 'country_code',
            'city', 'city_name',
            'price_pax_1_2', 'price_pax_3_4', 'price_pax_5_6',
            'price_pax_7_8', 'price_pax_10_12', 'price_pax_14',
            'price_pax_40_bus',
            'margin_pct_1_2', 'margin_pct_3_4', 'margin_pct_5_6',
            'margin_pct_7_8', 'margin_pct_10_12', 'margin_pct_14',
            'margin_pct_40_bus',
            'tour_guide_fee_myr', 'tour_guide_margin_pct', 'currency', 'notes',
            'description_ar', 'description_en',
            'photos', 'primary_photo',
        ]

    def get_primary_photo(self, obj):
        primary = obj.photos.filter(is_primary=True).first() or obj.photos.first()
        if not primary:
            return None
        request = self.context.get('request')
        url = primary.image.url
        return request.build_absolute_uri(url) if request else url


class AirportTransferWriteSerializer(serializers.ModelSerializer):
    """للإنشاء والتحديث — يتحقق أن سعراً واحداً على الأقل غير فارغ."""

    class Meta:
        model  = AirportTransfer
        fields = [
            'service', 'airport', 'hotel',
            'country', 'city',
            'price_pax_1_2', 'price_pax_3_4', 'price_pax_5_6',
            'price_pax_7_8', 'price_pax_10_12', 'price_pax_14',
            'price_pax_40_bus',
            'margin_pct_1_2', 'margin_pct_3_4', 'margin_pct_5_6',
            'margin_pct_7_8', 'margin_pct_10_12', 'margin_pct_14',
            'margin_pct_40_bus',
            'tour_guide_fee_myr', 'tour_guide_margin_pct', 'notes',
            'description_ar', 'description_en',
        ]

    def validate(self, data):
        price_fields = [
            'price_pax_1_2', 'price_pax_3_4', 'price_pax_5_6',
            'price_pax_7_8', 'price_pax_10_12', 'price_pax_14',
            'price_pax_40_bus',
        ]
        instance = self.instance
        any_set = False
        for f in price_fields:
            new_val = data.get(f, getattr(instance, f, None) if instance else None)
            if new_val is not None:
                any_set = True
                break
        if not any_set:
            raise serializers.ValidationError(
                'يجب تحديد سعر واحد على الأقل في إحدى شرائح pax'
            )
        return data


class AirportTransferQuoteSerializer(serializers.Serializer):
    """مدخلات endpoint /quote/."""
    pax = serializers.IntegerField(min_value=1, max_value=40)
    direction = serializers.ChoiceField(choices=[
        ('to_hotel',   'مطار → فندق'),
        ('to_airport', 'فندق → مطار'),
        ('round_trip', 'ذهاب وعودة'),
    ])
    include_tour_guide = serializers.BooleanField(default=False)
