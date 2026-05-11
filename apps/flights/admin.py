from django.contrib import admin
from .models import FlightRoute, FlightOffer, FlightSearchLog, FlightBookingRequest


@admin.register(FlightRoute)
class FlightRouteAdmin(admin.ModelAdmin):
    list_display = ("origin_iata", "destination_iata", "departure_date", "cabin_class",
                    "commission_percentage", "currency", "is_active", "last_refreshed_at")
    list_filter = ("is_active", "cabin_class", "currency", "provider")
    search_fields = ("origin_iata", "destination_iata", "display_title")
    readonly_fields = ("last_refreshed_at", "created_at", "updated_at")


@admin.register(FlightOffer)
class FlightOfferAdmin(admin.ModelAdmin):
    list_display = ("route", "owner_iata", "base_amount", "commission_amount",
                    "total_amount", "base_currency", "fetched_at")
    list_filter = ("base_currency", "owner_iata")
    search_fields = ("provider_offer_id", "owner_name")
    readonly_fields = ("raw_payload", "fetched_at")


@admin.register(FlightSearchLog)
class FlightSearchLogAdmin(admin.ModelAdmin):
    list_display = ("route", "status", "offers_count", "duration_ms", "created_at")
    list_filter = ("status",)
    readonly_fields = ("created_at",)


@admin.register(FlightBookingRequest)
class FlightBookingRequestAdmin(admin.ModelAdmin):
    list_display = ("customer_name", "offer", "status", "passenger_count", "created_at")
    list_filter = ("status",)
    search_fields = ("customer_name", "customer_email", "customer_phone")
    readonly_fields = ("created_at", "updated_at")
