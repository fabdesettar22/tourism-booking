# apps/accounts/views/agency_views.py

import logging
from django.utils import timezone
from django.db import transaction
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.models import Agency, AgencyActivationToken
from apps.accounts.serializers.agency_serializers import (
    AgencyRegisterSerializer,
    AgencyCreatedResponseSerializer,
    AgencyActivationSerializer,
    AgencyListSerializer,
    AgencyUpdateSerializer,
)
from apps.accounts.services.email_service import (
    send_agency_pending_email,
    send_agency_approved_email,
    send_agency_rejected_email,
    send_admin_new_agency_notification,
)

logger = logging.getLogger('apps.accounts')


# ═══════════════════════════════════════════════════════════
# Permissions — صلاحية HQ فقط
# ═══════════════════════════════════════════════════════════

class IsHQAdmin(permissions.BasePermission):
    """صلاحية المدير العام أو المشرف."""
    message = "هذه العملية متاحة لإدارة الوكالة الأم فقط."

    def has_permission(self, request, view) -> bool:
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in ('super_admin', 'admin')
        )


# ═══════════════════════════════════════════════════════════
# Token Helper
# ═══════════════════════════════════════════════════════════

def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['role']   = user.role
    refresh['email']  = user.email
    if user.agency_id:
        refresh['agency_id'] = str(user.agency_id)
    return {
        'refresh': str(refresh),
        'access' : str(refresh.access_token),
    }


# ═══════════════════════════════════════════════════════════
# 1) AGENCY REGISTRATION — تسجيل الوكالة (عام، بدون auth)
# ═══════════════════════════════════════════════════════════

class AgencyRegisterView(APIView):
    """
    POST /api/v1/accounts/register/agency/

    يستقبل بيانات الوكالة + الوثائق (multipart/form-data).
    ينشئ Agency فقط بحالة pending.
    لا يُنشئ User في هذه المرحلة (بعد الموافقة فقط).
    
    بعد الإنشاء:
    - إيميل للوكالة: "طلبك قيد المراجعة"
    - إيميل للمسؤولين: "وكالة جديدة بانتظار المراجعة"
    """
    permission_classes = [AllowAny]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def post(self, request):
        serializer = AgencyRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        agency = serializer.save()
        logger.info(f"✅ New agency registered: {agency.name} ({agency.id})")

        # ═══════════════════════════════════════
        # 📧 إرسال الإيميلات (آمن — لا يكسر الـ API)
        # ═══════════════════════════════════════
        
        # 1. إيميل للوكالة — تأكيد استلام الطلب
        try:
            send_agency_pending_email(agency)
        except Exception as e:
            logger.error(f"Failed to send pending email to {agency.email}: {e}")
            # نُكمل حتى لو فشل الإيميل — الطلب محفوظ في DB
        
        # 2. إشعار in-app للمسؤولين — وكالة جديدة
        try:
            from apps.notifications.models import Notification
            from django.contrib.auth import get_user_model
            U = get_user_model()
            admins = U.objects.filter(
                role__in=['super_admin', 'admin'],
                is_active=True,
            )
            notifications = [
                Notification(
                    recipient=admin,
                    type='new_agency',
                    title=f'وكالة جديدة: {agency.name}',
                    message=f'{agency.name} من {agency.country} تقدّمت بطلب تسجيل. يرجى المراجعة.',
                    link='/dashboard?tab=registrations',
                    reference_id=agency.id,
                )
                for admin in admins
            ]
            Notification.objects.bulk_create(notifications)
            logger.info(f"🔔 Created {len(notifications)} in-app notifications for new agency: {agency.name}")
        except Exception as e:
            logger.error(f"Failed to create in-app notifications for {agency.name}: {e}")

        response_data = AgencyCreatedResponseSerializer(agency).data
        return Response({
            'message'  : 'تم استلام طلب التسجيل. ستصلك رسالة خلال 1-3 أيام عمل بعد مراجعة الوثائق.',
            'agency'   : response_data,
            'next_step': 'wait_for_approval',
        }, status=status.HTTP_201_CREATED)


# ═══════════════════════════════════════════════════════════
# 2) HQ — قائمة الوكالات المعلّقة للمراجعة
# ═══════════════════════════════════════════════════════════

class HQAgencyPendingListView(APIView):
    """
    GET /api/v1/accounts/admin/agencies/pending/
    قائمة الوكالات المعلّقة (status='pending') — لـ HQ فقط.
    """
    permission_classes = [IsHQAdmin]

    def get(self, request):
        qs = Agency.objects.filter(status='pending').order_by('-created_at')
        data = [{
            'id'                 : str(a.id),
            'name'               : a.name,
            'name_en'            : a.name_en,
            'email'              : a.email,
            'phone'              : a.phone,
            'country'            : a.country,
            'city'               : a.city,
            'registration_number': a.registration_number,
            'agency_type'        : a.agency_type,
            'contact_person_name': a.contact_person_name,
            'trade_license'      : request.build_absolute_uri(a.trade_license.url) if a.trade_license else None,
            'tax_certificate'    : request.build_absolute_uri(a.tax_certificate.url) if a.tax_certificate else None,
            'owner_id_document'  : request.build_absolute_uri(a.owner_id_document.url) if a.owner_id_document else None,
            'logo'               : request.build_absolute_uri(a.logo.url) if a.logo else None,
            'created_at'         : a.created_at,
        } for a in qs]

        return Response({
            'count'   : len(data),
            'agencies': data,
        })


# ═══════════════════════════════════════════════════════════
# 3) HQ — اعتماد الوكالة + توليد activation token
# ═══════════════════════════════════════════════════════════

class HQAgencyApproveView(APIView):
    """
    POST /api/v1/accounts/admin/agencies/<uuid:agency_id>/approve/

    Body (optional):
      {
        "commission_rate": 12.5  // إذا لم تُحدَّد، تبقى الافتراضية (10%)
      }

    يضبط status=active، يُولِّد AgencyActivationToken،
    ويُرسَل إيميل للوكالة برابط التفعيل.
    """
    permission_classes = [IsHQAdmin]

    @transaction.atomic
    def post(self, request, agency_id):
        try:
            agency = Agency.objects.get(id=agency_id)
        except Agency.DoesNotExist:
            return Response(
                {'error': 'الوكالة غير موجودة.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if agency.status == 'active':
            return Response(
                {'error': 'الوكالة معتمدة بالفعل.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # تحديث الحالة والعمولة
        commission_rate = request.data.get('commission_rate')
        if commission_rate is not None:
            try:
                commission_rate = float(commission_rate)
                if not (0 <= commission_rate <= 100):
                    raise ValueError
                agency.commission_rate = commission_rate
            except (ValueError, TypeError):
                return Response(
                    {'error': 'commission_rate يجب أن يكون رقماً بين 0 و 100.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        agency.status      = 'active'
        agency.is_active   = True
        agency.approved_at = timezone.now()
        agency.approved_by = request.user
        agency.rejection_reason = ''
        agency.save()

        # إنشاء activation token (يحذف القديم إن وُجد)
        AgencyActivationToken.objects.filter(agency=agency).delete()
        token_obj = AgencyActivationToken.objects.create(agency=agency)

        logger.info(f"✅ Agency approved: {agency.name} by {request.user.username}")

        # ═══════════════════════════════════════
        # 📧 إرسال إيميل القبول + رابط التفعيل
        # ═══════════════════════════════════════
        email_sent = False
        try:
            email_sent = send_agency_approved_email(agency, token_obj)
            if email_sent:
                logger.info(f"✅ Approval email sent to {agency.email}")
            else:
                logger.warning(f"⚠️ Approval email failed for {agency.email}")
        except Exception as e:
            logger.error(f"Failed to send approval email to {agency.email}: {e}")

        activation_url = f"/activate-agency?token={token_obj.token}"

        return Response({
            'message'         : f'تمت الموافقة على الوكالة "{agency.name}" وإرسال رابط التفعيل.',
            'agency_id'       : str(agency.id),
            'activation_token': token_obj.token,
            'activation_url'  : activation_url,
            'expires_at'      : token_obj.expires_at,
            'commission_rate' : float(agency.commission_rate),
            'email_sent'      : email_sent,
        }, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════
# 4) HQ — رفض الوكالة
# ═══════════════════════════════════════════════════════════

class HQAgencyRejectView(APIView):
    """
    POST /api/v1/accounts/admin/agencies/<uuid:agency_id>/reject/

    Body:
      { "reason": "السبب التفصيلي..." }

    يضبط status=rejected، يحفظ السبب، ويُرسَل إيميل للوكالة.
    """
    permission_classes = [IsHQAdmin]

    def post(self, request, agency_id):
        try:
            agency = Agency.objects.get(id=agency_id)
        except Agency.DoesNotExist:
            return Response(
                {'error': 'الوكالة غير موجودة.'},
                status=status.HTTP_404_NOT_FOUND
            )

        reason = (request.data.get('reason') or '').strip()
        if len(reason) < 10:
            return Response(
                {'error': 'يجب توضيح سبب الرفض (10 أحرف على الأقل).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if agency.status == 'rejected':
            return Response(
                {'error': 'الوكالة مرفوضة بالفعل.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        agency.status           = 'rejected'
        agency.is_active        = False
        agency.rejection_reason = reason
        agency.approved_at      = None
        agency.approved_by      = None
        agency.save(update_fields=[
            'status', 'is_active', 'rejection_reason',
            'approved_at', 'approved_by', 'updated_at',
        ])

        logger.info(f"❌ Agency rejected: {agency.name} by {request.user.username} — reason: {reason[:50]}")

        # ═══════════════════════════════════════
        # 📧 إرسال إيميل الرفض + السبب
        # ═══════════════════════════════════════
        email_sent = False
        try:
            email_sent = send_agency_rejected_email(agency, reason)
            if email_sent:
                logger.info(f"✅ Rejection email sent to {agency.email}")
        except Exception as e:
            logger.error(f"Failed to send rejection email to {agency.email}: {e}")

        return Response({
            'message'   : f'تم رفض الوكالة "{agency.name}".',
            'agency_id' : str(agency.id),
            'reason'    : reason,
            'email_sent': email_sent,
        })


# ═══════════════════════════════════════════════════════════
# 5) ACTIVATION — الوكالة تضع username + password
# ═══════════════════════════════════════════════════════════

class AgencyActivationView(APIView):
    """
    POST /api/v1/accounts/agency/activate/

    Body:
      {
        "token"           : "<64-char token from email>",
        "username"        : "my_agency",
        "password"        : "SecurePass123",
        "password_confirm": "SecurePass123"
      }

    يُنشئ User للوكالة ويُرجع JWT tokens لتسجيل الدخول التلقائي.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = AgencyActivationSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST
            )

        user = serializer.save()
        logger.info(f"✅ Agency activated: {user.username} for agency {user.agency.name}")

        tokens = get_tokens_for_user(user)

        return Response({
            'message': 'تم تفعيل حسابك بنجاح. مرحباً بك في MYBRIDGE.',
            'tokens' : tokens,
            'user'   : {
                'id'         : user.id,
                'username'   : user.username,
                'email'      : user.email,
                'role'       : user.role,
                'agency_id'  : str(user.agency_id) if user.agency_id else None,
                'agency_name': user.agency.name if user.agency else None,
            },
        }, status=status.HTTP_200_OK)


# ═══════════════════════════════════════════════════════════
# 6) CHECK TOKEN — للواجهة الأمامية للتحقق من الـ token قبل عرض النموذج
# ═══════════════════════════════════════════════════════════

class AgencyActivationCheckView(APIView):
    """
    GET /api/v1/accounts/agency/activate/check/?token=<xxx>

    يتحقق من صلاحية token قبل عرض نموذج التفعيل للمستخدم.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        token = request.query_params.get('token', '').strip()
        if not token:
            return Response(
                {'valid': False, 'error': 'token مطلوب.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            token_obj = AgencyActivationToken.objects.select_related('agency').get(
                token=token
            )
        except AgencyActivationToken.DoesNotExist:
            return Response(
                {'valid': False, 'error': 'رمز التفعيل غير صالح.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if not token_obj.is_valid:
            return Response({
                'valid': False,
                'error': 'رمز التفعيل مُستخدم أو منتهي الصلاحية.',
            })

        return Response({
            'valid'      : True,
            'agency_name': token_obj.agency.name,
            'email'      : token_obj.agency.email,
            'expires_at' : token_obj.expires_at,
        })

# ═══════════════════════════════════════════════════════════
# 7) CRUD — إدارة الوكالات من Admin Dashboard
# ═══════════════════════════════════════════════════════════

class HQAgencyListView(APIView):
    """
    GET /api/v1/accounts/admin/agencies/

    قائمة كل الوكالات (approved + pending + rejected + suspended).
    فلاتر اختيارية:
      ?status=active|pending|rejected|suspended
      ?search=<keyword>  (يبحث في name, email, registration_number)
    """
    permission_classes = [IsHQAdmin]

    def get(self, request):
        qs = Agency.objects.all().order_by('-created_at')

        # فلتر الحالة
        status_filter = request.query_params.get('status', '').strip()
        if status_filter in ('pending', 'active', 'rejected', 'suspended'):
            qs = qs.filter(status=status_filter)

        # بحث نصّي
        search = request.query_params.get('search', '').strip()
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search)
                | Q(name_en__icontains=search)
                | Q(email__icontains=search)
                | Q(registration_number__icontains=search)
            )

        serializer = AgencyListSerializer(qs, many=True, context={'request': request})
        return Response({
            'count'   : qs.count(),
            'agencies': serializer.data,
        })


class HQAgencyDetailView(APIView):
    """
    GET    /api/v1/accounts/admin/agencies/<uuid:agency_id>/
    PATCH  /api/v1/accounts/admin/agencies/<uuid:agency_id>/
    DELETE /api/v1/accounts/admin/agencies/<uuid:agency_id>/
    """
    permission_classes = [IsHQAdmin]

    def _get_agency(self, agency_id):
        try:
            return Agency.objects.get(id=agency_id)
        except Agency.DoesNotExist:
            return None

    # ── GET ────────────────────────────────────────
    def get(self, request, agency_id):
        agency = self._get_agency(agency_id)
        if not agency:
            return Response(
                {'error': 'الوكالة غير موجودة.'},
                status=status.HTTP_404_NOT_FOUND
            )
        serializer = AgencyListSerializer(agency, context={'request': request})
        return Response(serializer.data)

    # ── PATCH ──────────────────────────────────────
    def patch(self, request, agency_id):
        agency = self._get_agency(agency_id)
        if not agency:
            return Response(
                {'error': 'الوكالة غير موجودة.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = AgencyUpdateSerializer(agency, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        logger.info(f"✏️ Agency updated: {agency.name} by {request.user.username}")

        # نُرجع البيانات الكاملة باستخدام AgencyListSerializer
        full = AgencyListSerializer(agency, context={'request': request})
        return Response({
            'message': 'تم تحديث بيانات الوكالة بنجاح.',
            'agency' : full.data,
        })

    # ── DELETE (soft) ──────────────────────────────
    def delete(self, request, agency_id):
        """
        Soft delete — لا نحذف الوكالة فعلياً لحماية البيانات التاريخية.
        فقط نضبط:
          - status = 'suspended'
          - is_active = False
        يمكن إعادة التفعيل لاحقاً.
        """
        agency = self._get_agency(agency_id)
        if not agency:
            return Response(
                {'error': 'الوكالة غير موجودة.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if agency.status == 'suspended':
            return Response(
                {'error': 'الوكالة موقوفة بالفعل.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        agency.status    = 'suspended'
        agency.is_active = False
        agency.save()

        logger.info(f"🚫 Agency suspended: {agency.name} by {request.user.username}")

        return Response({
            'message'  : f'تم تعطيل الوكالة "{agency.name}".',
            'agency_id': str(agency.id),
            'status'   : agency.status,
        })


class HQAgencyCreateView(APIView):
    """
    POST /api/v1/accounts/admin/agencies/

    يُتيح للأدمن إنشاء وكالة مباشرة (يتجاوز flow الموافقة العادي).
    الوكالة المُنشأة تكون status='active' مباشرة.
    يُرسَل إيميل تفعيل للوكالة لإنشاء username + password.
    """
    permission_classes = [IsHQAdmin]

    @transaction.atomic
    def post(self, request):
        # نستخدم AgencyRegisterSerializer الموجود
        serializer = AgencyRegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        agency = serializer.save()

        # تفعيل مباشر (يتجاوز مرحلة pending)
        agency.status      = 'active'
        agency.is_active   = True
        agency.approved_at = timezone.now()
        agency.approved_by = request.user
        agency.save()

        # إنشاء activation token
        token_obj = AgencyActivationToken.objects.create(agency=agency)

        logger.info(f"➕ Agency created directly by admin: {agency.name}")

        # إرسال إيميل
        try:
            send_agency_approved_email(agency, token_obj)
        except Exception as e:
            logger.error(f"Failed to send activation email: {e}")

        response_serializer = AgencyListSerializer(agency, context={'request': request})
        return Response({
            'message'         : 'تم إنشاء الوكالة وإرسال رابط التفعيل.',
            'agency'          : response_serializer.data,
            'activation_token': token_obj.token,
        }, status=status.HTTP_201_CREATED)

