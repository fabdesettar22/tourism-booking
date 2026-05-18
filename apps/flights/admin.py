from django.contrib import admin
from .models import FlightRoute


@admin.register(FlightRoute)
class FlightRouteAdmin(admin.ModelAdmin):
    list_display = (
        "origin_iata", "destination_iata", "base_price", "commission_percentage",
        "currency", "is_active", "provider",
    )
    list_filter = ("is_active", "currency", "provider")
    search_fields = ("origin_iata", "destination_iata", "display_title")
    readonly_fields = ("created_at", "updated_at")
