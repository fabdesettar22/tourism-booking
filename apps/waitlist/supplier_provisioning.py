"""
Supplier Account Provisioning — يُنشئ حساب User + Supplier للمورد
بعد موافقة الأدمن على طلب Waitlist.

يُستخدَم من signals.py في كل الـ 7 signals (Property + 6 services).
"""
import logging

from django.db import transaction

from apps.accounts.models import User
from apps.suppliers.models import Supplier, SupplierType, SupplierStatus
from apps.accounts.services.email_service import send_supplier_welcome_email

logger = logging.getLogger(__name__)


# ═══════════════════════════════════════════════════════════
# خريطة من اسم نموذج Waitlist إلى SupplierType
# ═══════════════════════════════════════════════════════════
WAITLIST_TO_SUPPLIER_TYPE = {
    'PropertyWaitlist':     SupplierType.PROPERTY,
    'TransportWaitlist':    SupplierType.TRANSPORT,
    'RestaurantWaitlist':   SupplierType.RESTAURANT,
    'GuideWaitlist':        SupplierType.GUIDE,
    'ActivityWaitlist':     SupplierType.ACTIVITY,
    'WellnessWaitlist':     SupplierType.WELLNESS,
    'OtherServiceWaitlist': SupplierType.TOUR,  # نضع OTHER في TOUR كأقرب نوع
}


def _get_or_create_supplier_user(waitlist_instance):
    """
    يُرجع User بدور supplier — إن وُجد سابقاً، يُحدّثه. إن لا، يُنشئه.
    لا يُعيّن كلمة سر (سيدخل عبر OTP).
    """
    email = waitlist_instance.email.strip().lower()
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'username': email,  # username = email
            'role':     'supplier',
            'is_active': True,
            'first_name': waitlist_instance.full_name.split(' ', 1)[0] if waitlist_instance.full_name else '',
            'last_name':  waitlist_instance.full_name.split(' ', 1)[1] if ' ' in (waitlist_instance.full_name or '') else '',
            'phone':      getattr(waitlist_instance, 'phone', '') or '',
        },
    )
    if created:
        user.set_unusable_password()  # لا كلمة سر — OTP فقط
        user.save(update_fields=['password'])
        logger.info(f'✅ Supplier User created: {email}')
    elif user.role != 'supplier':
        # ترقية المستخدم إلى مورد إن كان موجوداً بدور آخر
        user.role = 'supplier'
        user.save(update_fields=['role'])
    return user, created


def _get_or_create_supplier_profile(user, waitlist_instance):
    """يُرجع Supplier — إن وُجد سابقاً، يُحدّثه. إن لا، يُنشئه."""
    waitlist_class_name = type(waitlist_instance).__name__
    supplier_type = WAITLIST_TO_SUPPLIER_TYPE.get(waitlist_class_name, SupplierType.TOUR)

    supplier, created = Supplier.objects.get_or_create(
        user=user,
        defaults={
            'supplier_type':       supplier_type,
            'status':              SupplierStatus.APPROVED,
            'company_name':        waitlist_instance.company_name or waitlist_instance.full_name,
            'country':             waitlist_instance.country or 'Malaysia',
            'city':                waitlist_instance.city or '',
            'phone':               waitlist_instance.phone,
            'email':               waitlist_instance.email,
            'default_currency':    getattr(waitlist_instance, 'currency', 'MYR') or 'MYR',
            'waitlist_id':         waitlist_instance.pk,
        },
    )
    return supplier, created


def provision_supplier_account(waitlist_instance, hotel_or_service):
    """
    يُنشئ حساب كامل للمورد:
    1. User (role='supplier', is_active=True, no password)
    2. Supplier profile (status=APPROVED)
    3. ربط Supplier ↔ Hotel أو Service
    4. إرسال إيميل ترحيب + شرح الدخول

    آمن للاستدعاء عدة مرات (idempotent).
    """
    try:
        with transaction.atomic():
            user, user_created = _get_or_create_supplier_user(waitlist_instance)
            supplier, supplier_created = _get_or_create_supplier_profile(user, waitlist_instance)

            # ربط Supplier بالكيان المُنشأ
            is_hotel = hasattr(hotel_or_service, 'stars')
            if is_hotel:
                supplier.created_hotel = hotel_or_service
            else:
                supplier.created_service = hotel_or_service

            if not supplier.waitlist_id:
                supplier.waitlist_id = waitlist_instance.pk

            supplier.save(update_fields=['created_hotel', 'created_service', 'waitlist_id', 'updated_at'])

        # إرسال الإيميل خارج الـ transaction (إن فشل لا يُلغي الإنشاء)
        if user_created:
            try:
                send_supplier_welcome_email(user, hotel_or_service)
                logger.info(f'✅ Welcome email sent to {user.email}')
            except Exception as e:
                logger.error(f'❌ Failed to send welcome email to {user.email}: {e}')

        return user, supplier
    except Exception as e:
        logger.error(f'❌ provision_supplier_account failed for {waitlist_instance.ref_number}: {e}')
        raise
