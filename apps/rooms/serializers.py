# apps/rooms/serializers.py

from rest_framework import serializers
from django.utils import timezone
from .models import RoomType


class RoomTypeSerializer(serializers.ModelSerializer):
    hotel_name              = serializers.SerializerMethodField()
    current_price           = serializers.SerializerMethodField()
    child_with_bed_price    = serializers.SerializerMethodField()
    child_without_bed_price = serializers.SerializerMethodField()

    class Meta:
        model  = RoomType
        fields = [
            'id', 'hotel', 'hotel_name', 'name',
            'max_occupancy', 'description', 'image',
            'breakfast_included',
            'current_price', 'child_with_bed_price', 'child_without_bed_price',
        ]
        read_only_fields = ['id']

    def _get_room_price(self, obj):
        # cache per object to avoid repeated queries in the same request
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

    def get_child_without_bed_price(self, obj):
        rp = self._get_room_price(obj)
        return str(rp.child_without_bed_price) if rp and rp.child_without_bed_price else None
