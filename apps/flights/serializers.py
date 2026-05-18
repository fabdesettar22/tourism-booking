from decimal import Decimal
from rest_framework import serializers
from .models import FlightRoute, CABIN_CLASS_CHOICES


class FlightRouteSerializer(serializers.ModelSerializer):
    commission_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True,
    )
    final_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True,
    )
    uses_manual_pricing = serializers.BooleanField(read_only=True)

    class Meta:
        model = FlightRoute
        fields = [
            "id", "origin_iata", "destination_iata",
            "base_price", "commission_percentage", "commission_amount", "final_price",
            "currency", "display_title", "provider", "uses_manual_pricing",
            "is_active", "created_at", "updated_at",
        ]
        read_only_fields = [
            "provider", "created_at", "updated_at",
            "commission_amount", "final_price", "uses_manual_pricing",
        ]

    def validate_base_price(self, value):
        if value is not None and value < Decimal("0"):
            raise serializers.ValidationError("base_price must be >= 0.")
        return value

    def validate_commission_percentage(self, value):
        if value < Decimal("0") or value > Decimal("100"):
            raise serializers.ValidationError("commission_percentage must be between 0 and 100.")
        return value


class FlightRoutePublicSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    commission_amount = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True,
    )
    final_price = serializers.DecimalField(
        max_digits=12, decimal_places=2, read_only=True,
    )
    uses_manual_pricing = serializers.BooleanField(read_only=True)

    class Meta:
        model = FlightRoute
        fields = [
            "id", "origin_iata", "destination_iata", "title", "currency",
            "base_price", "commission_percentage", "commission_amount", "final_price",
            "uses_manual_pricing",
        ]

    def get_title(self, obj):
        return obj.display_title or f"{obj.origin_iata} → {obj.destination_iata}"


class FlightSearchInputSerializer(serializers.Serializer):
    origin = serializers.CharField(max_length=3)
    destination = serializers.CharField(max_length=3)
    departure_date = serializers.DateField()
    return_date = serializers.DateField(required=False, allow_null=True)
    adults = serializers.IntegerField(min_value=1, max_value=9, default=1)
    children = serializers.IntegerField(min_value=0, max_value=8, default=0)
    infants = serializers.IntegerField(min_value=0, max_value=4, default=0)
    cabin_class = serializers.ChoiceField(choices=[c[0] for c in CABIN_CLASS_CHOICES], default="economy")
