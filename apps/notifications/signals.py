# apps/notifications/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth import get_user_model

from apps.bookings.models import Booking
from apps.accounts.models import Agency

from .models import Notification
from .translations import nt

User = get_user_model()


def _should_notify(recipient, type: str, reference_id: int) -> bool:
    return not Notification.objects.filter(
        recipient    = recipient,
        type         = type,
        reference_id = reference_id,
    ).exists()


def _user_lang(user) -> str:
    return getattr(user, 'language', None) or 'ar'


def notify_admins(*, type: str, title_key: str, message_key: str,
                  reference_id: int, link: str = '', **params):
    """ينشئ إشعاراً لكل أدمن مع الترجمة بلغته المفضلة."""
    admins = User.objects.filter(role__in=['super_admin', 'admin'], is_active=True)
    notifications = []
    for admin in admins:
        if not _should_notify(admin, type, reference_id):
            continue
        lang = _user_lang(admin)
        notifications.append(Notification(
            recipient    = admin,
            type         = type,
            title        = nt(title_key,   lang, **params),
            message      = nt(message_key, lang, **params),
            link         = link,
            reference_id = reference_id,
        ))
    if notifications:
        Notification.objects.bulk_create(notifications)


def notify_user(*, user, type: str, title_key: str, message_key: str,
                reference_id: int, link: str = '', **params):
    if not _should_notify(user, type, reference_id):
        return
    lang = _user_lang(user)
    Notification.objects.create(
        recipient    = user,
        type         = type,
        title        = nt(title_key,   lang, **params),
        message      = nt(message_key, lang, **params),
        link         = link,
        reference_id = reference_id,
    )


# ── حجز جديد ─────────────────────────────────────────────
@receiver(post_save, sender=Booking)
def on_booking_saved(sender, instance, created, **kwargs):
    if not created:
        return
    n = (instance.adults or 0) + (instance.children or 0)
    notify_admins(
        type         = 'new_booking',
        title_key    = 'new_booking.title',
        message_key  = 'new_booking.message_admin',
        reference_id = instance.id,
        link         = '/bookings',
        name         = instance.client_name,
        n            = n,
    )
    if instance.agency:
        for user in User.objects.filter(agency=instance.agency, is_active=True):
            notify_user(
                user         = user,
                type         = 'new_booking',
                title_key    = 'new_booking.title_agency',
                message_key  = 'new_booking.message_agency',
                reference_id = instance.id,
                link         = '/bookings',
                name         = instance.client_name,
            )


# ── تغيير حالة الحجز ─────────────────────────────────────
def notify_booking_status_change(booking: Booking, new_status: str, changed_by):
    STATUS_INDEX = {'confirmed': 0, 'cancelled': 1, 'completed': 2, 'pending': 3}
    idx = STATUS_INDEX.get(new_status, 9)
    reference_id = booking.id * 100 + idx

    if not booking.agency:
        return
    for user in User.objects.filter(agency=booking.agency, is_active=True):
        status_label = nt(f'status.{new_status}', _user_lang(user))
        notify_user(
            user         = user,
            type         = 'booking_status',
            title_key    = 'booking_status.title',
            message_key  = 'booking_status.message',
            reference_id = reference_id,
            link         = '/bookings',
            name         = booking.client_name,
            status       = status_label,
        )


# ── وكالة جديدة ───────────────────────────────────────────
@receiver(post_save, sender=Agency)
def on_agency_saved(sender, instance, created, **kwargs):
    if created:
        notify_admins(
            type         = 'new_agency',
            title_key    = 'new_agency.title',
            message_key  = 'new_agency.message',
            reference_id = instance.id,
            link         = '/agencies',
            name         = instance.name,
        )
        return

    if instance.status == 'active' and instance.approved_at:
        for user in User.objects.filter(agency=instance, is_active=True):
            notify_user(
                user         = user,
                type         = 'agency_approved',
                title_key    = 'agency_approved.title',
                message_key  = 'agency_approved.message',
                reference_id = instance.id,
                link         = '/dashboard',
                name         = instance.name,
            )
    elif instance.status == 'rejected':
        for user in User.objects.filter(agency=instance):
            notify_user(
                user         = user,
                type         = 'agency_rejected',
                title_key    = 'agency_rejected.title',
                message_key  = 'agency_rejected.message',
                reference_id = instance.id,
                link         = '/',
                name         = instance.name,
                reason       = instance.rejection_reason or '',
            )
