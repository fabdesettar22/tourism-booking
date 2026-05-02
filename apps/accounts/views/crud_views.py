# apps/accounts/views/crud_views.py
"""
ViewSets للـ CRUD على Agencies و Users.
يُستخدم من Frontend dashboard لعرض الإحصائيات والإدارة.
"""
import logging

from django.db import transaction
from django.utils import timezone

from django.contrib.auth.password_validation import validate_password

from rest_framework import serializers, status
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.viewsets import ModelViewSet

from apps.accounts.models import Agency, User
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin

logger = logging.getLogger(__name__)


# ─── Serializers بسيطة (السيريالايزر القديمة محذوفة) ───────────

class AgencyBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agency
        fields = '__all__'


class UserBriefSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ('password',)


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        if not self.context['request'].user.check_password(value):
            raise serializers.ValidationError('كلمة المرور الحالية غير صحيحة')
        return value

    def validate_new_password(self, value):
        validate_password(value)
        return value

    def save(self):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save(update_fields=['password'])
        return user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data, context={'request': request}
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({'message': 'تم تغيير كلمة المرور بنجاح'})


# ─── ViewSets ───────────────────────────────────────────────────

class AgencyViewSet(ModelViewSet):
    serializer_class = AgencyBriefSerializer
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        user = self.request.user
        if user.is_admin:
            return Agency.objects.all().prefetch_related("employees")
        if user.agency:
            return Agency.objects.filter(pk=user.agency_id)
        return Agency.objects.none()

    def get_permissions(self):
        if self.action in ("list", "create", "destroy", "approve", "reject", "all_agencies"):
            return [IsAdminUser()]
        if self.action in ("update", "partial_update"):
            return [IsAgencyOrAdmin()]
        return [IsAuthenticated()]

    def list(self, request, *args, **kwargs):
        qs = self.get_queryset().filter(status='active')
        return Response(AgencyBriefSerializer(qs, many=True, context={"request": request}).data)

    @action(detail=False, methods=["get"], url_path="all")
    def all_agencies(self, request):
        qs = Agency.objects.all().prefetch_related("employees").order_by("-created_at")
        return Response(AgencyBriefSerializer(qs, many=True, context={"request": request}).data)

    @action(detail=False, methods=["get"], url_path="me", permission_classes=[IsAuthenticated])
    def me(self, request):
        if not request.user.agency:
            return Response({"detail": "لا توجد وكالة مرتبطة بهذا الحساب."}, status=404)
        return Response(AgencyBriefSerializer(request.user.agency, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="approve")
    def approve(self, request, pk=None):
        agency = self.get_object()
        if agency.status == 'active':
            return Response({"detail": "الوكالة معتمدة مسبقاً."}, status=400)

        with transaction.atomic():
            agency.status      = 'active'
            agency.is_active   = True
            agency.approved_at = timezone.now()
            agency.approved_by = request.user
            agency.save(update_fields=["status", "is_active", "approved_at", "approved_by"])
            User.objects.filter(agency=agency).update(is_active=True)

        return Response(AgencyBriefSerializer(agency, context={"request": request}).data)

    @action(detail=True, methods=["post"], url_path="reject")
    def reject(self, request, pk=None):
        agency = self.get_object()
        if agency.status == 'active':
            return Response({"detail": "لا يمكن رفض وكالة معتمدة. استخدم التعطيل."}, status=400)

        reason = request.data.get("reason", "")
        with transaction.atomic():
            agency.status = "rejected"
            agency.is_active = False
            agency.rejection_reason = reason
            agency.save(update_fields=["status", "is_active", "rejection_reason"])
            User.objects.filter(agency=agency).update(is_active=False)

        return Response({"detail": "تم رفض الطلب وتعطيل الحساب.", "reason": reason})

    def destroy(self, request, *args, **kwargs):
        agency = self.get_object()
        agency.is_active = False
        agency.status    = 'rejected'
        agency.save(update_fields=["is_active", "status"])
        return Response({"detail": f'تم تعطيل "{agency.name}".'})


class UserViewSet(ModelViewSet):
    serializer_class = UserBriefSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        qs = User.objects.select_related('agency').order_by('-date_joined')
        role   = self.request.query_params.get('role')
        agency = self.request.query_params.get('agency')
        if role:
            qs = qs.filter(role=role)
        if agency:
            qs = qs.filter(agency_id=agency)
        return qs

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user == request.user:
            return Response({"detail": "لا يمكنك حذف حسابك الخاص."}, status=400)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
