from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ("rating", "user", "hotel", "service", "verified", "is_published", "created_at")
    list_filter = ("rating", "verified", "is_published", "language")
    search_fields = ("comment", "title", "user__email")
    raw_id_fields = ("user", "hotel", "service", "booking")
