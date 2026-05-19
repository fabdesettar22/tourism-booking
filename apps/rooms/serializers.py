# apps/rooms/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import RoomType


class RoomTypeSerializer(serializers.ModelSerializer):
    hotel_name            = serializers.SerializerMethodField()
    current_price         = serializers.SerializerMethodField()
    child_with_bed_price  = serializers.SerializerMethodField()
    infant_with_bed_price = serializers.SerializerMethodField()
    tax_per_night         = serializers.SerializerMethodField()

    class Meta:
        model  = RoomType
        fields = [
            'id', 'hotel', 'hotel_name', 'name',
            'max_occupancy', 'description', 'image', 'breakfast_included',
            'current_price', 'child_with_bed_price', 'infant_with_bed_price',
            'tax_per_night',
        ]
        read_only_fields = ['id']

    def _get_room_price(self, obj):
        if not hasattr(obj, '_cached_room_price'):
            from apps.pricing.models import Season, RoomPrice
            today = timezone.now().date()
            season = Season.objects.filter(
                hotel_id=obj.hotel_id,
                valid_from__lte=today,
                valid_to__gte=today,
            ).first()
            rp = None
            if season:
                rp = RoomPrice.objects.filter(season=season, room_type=obj).first()
            obj._cached_room_price = rp
        return obj._cached_room_price

    def get_hotel_name(self, obj) -> str:
        return obj.hotel.name if obj.hotel else None

    def get_current_price(self, obj):
        rp = self._get_room_price(obj)
        return str(rp.price_per_night) if rp else None

    def get_child_with_bed_price(self, obj):
        rp = self._get_room_price(obj)
        return str(rp.child_with_bed_price) if rp and rp.child_with_bed_price else None

    def get_infant_with_bed_price(self, obj):
        rp = self._get_room_price(obj)
        return str(rp.infant_with_bed_price) if rp and rp.infant_with_bed_price else None

    def get_tax_per_night(self, obj):
        if obj.hotel and obj.hotel.tax_per_night_per_room:
            return str(obj.hotel.tax_per_night_per_room)
        return '0'
