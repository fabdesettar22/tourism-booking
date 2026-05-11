from rest_framework import serializers
from .models import FlightRoute, FlightOffer, FlightBookingRequest


class FlightRouteSerializer(serializers.ModelSerializer):
    offers_count = serializers.IntegerField(source="offers.count", read_only=True)

    class Meta:
        model = FlightRoute
        fields = [
            "id", "origin_iata", "destination_iata",
            "departure_date", "return_date",
            "adults", "children", "cabin_class",
            "commission_percentage", "currency",
            "display_title", "provider",
            "is_active", "last_refreshed_at",
            "offers_count", "created_at", "updated_at",
        ]
        read_only_fields = ["last_refreshed_at", "provider", "created_at", "updated_at"]


class FlightOfferAdminSerializer(serializers.ModelSerializer):
    """Admin view — exposes base_amount and commission."""
    class Meta:
        model = FlightOffer
        fields = [
            "id", "route", "provider_offer_id",
            "owner_iata", "owner_name",
            "base_amount", "base_currency",
            "commission_amount", "total_amount",
            "total_duration_min", "slices_summary",
            "expires_at", "fetched_at",
        ]


class FlightOfferPublicSerializer(serializers.ModelSerializer):
    """Public view — hides base_amount/commission. Customer sees only total."""
    price = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2, read_only=True)
    currency = serializers.CharField(source="base_currency", read_only=True)

    class Meta:
        model = FlightOffer
        fields = [
            "id", "owner_iata", "owner_name",
            "price", "currency",
            "total_duration_min", "slices_summary",
            "expires_at",
        ]


class FlightRoutePublicSerializer(serializers.ModelSerializer):
    title = serializers.SerializerMethodField()
    cheapest_price = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()

    class Meta:
        model = FlightRoute
        fields = [
            "id", "origin_iata", "destination_iata",
            "departure_date", "return_date",
            "adults", "children", "cabin_class",
            "title", "cheapest_price", "currency",
        ]

    def get_title(self, obj):
        if obj.display_title:
            return obj.display_title
        return f"{obj.origin_iata} → {obj.destination_iata}"

    def get_cheapest_price(self, obj):
        cheapest = obj.offers.order_by("total_amount").first()
        return str(cheapest.total_amount) if cheapest else None

    def get_currency(self, obj):
        cheapest = obj.offers.order_by("total_amount").first()
        return cheapest.base_currency if cheapest else obj.currency


class FlightBookingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlightBookingRequest
        fields = [
            "id", "offer",
            "customer_name", "customer_email", "customer_phone",
            "passport_number", "passenger_count", "notes",
            "status", "admin_notes",
            "created_at", "updated_at",
        ]
        read_only_fields = ["status", "admin_notes", "created_at", "updated_at"]


class FlightBookingRequestAdminSerializer(serializers.ModelSerializer):
    class Meta:
        model = FlightBookingRequest
        fields = "__all__"
        read_only_fields = ["created_at", "updated_at"]
