# apps/waitlist/views.py

import logging
from rest_framework.views     import APIView
from rest_framework.response  import Response
from rest_framework           import status
from rest_framework.parsers   import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny

from .models import (
    PropertyWaitlist, TransportWaitlist, RestaurantWaitlist,
    GuideWaitlist, ActivityWaitlist, WellnessWaitlist, OtherServiceWaitlist,
)
from .serializers import (
    PropertyWaitlistSerializer, TransportWaitlistSerializer,
    RestaurantWaitlistSerializer, GuideWaitlistSerializer,
    ActivityWaitlistSerializer, WellnessWaitlistSerializer,
    OtherServiceWaitlistSerializer,
)
from django.contrib.auth       import get_user_model
from rest_framework              import permissions
from rest_framework.permissions  import IsAuthenticated

from apps.notifications.models   import Notification
from .services                   import (
    send_confirmation_email,
    send_waitlist_approved_email,
    send_waitlist_rejected_email,
)

User = get_user_model()
logger = logging.getLogger(__name__)


class IsHQAdmin(permissions.BasePermission):
    """مشرف أو مدير عام."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('super_admin', 'admin')
        )


def get_client_ip(request) -> str:
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def get_device_type(request) -> str:
    ua = request.META.get('HTTP_USER_AGENT', '').lower()
    if any(k in ua for k in ('mobile', 'android', 'iphone')):
        return 'mobile'
    if 'tablet' in ua or 'ipad' in ua:
        return 'tablet'
    return 'desktop'


class WaitlistBaseView(APIView):
    """
    Base View مشترك لكل أنواع الـ Waitlist
    """
    permission_classes = [AllowAny]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]
    serializer_class   = None
    supplier_type      = None

    def post(self, request):
        data = request.data.copy()
        data['supplier_type'] = self.supplier_type

        # UTM من query params
        for utm in ('utm_source', 'utm_medium', 'utm_campaign'):
            if not data.get(utm):
                data[utm] = request.GET.get(utm, '')

        serializer = self.serializer_class(data=data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors':  serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        instance = serializer.save(
            ip_address  = get_client_ip(request),
            device_type = get_device_type(request),
        )

        # إرسال إيميل التأكيد
        email_sent = send_confirmation_email(instance)

        logger.info(
            f'[Waitlist] تسجيل جديد | type={self.supplier_type} | '
            f'ref={instance.ref_number} | email={instance.email} | '
            f'email_sent={email_sent}'
        )

        # ═══════════════════════════════════════════
        # إشعار in-app للأدمن
        # ═══════════════════════════════════════════
        try:
            supplier_label = dict(instance._meta.get_field('supplier_type').choices).get(
                self.supplier_type, self.supplier_type
            ) if hasattr(instance._meta.get_field('supplier_type'), 'choices') else self.supplier_type
            admins = User.objects.filter(
                role__in=['super_admin', 'admin'],
                is_active=True,
            )
            Notification.objects.bulk_create([
                Notification(
                    recipient=a,
                    type='new_supplier',
                    title=f'مورّد جديد: {getattr(instance, "name", getattr(instance, "business_name", ""))}',
                    message=f'{self.supplier_type} من {getattr(instance, "country", "—")}. رقم المرجع: {instance.ref_number}',
                    link='/dashboard?tab=registrations',
                )
                for a in admins
            ])
            logger.info(f'🔔 {admins.count()} notifications created for new supplier')
        except Exception as e:
            logger.error(f'Failed to create supplier notifications: {e}')


        return Response({
            'success':    True,
            'ref_number': instance.ref_number,
            'email_sent': email_sent,
            'message': {
                'en': 'Registration successful! Check your email for confirmation.',
                'ar': 'تم التسجيل بنجاح! تحقق من بريدك الإلكتروني للتأكيد.',
                'ms': 'Pendaftaran berjaya! Semak e-mel anda untuk pengesahan.',
            },
        }, status=status.HTTP_201_CREATED)


# ── Property ──────────────────────────────────────────────

class PropertyWaitlistView(WaitlistBaseView):
    serializer_class = PropertyWaitlistSerializer
    supplier_type    = 'PROPERTY'


# ── Transport ─────────────────────────────────────────────

class TransportWaitlistView(WaitlistBaseView):
    serializer_class = TransportWaitlistSerializer
    supplier_type    = 'TRANSPORT'


# ── Restaurant ────────────────────────────────────────────

class RestaurantWaitlistView(WaitlistBaseView):
    serializer_class = RestaurantWaitlistSerializer
    supplier_type    = 'RESTAURANT'


# ── Guide ─────────────────────────────────────────────────

class GuideWaitlistView(WaitlistBaseView):
    serializer_class = GuideWaitlistSerializer
    supplier_type    = 'GUIDE'


# ── Activity ──────────────────────────────────────────────

class ActivityWaitlistView(WaitlistBaseView):
    serializer_class = ActivityWaitlistSerializer
    supplier_type    = 'ACTIVITY'


# ── Wellness ──────────────────────────────────────────────

class WellnessWaitlistView(WaitlistBaseView):
    serializer_class = WellnessWaitlistSerializer
    supplier_type    = 'WELLNESS'


# ── Other Services ────────────────────────────────────────

class OtherServiceWaitlistView(WaitlistBaseView):
    serializer_class = OtherServiceWaitlistSerializer
    supplier_type    = 'OTHER'


# ── Stats (Admin) ─────────────────────────────────────────

class WaitlistStatsView(APIView):
    """
    إحصائيات عامة للـ Waitlist — للـ Admin فقط
    """
    def get(self, request):
        if not request.user.is_staff:
            return Response({'detail': 'غير مصرح.'}, status=status.HTTP_403_FORBIDDEN)

        stats = {
            'property':   PropertyWaitlist.objects.count(),
            'transport':  TransportWaitlist.objects.count(),
            'restaurant': RestaurantWaitlist.objects.count(),
            'guide':      GuideWaitlist.objects.count(),
            'activity':   ActivityWaitlist.objects.count(),
            'wellness':   WellnessWaitlist.objects.count(),
            'other':      OtherServiceWaitlist.objects.count(),
        }
        stats['total'] = sum(stats.values())

        pending = {
            'property':   PropertyWaitlist.objects.filter(status='PENDING').count(),
            'transport':  TransportWaitlist.objects.filter(status='PENDING').count(),
            'restaurant': RestaurantWaitlist.objects.filter(status='PENDING').count(),
            'guide':      GuideWaitlist.objects.filter(status='PENDING').count(),
            'activity':   ActivityWaitlist.objects.filter(status='PENDING').count(),
            'wellness':   WellnessWaitlist.objects.filter(status='PENDING').count(),
            'other':      OtherServiceWaitlist.objects.filter(status='PENDING').count(),
        }
        pending['total'] = sum(pending.values())

        return Response({
            'total':   stats,
            'pending': pending,
        })


# ═══════════════════════════════════════════════════════════
# Admin Views — قائمة + قبول + رفض كل الموردين (موحَّد)
# ═══════════════════════════════════════════════════════════

# استيراد كل models لاستخدامها في لوحة الأدمن
_WAITLIST_MODELS = {
    'property':   (PropertyWaitlist,     'property'),
    'transport':  (TransportWaitlist,    'transport'),
    'restaurant': (RestaurantWaitlist,   'restaurant'),
    'guide':      (GuideWaitlist,        'guide'),
    'activity':   (ActivityWaitlist,     'activity'),
    'wellness':   (WellnessWaitlist,     'wellness'),
    'other':      (OtherServiceWaitlist, 'other'),
}


def _serialize_waitlist_item(obj, supplier_type_key, request):
    """تحويل أي waitlist model إلى dict موحَّد للـ Frontend."""
    def safe(field):
        return getattr(obj, field, None) or ''
    
    def file_url(field):
        f = getattr(obj, field, None)
        if f and hasattr(f, 'url'):
            try:
                return request.build_absolute_uri(f.url)
            except Exception:
                return None
        return None

    return {
        'id':                   str(obj.id),
        'ref_number':           getattr(obj, 'ref_number', ''),
        'company_name':         safe('name') or safe('business_name'),
        'supplier_type':        supplier_type_key,
        'email':                safe('email'),
        'phone':                safe('phone'),
        'country':              safe('country'),
        'city':                 safe('city'),
        'address':              safe('address'),
        'contact_person_name':  safe('contact_person_name') or safe('owner_name'),
        'created_at':           obj.created_at.isoformat() if hasattr(obj, 'created_at') else '',
        'status':               getattr(obj, 'status', 'PENDING'),
    }


class SupplierWaitlistPendingListView(APIView):
    """
    GET /api/v1/waitlist/admin/pending/

    قائمة كل الموردين المعلّقين من كل الأنواع السبعة.
    """
    permission_classes = [IsHQAdmin]

    def get(self, request):
        all_items = []
        for key, (model, type_key) in _WAITLIST_MODELS.items():
            try:
                qs = model.objects.filter(status='PENDING').order_by('-created_at')
                for obj in qs:
                    all_items.append(_serialize_waitlist_item(obj, type_key, request))
            except Exception as e:
                logger.error(f'Error fetching {key}: {e}')

        # ترتيب الكل حسب created_at
        all_items.sort(key=lambda x: x.get('created_at', ''), reverse=True)

        return Response({
            'count':     len(all_items),
            'suppliers': all_items,
        })


class SupplierWaitlistApproveView(APIView):
    """
    POST /api/v1/waitlist/admin/<str:type>/<uuid:pk>/approve/
    """
    permission_classes = [IsHQAdmin]

    def post(self, request, type, pk):
        model_info = _WAITLIST_MODELS.get(type.lower())
        if not model_info:
            return Response({'error': f'نوع مورّد غير معروف: {type}'},
                            status=status.HTTP_400_BAD_REQUEST)
        Model, _ = model_info

        try:
            obj = Model.objects.get(id=pk)
        except Model.DoesNotExist:
            return Response({'error': 'الطلب غير موجود.'},
                            status=status.HTTP_404_NOT_FOUND)

        if obj.status == 'APPROVED':
            return Response({'error': 'تمت الموافقة مسبقاً.'},
                            status=status.HTTP_400_BAD_REQUEST)

        obj.status = 'APPROVED'
        obj.save(update_fields=['status', 'updated_at'] if hasattr(obj, 'updated_at') else ['status'])

        logger.info(f'✅ Supplier waitlist approved: {type}/{pk}')

        # إرسال إيميل قبول للمورد
        email_sent = False
        try:
            email_sent = send_waitlist_approved_email(obj)
        except Exception as e:
            logger.error(f'Failed to send approval email to {obj.email}: {e}')

        return Response({
            'message':    'تمت الموافقة على الطلب.',
            'id':         str(obj.id),
            'type':       type,
            'email_sent': email_sent,
        })


class SupplierWaitlistRejectView(APIView):
    """
    POST /api/v1/waitlist/admin/<str:type>/<uuid:pk>/reject/
    Body: { "reason": "..." }
    """
    permission_classes = [IsHQAdmin]

    def post(self, request, type, pk):
        model_info = _WAITLIST_MODELS.get(type.lower())
        if not model_info:
            return Response({'error': f'نوع مورّد غير معروف: {type}'},
                            status=status.HTTP_400_BAD_REQUEST)
        Model, _ = model_info

        try:
            obj = Model.objects.get(id=pk)
        except Model.DoesNotExist:
            return Response({'error': 'الطلب غير موجود.'},
                            status=status.HTTP_404_NOT_FOUND)

        reason = (request.data.get('reason') or '').strip()
        if len(reason) < 10:
            return Response({'error': 'السبب يجب أن يكون 10 أحرف على الأقل.'},
                            status=status.HTTP_400_BAD_REQUEST)

        obj.status = 'REJECTED'
        if hasattr(obj, 'notes'):
            obj.notes = reason
            obj.save(update_fields=['status', 'notes', 'updated_at'] if hasattr(obj, 'updated_at') else ['status', 'notes'])
        else:
            obj.save(update_fields=['status'])

        logger.info(f'🚫 Supplier waitlist rejected: {type}/{pk}')

        # إرسال إيميل رفض للمورد
        email_sent = False
        try:
            email_sent = send_waitlist_rejected_email(obj, reason)
        except Exception as e:
            logger.error(f'Failed to send rejection email to {obj.email}: {e}')

        return Response({
            'message':    'تم رفض الطلب.',
            'reason':     reason,
            'email_sent': email_sent,
        })
