# apps/accounts/views/auth_views.py

import uuid
from django.utils import timezone
from django.core.cache import cache
from rest_framework import status, permissions
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from apps.suppliers.models import Supplier, HotelSupplier, SupplierStatus, ContentStatus
from apps.accounts.serializers.auth_serializers import (
    SupplierStep1Serializer,
    HotelSupplierStep2Serializer,
    HotelSupplierStep3Serializer,
    SupplierStep4Serializer,
    LoginSerializer,
    UserMeSerializer,
    SupplierAdminSerializer,
)
from apps.accounts.services.email_service import (
    send_supplier_verification_email,
    send_supplier_pending_email,
    send_supplier_approved_email,
    send_supplier_rejected_email,
    send_admin_new_supplier_notification,
)


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    refresh['role']  = user.role
    refresh['email'] = user.email
    return {
        'refresh': str(refresh),
        'access' : str(refresh.access_token),
    }


# ─────────────────────────────────────────────
# STEP 1 — إنشاء الحساب
# ─────────────────────────────────────────────

class SupplierRegisterStep1View(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SupplierStep1Serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user, supplier = serializer.save()

        verification_token = str(uuid.uuid4())
        cache_key = f"email_verify_{user.email}"
        cache.set(cache_key, verification_token, timeout=60 * 60 * 24)

        send_supplier_verification_email(user, verification_token)

        return Response({
            'message'    : 'تم إنشاء حسابك. يرجى تأكيد بريدك الإلكتروني.',
            'supplier_id': str(supplier.id),
            'next_step'  : 2,
        }, status=status.HTTP_201_CREATED)


# ─────────────────────────────────────────────
# تأكيد الإيميل
# ─────────────────────────────────────────────

class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        from django.contrib.auth import get_user_model
        User  = get_user_model()
        token = request.data.get('token', '').strip()
        email = request.data.get('email', '').strip().lower()

        if not token or not email:
            return Response(
                {'error': 'البيانات غير مكتملة.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        cache_key    = f"email_verify_{email}"
        stored_token = cache.get(cache_key)

        if not stored_token:
            return Response(
                {'error': 'انتهت صلاحية رابط التأكيد. يرجى طلب رابط جديد.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if stored_token != token:
            return Response(
                {'error': 'رابط التأكيد غير صحيح.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response(
                {'error': 'المستخدم غير موجود.'},
                status=status.HTTP_404_NOT_FOUND
            )

        user.is_active = True
        user.save(update_fields=['is_active'])
        cache.delete(cache_key)

        return Response({
            'message'  : 'تم تأكيد بريدك الإلكتروني بنجاح. يمكنك الآن إكمال تسجيل فندقك.',
            'next_step': 2,
        })


# ─────────────────────────────────────────────
# STEP 2 — بيانات الفندق
# ─────────────────────────────────────────────

class SupplierRegisterStep2View(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            supplier = request.user.supplier_profile
        except Exception:
            return Response(
                {'error': 'لا يوجد بروفايل مورد لهذا الحساب.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if supplier.supplier_type != 'HOTEL':
            return Response(
                {'error': 'هذه الخطوة مخصصة للفنادق فقط.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        hotel_profile, _ = HotelSupplier.objects.get_or_create(
            supplier=supplier,
            defaults={'hotel_name': supplier.company_name}
        )

        serializer = HotelSupplierStep2Serializer(
            hotel_profile, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response({
            'message'  : 'تم حفظ بيانات الفندق.',
            'next_step': 3,
        })


# ─────────────────────────────────────────────
# STEP 3 — المرافق والصور
# ─────────────────────────────────────────────

class SupplierRegisterStep3View(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            supplier      = request.user.supplier_profile
            hotel_profile = supplier.hotel_profile
        except Exception:
            return Response(
                {'error': 'يجب إكمال الخطوة الثانية أولاً.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = HotelSupplierStep3Serializer(
            hotel_profile, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        return Response({
            'message'  : 'تم حفظ المرافق والصور.',
            'next_step': 4,
        })


# ─────────────────────────────────────────────
# STEP 4 — الوثائق + إرسال للمراجعة
# ─────────────────────────────────────────────

class SupplierRegisterStep4View(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            supplier = request.user.supplier_profile
        except Exception:
            return Response(
                {'error': 'لا يوجد بروفايل مورد.'},
                status=status.HTTP_404_NOT_FOUND
            )

        serializer = SupplierStep4Serializer(
            supplier, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        send_admin_new_supplier_notification(supplier)
        send_supplier_pending_email(request.user, supplier)

        return Response({
            'message': 'تم إرسال طلبك للمراجعة. سنتواصل معك خلال 1-3 أيام عمل.',
            'status' : 'PENDING',
        })


# ─────────────────────────────────────────────
# LOGIN
# ─────────────────────────────────────────────

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        user   = serializer.validated_data['user']
        tokens = get_tokens_for_user(user)

        return Response({
            'access' : tokens['access'],
            'refresh': tokens['refresh'],
            'user'   : UserMeSerializer(user).data,
        })


# ─────────────────────────────────────────────
# LOGOUT
# ─────────────────────────────────────────────

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response(
                {'error': 'refresh token مطلوب.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {'error': 'token غير صالح.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        return Response({'message': 'تم تسجيل الخروج بنجاح.'})


# ─────────────────────────────────────────────
# ME
# ─────────────────────────────────────────────

class MeView(APIView):
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        return Response(UserMeSerializer(request.user).data)

    def patch(self, request):
        user = request.user
        for f in ('first_name', 'last_name', 'email', 'phone'):
            if f in request.data:
                setattr(user, f, request.data.get(f))
        if 'avatar' in request.FILES:
            user.avatar = request.FILES['avatar']
        user.save()
        return Response(UserMeSerializer(user).data)


# ─────────────────────────────────────────────
# ADMIN — إدارة الموردين
# ─────────────────────────────────────────────

class SupplierPendingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('super_admin', 'admin'):
            return Response(
                {'error': 'غير مصرح لك.'},
                status=status.HTTP_403_FORBIDDEN
            )

        suppliers = Supplier.objects.filter(
            status=SupplierStatus.PENDING
        ).select_related('user').order_by('-created_at')

        serializer = SupplierAdminSerializer(suppliers, many=True)
        return Response({
            'count'  : suppliers.count(),
            'results': serializer.data,
        })


class SupplierApproveView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, supplier_id):
        if request.user.role not in ('super_admin', 'admin'):
            return Response(
                {'error': 'غير مصرح لك.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            supplier = Supplier.objects.select_related('user').get(id=supplier_id)
        except Supplier.DoesNotExist:
            return Response(
                {'error': 'المورد غير موجود.'},
                status=status.HTTP_404_NOT_FOUND
            )

        if supplier.status == SupplierStatus.APPROVED:
            return Response(
                {'error': 'المورد معتمد مسبقاً.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        supplier.status      = SupplierStatus.APPROVED
        supplier.approved_at = timezone.now()
        supplier.approved_by = request.user
        supplier.save(update_fields=['status', 'approved_at', 'approved_by'])

        supplier.user.is_active = True
        supplier.user.save(update_fields=['is_active'])

        send_supplier_approved_email(supplier.user, supplier)

        return Response({
            'message'    : f'تم اعتماد {supplier.company_name} بنجاح.',
            'supplier_id': str(supplier.id),
            'approved_at': supplier.approved_at,
        })


class SupplierRejectView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, supplier_id):
        if request.user.role not in ('super_admin', 'admin'):
            return Response(
                {'error': 'غير مصرح لك.'},
                status=status.HTTP_403_FORBIDDEN
            )

        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response(
                {'error': 'يجب تحديد سبب الرفض.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            supplier = Supplier.objects.select_related('user').get(id=supplier_id)
        except Supplier.DoesNotExist:
            return Response(
                {'error': 'المورد غير موجود.'},
                status=status.HTTP_404_NOT_FOUND
            )

        supplier.status           = SupplierStatus.REJECTED
        supplier.rejection_reason = reason
        supplier.save(update_fields=['status', 'rejection_reason'])

        send_supplier_rejected_email(supplier.user, supplier, reason)

        return Response({
            'message': f'تم رفض {supplier.company_name}.',
            'reason' : reason,
        })


class SupplierAllListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role not in ('super_admin', 'admin'):
            return Response(
                {'error': 'غير مصرح لك.'},
                status=status.HTTP_403_FORBIDDEN
            )

        qs = Supplier.objects.select_related('user').order_by('-created_at')

        status_filter = request.query_params.get('status')
        if status_filter:
            qs = qs.filter(status=status_filter.upper())

        type_filter = request.query_params.get('type')
        if type_filter:
            qs = qs.filter(supplier_type=type_filter.upper())

        serializer = SupplierAdminSerializer(qs, many=True)
        return Response({
            'count'  : qs.count(),
            'results': serializer.data,
        })


# ═══════════════════════════════════════════════════════════
# OTP AUTH — تسجيل الدخول للموردين عبر رمز إيميل
# ═══════════════════════════════════════════════════════════

class OtpRequestView(APIView):
    """
    POST /api/v1/accounts/otp/request/
    body: { "email": "..." }

    يُولّد رمز 6 أرقام، يُرسله إيميل، ويُسجّله في DB.
    حد أقصى 5 طلبات/ساعة لكل إيميل.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from apps.accounts.models import User, EmailOTP
        from apps.accounts.services.email_service import send_otp_email
        from datetime import timedelta

        email = (request.data.get('email') or '').strip().lower()
        if not email:
            return Response({'error': 'البريد الإلكتروني مطلوب'}, status=400)

        # تحقق أن المستخدم موجود ودوره supplier
        try:
            user = User.objects.get(email=email, role='supplier', is_active=True)
        except User.DoesNotExist:
            # نُرجع نفس الرسالة سواء وُجد أم لا (لمنع enumeration)
            return Response({
                'success': True,
                'expires_in': 600,
                'message': 'إن كان هذا الإيميل مُسجَّلاً، فسيصلك رمز الدخول خلال دقائق.',
            })

        # rate limit: 5 طلبات/ساعة
        one_hour_ago = timezone.now() - timedelta(hours=1)
        recent = EmailOTP.objects.filter(email=email, created_at__gte=one_hour_ago).count()
        if recent >= 5:
            return Response({
                'error': 'تم تجاوز الحد المسموح. حاول مرة أخرى بعد ساعة.',
            }, status=429)

        # إبطال أي OTP صالح سابق لنفس الإيميل
        EmailOTP.objects.filter(email=email, used=False).update(used=True, used_at=timezone.now())

        # إنشاء رمز جديد
        otp = EmailOTP.objects.create(
            email=email,
            ip_address=request.META.get('REMOTE_ADDR'),
        )

        # إرسال الإيميل
        send_otp_email(email, otp.code)

        return Response({
            'success': True,
            'expires_in': 600,
            'message': 'تم إرسال رمز الدخول إلى بريدك الإلكتروني.',
        })


class OtpVerifyView(APIView):
    """
    POST /api/v1/accounts/otp/verify/
    body: { "email": "...", "code": "123456" }

    يتحقق من الرمز ويُرجع JWT tokens.
    """
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        from apps.accounts.models import User, EmailOTP

        email = (request.data.get('email') or '').strip().lower()
        code  = (request.data.get('code') or '').strip()

        if not email or not code:
            return Response({'error': 'البريد الإلكتروني والرمز مطلوبان'}, status=400)

        try:
            otp = EmailOTP.objects.filter(
                email=email, code=code, used=False
            ).order_by('-created_at').first()
        except EmailOTP.DoesNotExist:
            otp = None

        if not otp or not otp.is_valid:
            return Response({'error': 'الرمز غير صحيح أو منتهي الصلاحية'}, status=400)

        # تأكيد المستخدم
        try:
            user = User.objects.get(email=email, role='supplier', is_active=True)
        except User.DoesNotExist:
            return Response({'error': 'الحساب غير موجود'}, status=404)

        # تحديد الرمز كمُستخدم
        otp.mark_used()

        # توليد JWT tokens
        tokens = get_tokens_for_user(user)

        return Response({
            'success': True,
            'tokens': tokens,
            'user': {
                'id':    str(user.id) if hasattr(user, 'id') else user.pk,
                'email': user.email,
                'role':  user.role,
                'first_name': user.first_name,
                'last_name':  user.last_name,
            },
        })


# ═══════════════════════════════════════════════════════════
# SUPPLIER PROFILE — جلب بيانات المورد المسجَّل دخولاً
# ═══════════════════════════════════════════════════════════

class SupplierMeView(APIView):
    """
    GET /api/v1/accounts/supplier/me/

    يُرجع بيانات Supplier المسجَّل + الكيان المرتبط (Hotel/Service).
    يتطلب JWT بدور 'supplier'.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.role != 'supplier':
            return Response({'error': 'صلاحية مورد مطلوبة'}, status=403)

        try:
            supplier = request.user.supplier_profile
        except Supplier.DoesNotExist:
            return Response({'error': 'لا يوجد ملف مورد مرتبط'}, status=404)

        # بيانات Hotel أو Service المرتبطة
        linked = None
        if supplier.created_hotel_id:
            from apps.hotels.serializers.serializers import HotelSerializer
            linked = {
                'kind': 'hotel',
                'data': HotelSerializer(supplier.created_hotel).data,
            }
        elif supplier.created_service_id:
            from apps.services.serializers import ServiceSerializer
            linked = {
                'kind': 'service',
                'data': ServiceSerializer(supplier.created_service).data,
            }

        return Response({
            'user': {
                'id':         request.user.pk,
                'email':      request.user.email,
                'first_name': request.user.first_name,
                'last_name':  request.user.last_name,
                'role':       request.user.role,
            },
            'supplier': {
                'id':            str(supplier.id),
                'supplier_type': supplier.supplier_type,
                'status':        supplier.status,
                'company_name':  supplier.company_name,
                'country':       supplier.country,
                'city':          supplier.city,
                'phone':         supplier.phone,
                'waitlist_id':   str(supplier.waitlist_id) if supplier.waitlist_id else None,
            },
            'linked': linked,
        })
