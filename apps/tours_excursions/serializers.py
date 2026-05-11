from rest_framework import serializers
from .models import Tour, TourPhoto


class TourPhotoSerializer(serializers.ModelSerializer):
    class Meta:
        model  = TourPhoto
        fields = ['id', 'image', 'is_primary', 'order', 'caption', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_at']


class TourReadSerializer(serializers.ModelSerializer):
    tour_type_display     = serializers.CharField(source='get_tour_type_display', read_only=True)
    duration_display      = serializers.CharField(source='get_duration_display',  read_only=True)
    origin_city_name      = serializers.CharField(source='origin_city.name',      read_only=True, default=None)
    destination_city_name = serializers.CharField(source='destination_city.name', read_only=True, default=None)
    country_name          = serializers.CharField(source='country.name',  read_only=True, default=None)
    country_code          = serializers.CharField(source='country.iso2',  read_only=True, default=None)
    city_name             = serializers.CharField(source='city.name',     read_only=True, default=None)
    service_name          = serializers.CharField(source='service.name',          read_only=True)
    service_id            = serializers.IntegerField(source='service.id',          read_only=True)
    photos                = TourPhotoSerializer(many=True, read_only=True)
    primary_photo         = serializers.SerializerMethodField()

    class Meta:
        model  = Tour
        fields = [
            'service_id', 'service_name',
            'tour_type', 'tour_type_display',
            'duration',  'duration_display',
            'country', 'country_name', 'country_code',
            'city',    'city_name',
            'origin_city', 'origin_city_name', 'origin_text',
            'destination_city', 'destination_city_name', 'destination_text',
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


class TourWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Tour
        fields = [
            'service', 'tour_type', 'duration',
            'country', 'city',
            'origin_city', 'origin_text',
            'destination_city', 'destination_text',
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
        instance = self.instance
        any_set = False
        for f in [
            'price_pax_1_2', 'price_pax_3_4', 'price_pax_5_6',
            'price_pax_7_8', 'price_pax_10_12', 'price_pax_14',
            'price_pax_40_bus',
        ]:
            new_val = data.get(f, getattr(instance, f, None) if instance else None)
            if new_val is not None:
                any_set = True; break
        if not any_set:
            raise serializers.ValidationError('يجب تحديد سعر واحد على الأقل في إحدى شرائح pax')
        return data


class TourQuoteSerializer(serializers.Serializer):
    pax = serializers.IntegerField(min_value=1, max_value=40)
    direction = serializers.ChoiceField(choices=[
        ('one_way',    'اتجاه واحد'),
        ('round_trip', 'ذهاب وعودة'),
    ], default='one_way')
    include_tour_guide = serializers.BooleanField(default=False)
