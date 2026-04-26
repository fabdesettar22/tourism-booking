# apps/waitlist_agency/views.py

import logging
from django.contrib.auth       import get_user_model
from django.utils                import timezone
from rest_framework.views        import APIView
from rest_framework.response     import Response
from rest_framework              import status, permissions
from rest_framework.parsers      import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions  import AllowAny, IsAuthenticated

from apps.notifications.models   import Notification
from .models                     import AgencyWaitlist
from .serializers                import AgencyWaitlistSerializer
from .services                   import send_confirmation_email

User = get_user_model()
logger = logging.getLogger(__name__)


# ── Permission: HQ Admin ────────────────────────────────

class IsHQAdmin(permissions.BasePermission):
    """مشرف أو مدير عام."""
    def has_permission(self, request, view):
        return bool(
            request.user and request.user.is_authenticated
            and request.user.role in ('super_admin', 'admin')
        )


# ── Helpers ───────────────────────────────────────────────

def get_client_ip(request) -> str:
    """استخراج IP المستخدم من الـ request."""
    x_forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded:
        return x_forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR', '')


def get_device_type(request) -> str:
    """تحديد نوع الجهاز من User-Agent."""
    ua = request.META.get('HTTP_USER_AGENT', '').lower()
    if any(k in ua for k in ('mobile', 'android', 'iphone')):
        return 'mobile'
    if 'tablet' in ua or 'ipad' in ua:
        return 'tablet'
    return 'desktop'


# ── Registration View ─────────────────────────────────────

class AgencyWaitlistRegisterView(APIView):
    """
    POST /api/v1/waitlist-agency/register/

    تسجيل وكالة جديدة في قائمة الانتظار.
    عام (AllowAny) - أي زائر يستطيع التسجيل.
    يدعم multipart/form-data لرفع الوثائق.
    """
    permission_classes = [AllowAny]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        data = request.data

        # UTM params من query string إن لم تكن في body
        for utm in ('utm_source', 'utm_medium', 'utm_campaign'):
            if not data.get(utm):
                data[utm] = request.GET.get(utm, '')

        serializer = AgencyWaitlistSerializer(data=data)

        if not serializer.is_valid():
            return Response({
                'success': False,
                'errors':  serializer.errors,
            }, status=status.HTTP_400_BAD_REQUEST)

        # حفظ السجل مع البيانات التلقائية
        instance = serializer.save(
            ip_address  = get_client_ip(request),
            device_type = get_device_type(request),
        )

        # إرسال إيميل التأكيد (لا يُوقف التسجيل إن فشل)
        email_sent = send_confirmation_email(instance)

        logger.info(
            f'[AgencyWaitlist] تسجيل جديد | ref={instance.ref_number} | '
            f'agency={instance.name} | email={instance.email} | email_sent={email_sent}'
        )

        # ═══════════════════════════════════════════
        # إشعار in-app للأدمن (بدل إيميل)
        # ═══════════════════════════════════════════
        try:
            admins = User.objects.filter(
                role__in=['super_admin', 'admin'],
                is_active=True,
            )
            Notification.objects.bulk_create([
                Notification(
                    recipient=a,
                    type='new_agency',
                    title=f'وكالة جديدة: {instance.name}',
                    message=f'{instance.name} من {instance.country} طلبت الانضمام. رقم المرجع: {instance.ref_number}',
                    link='/dashboard?tab=registrations',
                )
                for a in admins
            ])
            logger.info(f'🔔 {admins.count()} in-app notifications for new agency: {instance.name}')
        except Exception as e:
            logger.error(f'Failed to create notifications: {e}')

        return Response({
            'success':    True,
            'ref_number': instance.ref_number,
            'email_sent': email_sent,
            'message': {
                'en': 'Registration received! We will review your documents and contact you soon.',
                'ar': 'تم استلام طلبك! سنراجع وثائقك ونتواصل معك قريباً.',
                'ms': 'Pendaftaran diterima! Kami akan menyemak dokumen anda dan menghubungi anda.',
            },
        }, status=status.HTTP_201_CREATED)


# ── Stats View (Admin only) ───────────────────────────────

class AgencyWaitlistStatsView(APIView):
    """
    GET /api/v1/waitlist-agency/stats/

    إحصائيات الوكالات في Waitlist - للـ Admin فقط.
    """

    def get(self, request):
        if not request.user.is_authenticated or not request.user.is_staff:
            return Response(
                {'detail': 'غير مصرح.'},
                status=status.HTTP_403_FORBIDDEN
            )

        total = AgencyWaitlist.objects.count()

        by_status = {
            'pending':   AgencyWaitlist.objects.filter(status='PENDING').count(),
            'contacted': AgencyWaitlist.objects.filter(status='CONTACTED').count(),
            'approved':  AgencyWaitlist.objects.filter(status='APPROVED').count(),
            'rejected':  AgencyWaitlist.objects.filter(status='REJECTED').count(),
        }

        email_delivery = {
            'sent':   AgencyWaitlist.objects.filter(email_sent=True).count(),
            'failed': AgencyWaitlist.objects.filter(email_sent=False).count(),
        }

        return Response({
            'total':          total,
            'by_status':      by_status,
            'email_delivery': email_delivery,
        })


# ═══════════════════════════════════════════════════════════
# Admin Views — قائمة + قبول + رفض
# ═══════════════════════════════════════════════════════════

class AgencyWaitlistPendingListView(APIView):
    """
    GET /api/v1/waitlist-agency/admin/pending/

    قائمة الوكالات المعلّقة للمراجعة (للأدمن فقط).
    """
    permission_classes = [IsHQAdmin]

    def get(self, request):
        qs = AgencyWaitlist.objects.filter(status='PENDING').order_by('-created_at')

        agencies = [
            {
                'id'                     : str(w.id),
                'ref_number'             : w.ref_number,
                'name'                   : w.name,
                'email'                  : w.email,
                'phone'                  : w.phone,
                'country'                : w.country,
                'city'                   : w.city,
                'address'                : w.address,
                'website'                : w.website,
                'registration_number'    : w.registration_number,
                'contact_person_name'    : w.contact_person_name,
                'contact_person_position': w.contact_person_position,
                'contact_person_phone'   : w.contact_person_phone,
                'trade_license'          : request.build_absolute_uri(w.trade_license.url) if w.trade_license else None,
                'owner_id_document'      : request.build_absolute_uri(w.owner_id_document.url) if w.owner_id_document else None,
                'logo'                   : request.build_absolute_uri(w.logo.url) if w.logo else None,
                'created_at'             : w.created_at.isoformat(),
                'status'                 : w.status,
                'agency_type'            : 'b2b2c',  # افتراضي
            }
            for w in qs
        ]

        return Response({
            'count':    qs.count(),
            'agencies': agencies,
        })


class AgencyWaitlistApproveView(APIView):
    """
    POST /api/v1/waitlist-agency/admin/<uuid:pk>/approve/

    قبول طلب وكالة — ينشئ Agency حقيقية و AgencyActivationToken،
    ويُرسل إيميل تفعيل للوكالة.
    Body (optional): { "commission_rate": 10.0 }
    """
    permission_classes = [IsHQAdmin]

    def post(self, request, pk):
        try:
            waitlist = AgencyWaitlist.objects.get(id=pk)
        except AgencyWaitlist.DoesNotExist:
            return Response({'error': 'الطلب غير موجود.'}, status=status.HTTP_404_NOT_FOUND)

        if waitlist.status == 'APPROVED':
            return Response({'error': 'تمت الموافقة مسبقاً.'}, status=status.HTTP_400_BAD_REQUEST)

        # استيراد داخلي لتجنّب circular imports
        from apps.accounts.models import Agency, AgencyActivationToken
        from apps.accounts.services.email_service import send_agency_approved_email

        commission = request.data.get('commission_rate', 10.0)
        try:
            commission = float(commission)
            if not (0 <= commission <= 100):
                raise ValueError
        except (ValueError, TypeError):
            return Response({'error': 'نسبة العمولة غير صحيحة.'}, status=status.HTTP_400_BAD_REQUEST)

        # إنشاء Agency من بيانات Waitlist
        agency = Agency.objects.create(
            name                    = waitlist.name,
            email                   = waitlist.email,
            phone                   = waitlist.phone,
            address                 = waitlist.address,
            commission_rate         = commission,
            status                  = 'active',
            is_active               = True,
            approved_at             = timezone.now(),
            approved_by             = request.user,
            registration_number     = waitlist.registration_number or '',
            country                 = waitlist.country,
            city                    = waitlist.city,
            contact_person_name     = waitlist.contact_person_name,
            contact_person_position = waitlist.contact_person_position,
        )
        if waitlist.logo:
            agency.logo = waitlist.logo
            agency.save()

        # تحديث حالة Waitlist
        waitlist.status = 'APPROVED'
        waitlist.save(update_fields=['status', 'updated_at'])

        # توليد activation token
        token_obj = AgencyActivationToken.objects.create(agency=agency)

        # إرسال إيميل القبول للوكالة
        email_sent = False
        try:
            email_sent = send_agency_approved_email(agency, token_obj)
        except Exception as e:
            logger.error(f'Failed to send approval email: {e}')

        logger.info(f'✅ Waitlist approved: {waitlist.name} (ref={waitlist.ref_number})')

        return Response({
            'message'         : f'تمت الموافقة على "{waitlist.name}".',
            'agency_id'       : agency.id,
            'activation_token': token_obj.token,
            'email_sent'      : email_sent,
        })


class AgencyWaitlistRejectView(APIView):
    """
    POST /api/v1/waitlist-agency/admin/<uuid:pk>/reject/
    Body: { "reason": "..." } (10 chars+)
    """
    permission_classes = [IsHQAdmin]

    def post(self, request, pk):
        try:
            waitlist = AgencyWaitlist.objects.get(id=pk)
        except AgencyWaitlist.DoesNotExist:
            return Response({'error': 'الطلب غير موجود.'}, status=status.HTTP_404_NOT_FOUND)

        reason = (request.data.get('reason') or '').strip()
        if len(reason) < 10:
            return Response(
                {'error': 'سبب الرفض يجب أن يكون 10 أحرف على الأقل.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        waitlist.status = 'REJECTED'
        waitlist.notes  = reason
        waitlist.save(update_fields=['status', 'notes', 'updated_at'])

        logger.info(f'🚫 Waitlist rejected: {waitlist.name} (ref={waitlist.ref_number})')

        return Response({
            'message': f'تم رفض طلب "{waitlist.name}".',
            'reason' : reason,
        })
