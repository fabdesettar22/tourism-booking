"""
Signals for waitlist app.

عند موافقة الأدمن على PropertyWaitlist، يُنشأ Hotel تلقائياً
ويُربط بالسجل عبر created_hotel.

القاعدة: city_ref يجب أن يكون موجوداً قبل الموافقة.
"""

from django.db import transaction
from django.db.models.signals import pre_save, post_save
from django.dispatch import receiver
from django.core.exceptions import ValidationError

from .models import PropertyWaitlist


# ═══════════════════════════════════════════════════════════
# Helper: نتتبّع الحالة القديمة قبل الحفظ
# ═══════════════════════════════════════════════════════════

@receiver(pre_save, sender=PropertyWaitlist, dispatch_uid='waitlist_property_track_old_status')
def track_old_status(sender, instance, **kwargs):
    """
    نحفظ الحالة القديمة قبل الحفظ كي نقارنها بالجديدة في post_save.
    """
    if instance.pk:
        try:
            old = PropertyWaitlist.objects.only('status').get(pk=instance.pk)
            instance._old_status = old.status
        except PropertyWaitlist.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


# ═══════════════════════════════════════════════════════════
# Signal الرئيسي: عند تغيير الحالة إلى APPROVED
# ═══════════════════════════════════════════════════════════

@receiver(post_save, sender=PropertyWaitlist, dispatch_uid='waitlist_property_create_hotel_on_approval')
def create_hotel_on_approval(sender, instance, created, **kwargs):
    """
    عند الموافقة على PropertyWaitlist:
    1. نتحقق أن city_ref موجود (وإلا نرفع خطأ)
    2. نتحقق أنه لم يُنشأ فندق مسبقاً (لا تكرار)
    3. نُنشئ Hotel جديد ونربطه بـ created_hotel

    لا نتفاعل مع:
    - السجلات الجديدة (created=True) — فقط التعديلات
    - الحالات الأخرى غير APPROVED
    - السجلات التي لها فندق مسبقاً
    """

    # تخطّي السجلات الجديدة
    if created:
        return

    # تخطّي إن لم تتغيّر الحالة إلى APPROVED
    old_status = getattr(instance, '_old_status', None)
    if instance.status != 'APPROVED' or old_status == 'APPROVED':
        return

    # تخطّي إن كان الفندق مُنشأ مسبقاً
    if instance.created_hotel_id:
        return

    # ─── التحقق: city_ref إجباري ───
    if not instance.city_ref_id:
        raise ValidationError(
            f'لا يمكن الموافقة على الطلب {instance.ref_number}: '
            'يجب تحديد المدينة من القائمة (city_ref) قبل الموافقة.'
        )

    # ─── إنشاء الفندق ───
    from apps.hotels.models import Hotel

    with transaction.atomic():
        hotel = Hotel.objects.create(
            city=instance.city_ref,
            name=instance.company_name or instance.full_name,
            description=getattr(instance, 'description', '') or '',
            email=instance.email or '',
            phone=instance.phone or '',
            stars=instance.star_rating or 3,
            provider_type='direct',
            is_active=False,
        )

        # نقل صور الـ Waitlist إلى HotelPhoto
        _copy_waitlist_photos(instance, 'hotel', hotel)

        # ربط الـ Waitlist بالفندق المُنشأ (بدون تشغيل signals)
        PropertyWaitlist.objects.filter(pk=instance.pk).update(
            created_hotel=hotel
        )
        instance.created_hotel = hotel  # تحديث المثيل الحالي للـ caller

# ═══════════════════════════════════════════════════════════
# Signals لإنشاء Service تلقائياً عند الموافقة
# ═══════════════════════════════════════════════════════════

# ───────────── Helpers ─────────────

def _copy_waitlist_photos(waitlist_instance, target_model_name, target_obj):
    """
    تنسخ صور الـ WaitlistPhoto إلى HotelPhoto أو ServicePhoto.
    target_model_name: 'hotel' أو 'service'
    target_obj: الكيان المُنشأ (Hotel أو Service instance)
    """
    from apps.waitlist.models import WaitlistPhoto
    from django.contrib.contenttypes.models import ContentType

    ct = ContentType.objects.get_for_model(waitlist_instance)
    photos = WaitlistPhoto.objects.filter(
        content_type=ct,
        object_id=waitlist_instance.pk,
    ).order_by('order', 'uploaded_at')

    if not photos.exists():
        return

    if target_model_name == 'hotel':
        from apps.hotels.models import HotelPhoto
        PhotoModel = HotelPhoto
        fk_field = 'hotel'
    else:
        from apps.services.models import ServicePhoto
        PhotoModel = ServicePhoto
        fk_field = 'service'

    primary_image = None
    for wp in photos:
        kwargs = {
            fk_field:   target_obj,
            'image':     wp.image,
            'is_primary': wp.is_primary,
            'order':     wp.order,
            'caption':   wp.caption,
        }
        photo = PhotoModel(**kwargs)
        # نتجاوز save() العادي لتفادي تحديث target_obj.image مرتين
        # سنُحدّثه مرة واحدة في النهاية
        from django.db.models import Model
        Model.save(photo)

        if wp.is_primary:
            primary_image = wp.image

    # تحديث صورة الكيان الرئيسية
    if primary_image:
        type(target_obj).objects.filter(pk=target_obj.pk).update(image=primary_image)
        target_obj.image = primary_image


def _get_first_price(*prices):
    """يرجع أول سعر غير فارغ من قائمة الأسعار."""
    for p in prices:
        if p is not None and p > 0:
            return p
    return None


def _track_old_status_generic(sender, instance, **kwargs):
    """نتتبّع الحالة القديمة (مشترك بين كل الأنواع)."""
    if instance.pk:
        try:
            old = sender.objects.only('status').get(pk=instance.pk)
            instance._old_status = old.status
        except sender.DoesNotExist:
            instance._old_status = None
    else:
        instance._old_status = None


def _should_create_service(instance, created):
    """يحدّد هل يجب إنشاء خدمة الآن."""
    if created:
        return False
    old_status = getattr(instance, '_old_status', None)
    if instance.status != 'APPROVED' or old_status == 'APPROVED':
        return False
    if instance.created_service_id:
        return False
    return True


def _validate_city_ref(instance):
    """يرفع ValidationError إن لم يكن city_ref موجوداً."""
    if not instance.city_ref_id:
        raise ValidationError(
            f'لا يمكن الموافقة على الطلب {instance.ref_number}: '
            'يجب تحديد المدينة من القائمة (city_ref) قبل الموافقة.'
        )


def _get_category(slug):
    """يجلب الفئة الافتراضية حسب slug."""
    from apps.services.models import ServiceCategory
    try:
        return ServiceCategory.objects.get(slug=slug)
    except ServiceCategory.DoesNotExist:
        return None


# ───────────── Transport ─────────────

from .models import (
    TransportWaitlist, RestaurantWaitlist,
    GuideWaitlist, ActivityWaitlist,
    WellnessWaitlist, OtherServiceWaitlist,
)


@receiver(pre_save, sender=TransportWaitlist, dispatch_uid='waitlist_transport_track_status')
def transport_track_old_status(sender, instance, **kwargs):
    _track_old_status_generic(sender, instance, **kwargs)


@receiver(post_save, sender=TransportWaitlist, dispatch_uid='waitlist_transport_create_service')
def transport_create_service_on_approval(sender, instance, created, **kwargs):
    if not _should_create_service(instance, created):
        return
    _validate_city_ref(instance)

    from apps.services.models import Service
    base = _get_first_price(
        instance.price_airport_transfer,
        instance.price_hourly,
        instance.price_intercity,
        instance.price_full_day,
    )

    with transaction.atomic():
        service = Service.objects.create(
            category=_get_category('transport'),
            city=instance.city_ref,
            name=instance.company_name or instance.full_name,
            description='',
            service_type='transport',
            base_price=base,
            currency=instance.currency or 'MYR',
            price_per='unit',
            extra_data={
                'price_airport_transfer': str(instance.price_airport_transfer) if instance.price_airport_transfer else None,
                'price_hourly':           str(instance.price_hourly)           if instance.price_hourly else None,
                'price_intercity':        str(instance.price_intercity)        if instance.price_intercity else None,
                'price_full_day':         str(instance.price_full_day)         if instance.price_full_day else None,
                'transport_type':         instance.transport_type,
                'vehicles_count':         instance.vehicles_count,
                'has_license':            instance.has_license,
                'source_waitlist_ref':    instance.ref_number,
            },
            is_active=False,  # غير نشطة حتى يراجعها الأدمن
        )
        # نقل صور الـ Waitlist إلى ServicePhoto
        _copy_waitlist_photos(instance, 'service', service)

        TransportWaitlist.objects.filter(pk=instance.pk).update(created_service=service)
        instance.created_service = service


# ───────────── Restaurant ─────────────

@receiver(pre_save, sender=RestaurantWaitlist, dispatch_uid='waitlist_restaurant_track_status')
def restaurant_track_old_status(sender, instance, **kwargs):
    _track_old_status_generic(sender, instance, **kwargs)


@receiver(post_save, sender=RestaurantWaitlist, dispatch_uid='waitlist_restaurant_create_service')
def restaurant_create_service_on_approval(sender, instance, created, **kwargs):
    if not _should_create_service(instance, created):
        return
    _validate_city_ref(instance)

    from apps.services.models import Service
    base = _get_first_price(instance.price_per_person, instance.price_set_menu)

    with transaction.atomic():
        service = Service.objects.create(
            category=_get_category('restaurant'),
            city=instance.city_ref,
            name=instance.company_name or instance.full_name,
            description='',
            service_type='meal',
            base_price=base,
            currency=instance.currency or 'MYR',
            price_per='person',
            extra_data={
                'price_per_person': str(instance.price_per_person) if instance.price_per_person else None,
                'price_set_menu':   str(instance.price_set_menu)   if instance.price_set_menu else None,
                'restaurant_type':  instance.restaurant_type,
                'capacity':         instance.capacity,
                'is_halal':         instance.is_halal,
                'source_waitlist_ref': instance.ref_number,
            },
            is_active=False,
        )
        # نقل صور الـ Waitlist إلى ServicePhoto
        _copy_waitlist_photos(instance, 'service', service)

        RestaurantWaitlist.objects.filter(pk=instance.pk).update(created_service=service)
        instance.created_service = service


# ───────────── Guide ─────────────

@receiver(pre_save, sender=GuideWaitlist, dispatch_uid='waitlist_guide_track_status')
def guide_track_old_status(sender, instance, **kwargs):
    _track_old_status_generic(sender, instance, **kwargs)


@receiver(post_save, sender=GuideWaitlist, dispatch_uid='waitlist_guide_create_service')
def guide_create_service_on_approval(sender, instance, created, **kwargs):
    if not _should_create_service(instance, created):
        return
    _validate_city_ref(instance)

    from apps.services.models import Service
    base = _get_first_price(instance.price_full_day, instance.price_half_day, instance.price_hourly)

    with transaction.atomic():
        service = Service.objects.create(
            category=_get_category('guide'),
            city=instance.city_ref,
            name=instance.full_name,
            description='',
            service_type='tour',
            base_price=base,
            currency=instance.currency or 'MYR',
            price_per='person',
            includes_guide=True,
            extra_data={
                'price_full_day':      str(instance.price_full_day) if instance.price_full_day else None,
                'price_half_day':      str(instance.price_half_day) if instance.price_half_day else None,
                'price_hourly':        str(instance.price_hourly)   if instance.price_hourly else None,
                'specialties':         instance.specialties,
                'languages':           instance.languages,
                'experience_years':    instance.experience_years,
                'has_license':         instance.has_license,
                'source_waitlist_ref': instance.ref_number,
            },
            is_active=False,
        )
        # نقل صور الـ Waitlist إلى ServicePhoto
        _copy_waitlist_photos(instance, 'service', service)

        GuideWaitlist.objects.filter(pk=instance.pk).update(created_service=service)
        instance.created_service = service


# ───────────── Activity ─────────────

@receiver(pre_save, sender=ActivityWaitlist, dispatch_uid='waitlist_activity_track_status')
def activity_track_old_status(sender, instance, **kwargs):
    _track_old_status_generic(sender, instance, **kwargs)


@receiver(post_save, sender=ActivityWaitlist, dispatch_uid='waitlist_activity_create_service')
def activity_create_service_on_approval(sender, instance, created, **kwargs):
    if not _should_create_service(instance, created):
        return
    _validate_city_ref(instance)

    from apps.services.models import Service
    base = _get_first_price(instance.price_per_person, instance.price_per_group)

    with transaction.atomic():
        service = Service.objects.create(
            category=_get_category('activity'),
            city=instance.city_ref,
            name=instance.company_name or instance.full_name,
            description='',
            service_type='activity',
            base_price=base,
            currency=instance.currency or 'MYR',
            price_per='person' if instance.price_per_person else 'group',
            max_participants=instance.capacity or 1,
            extra_data={
                'price_per_person':    str(instance.price_per_person) if instance.price_per_person else None,
                'price_per_group':     str(instance.price_per_group)  if instance.price_per_group else None,
                'min_group_size':      instance.min_group_size,
                'activity_types':      instance.activity_types,
                'suitable_kids':       instance.suitable_kids,
                'has_insurance':       instance.has_insurance,
                'source_waitlist_ref': instance.ref_number,
            },
            is_active=False,
        )
        # نقل صور الـ Waitlist إلى ServicePhoto
        _copy_waitlist_photos(instance, 'service', service)

        ActivityWaitlist.objects.filter(pk=instance.pk).update(created_service=service)
        instance.created_service = service


# ───────────── Wellness ─────────────

@receiver(pre_save, sender=WellnessWaitlist, dispatch_uid='waitlist_wellness_track_status')
def wellness_track_old_status(sender, instance, **kwargs):
    _track_old_status_generic(sender, instance, **kwargs)


@receiver(post_save, sender=WellnessWaitlist, dispatch_uid='waitlist_wellness_create_service')
def wellness_create_service_on_approval(sender, instance, created, **kwargs):
    if not _should_create_service(instance, created):
        return
    _validate_city_ref(instance)

    from apps.services.models import Service
    base = _get_first_price(instance.price_per_session, instance.price_package)

    with transaction.atomic():
        service = Service.objects.create(
            category=_get_category('wellness'),
            city=instance.city_ref,
            name=instance.company_name or instance.full_name,
            description='',
            service_type='other',
            base_price=base,
            currency=instance.currency or 'MYR',
            price_per='person',
            duration_hours=(instance.session_duration_min / 60) if instance.session_duration_min else None,
            extra_data={
                'price_per_session':    str(instance.price_per_session) if instance.price_per_session else None,
                'price_package':        str(instance.price_package)     if instance.price_package else None,
                'session_duration_min': instance.session_duration_min,
                'wellness_types':       instance.wellness_types,
                'gender_policy':        instance.gender_policy,
                'is_halal_certified':   instance.is_halal_certified,
                'source_waitlist_ref':  instance.ref_number,
            },
            is_active=False,
        )
        # نقل صور الـ Waitlist إلى ServicePhoto
        _copy_waitlist_photos(instance, 'service', service)

        WellnessWaitlist.objects.filter(pk=instance.pk).update(created_service=service)
        instance.created_service = service


# ───────────── Other Service ─────────────

@receiver(pre_save, sender=OtherServiceWaitlist, dispatch_uid='waitlist_other_track_status')
def other_track_old_status(sender, instance, **kwargs):
    _track_old_status_generic(sender, instance, **kwargs)


@receiver(post_save, sender=OtherServiceWaitlist, dispatch_uid='waitlist_other_create_service')
def other_create_service_on_approval(sender, instance, created, **kwargs):
    if not _should_create_service(instance, created):
        return
    _validate_city_ref(instance)

    from apps.services.models import Service

    with transaction.atomic():
        service = Service.objects.create(
            category=_get_category('other'),
            city=instance.city_ref,
            name=instance.company_name or instance.full_name,
            description=instance.service_description or '',
            service_type='other',
            base_price=instance.base_price,
            currency=instance.currency or 'MYR',
            price_per=instance.price_unit or 'person',
            extra_data={
                'base_price':          str(instance.base_price) if instance.base_price else None,
                'price_unit':          instance.price_unit,
                'pricing_notes':       instance.pricing_notes,
                'service_types':       instance.service_types,
                'target_audience':     instance.target_audience,
                'source_waitlist_ref': instance.ref_number,
            },
            is_active=False,
        )
        # نقل صور الـ Waitlist إلى ServicePhoto
        _copy_waitlist_photos(instance, 'service', service)

        OtherServiceWaitlist.objects.filter(pk=instance.pk).update(created_service=service)
        instance.created_service = service
