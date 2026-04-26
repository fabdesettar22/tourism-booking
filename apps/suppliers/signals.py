# apps/suppliers/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import (
    RoomRateSupplier, FlightRateSupplier,
    TourRateSupplier, TransferRateSupplier,
    ContentStatus
)


def _auto_approve(instance, rate_model, pk):
    """إذا كان المورد موثوقاً، اعتمد المحتوى تلقائياً."""
    if instance.content_status == ContentStatus.DRAFT:
        rate_model.objects.filter(pk=pk).update(
            content_status=ContentStatus.APPROVED
        )


@receiver(post_save, sender=RoomRateSupplier)
def approve_room_rate(sender, instance, created, **kwargs):
    if created and instance.room_type.hotel.supplier.is_trusted:
        _auto_approve(instance, RoomRateSupplier, instance.pk)


@receiver(post_save, sender=FlightRateSupplier)
def approve_flight_rate(sender, instance, created, **kwargs):
    if created and instance.route.supplier.is_trusted:
        _auto_approve(instance, FlightRateSupplier, instance.pk)


@receiver(post_save, sender=TourRateSupplier)
def approve_tour_rate(sender, instance, created, **kwargs):
    if created and instance.tour.supplier.is_trusted:
        _auto_approve(instance, TourRateSupplier, instance.pk)


@receiver(post_save, sender=TransferRateSupplier)
def approve_transfer_rate(sender, instance, created, **kwargs):
    if created and instance.route.supplier.is_trusted:
        _auto_approve(instance, TransferRateSupplier, instance.pk)