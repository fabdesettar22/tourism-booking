# apps/suppliers/signals.py

from django.db.models.signals import post_save
from django.db.models import Q
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


# ═══════════════════════════════════════════════════════════
# HotelSupplier → Hotel Auto-Creation (DISABLED - Step 1)
# ═══════════════════════════════════════════════════════════
# هذا الـ signal مُعطَّل لأن:
#   1. كان يستخدم Q(label__...) و Country بلا حقل label
#   2. سنعتمد على PropertyWaitlist بدلاً من HotelSupplier
# سنبني signal جديد على PropertyWaitlist في الخطوة 7
# ═══════════════════════════════════════════════════════════
