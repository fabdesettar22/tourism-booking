from django.db import models
from django.db.models import Avg, Count
from rest_framework import viewsets, permissions, decorators, response
from .models import Review
from .serializers import ReviewSerializer


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    queryset = Review.objects.filter(is_published=True).select_related("user", "hotel", "service")

    def get_permissions(self):
        if self.action in {"list", "retrieve", "stats"}:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        qs = super().get_queryset()
        hotel_id = self.request.query_params.get("hotel")
        service_id = self.request.query_params.get("service")
        if hotel_id:
            qs = qs.filter(hotel_id=hotel_id)
        if service_id:
            qs = qs.filter(service_id=service_id)
        if self.request.query_params.get("verified") == "true":
            qs = qs.filter(verified=True)
        return qs

    def perform_destroy(self, instance):
        # Authors can delete their own; staff can delete any
        if instance.user_id != self.request.user.id and not self.request.user.is_staff:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("Only the author or staff can delete this review.")
        instance.delete()

    @decorators.action(detail=False, methods=["get"])
    def stats(self, request):
        """Aggregate stats for a hotel or service: avg rating, counts per star."""
        qs = self.get_queryset()
        agg = qs.aggregate(
            avg=Avg("rating"),
            count=Count("id"),
            verified_count=Count("id", filter=models.Q(verified=True)),
        ) if qs.exists() else {"avg": None, "count": 0, "verified_count": 0}
        breakdown = {i: qs.filter(rating=i).count() for i in range(1, 6)}
        return response.Response({**agg, "breakdown": breakdown})
