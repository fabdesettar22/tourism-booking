# apps/bookings/views.py

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.db.models import Sum
from django.utils import timezone
from datetime import timedelta
import logging

from .models import Booking
from .serializers import BookingSerializer, BookingCreateSerializer
from apps.accounts.permissions import IsAdminUser, IsAgencyOrAdmin

logger = logging.getLogger(__name__)


class BookingViewSet(viewsets.ModelViewSet):

    def get_permissions(self):
        if self.action in ('list', 'retrieve', 'create'):
            return [IsAgencyOrAdmin()]
        if self.action in ('update', 'partial_update', 'destroy'):
            return [IsAdminUser()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        if self.action in ['create', 'update', 'partial_update']:
            return BookingCreateSerializer
        return BookingSerializer

    def get_queryset(self):
        qs = Booking.objects.prefetch_related(
            'persons', 'cities__hotels', 'cities__city',
            'services__service'
        ).select_related('package', 'country', 'agency', 'created_by')

        user = self.request.user

        if not user.is_admin:
            if user.agency:
                qs = qs.filter(agency=user.agency)
            else:
                return qs.none()

        status_filter = self.request.query_params.get('status')
        booking_type  = self.request.query_params.get('booking_type')
        agency_id     = self.request.query_params.get('agency')

        if status_filter:
            qs = qs.filter(status=status_filter)
        if booking_type:
            qs = qs.filter(booking_type=booking_type)
        if agency_id and user.is_admin:
            qs = qs.filter(agency_id=agency_id)

        return qs.order_by('-created_at')

    def perform_create(self, serializer):
        user = self.request.user
        if user.is_agency_user and user.agency:
            serializer.save(created_by=user, agency=user.agency)
        else:
            serializer.save(created_by=user)

    def create(self, request, *args, **kwargs):
        serializer = BookingCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)
        output = BookingSerializer(serializer.instance, context={'request': request})
        return Response(output.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update-status')
    def update_status(self, request, pk=None):
        booking    = self.get_object()
        new_status = request.data.get('status')
        valid      = [s[0] for s in Booking.STATUS_CHOICES]

        if new_status not in valid:
            return Response({'error': f'الحالة غير صالحة. الخيارات: {valid}'}, status=400)

        if not request.user.is_admin:
            if booking.agency != request.user.agency:
                return Response({'error': 'غير مصرح لك بتعديل هذا الحجز'}, status=403)
            if new_status not in ('cancelled',):
                return Response({'error': 'الوكالة تستطيع فقط إلغاء الحجز'}, status=403)

        old_status = booking.status

        # ── حساب وتثبيت الأسعار عند التأكيد ──────────────────
        if new_status == 'confirmed' and old_status == 'pending':
            try:
                from apps.bookings.services import confirm_booking_prices
                booking = confirm_booking_prices(booking)
                logger.info(f"Booking {booking.reference_number}: تم تثبيت الأسعار — {booking.total_price} {booking.currency}")
            except Exception as e:
                logger.error(f"Booking {booking.reference_number}: فشل تثبيت الأسعار — {e}")

        booking.status = new_status

        try:
            booking.save(update_fields=['status', 'total_price'])
        except Exception as e:
            logger.error(f"Booking {booking.reference_number}: فشل حفظ الحالة — {e}")
            return Response(
                {'error': f'فشل تغيير الحالة: {str(e)}'},
                status=status.HTTP_400_BAD_REQUEST
            )

        logger.info(f"Booking {booking.reference_number}: {old_status} → {new_status} by {request.user.username}")

        # ── إشعار تغيير الحالة ────────────────────────────────
        try:
            from apps.notifications.signals import notify_booking_status_change
            notify_booking_status_change(booking, new_status, request.user)
        except Exception as e:
            logger.warning(f"فشل إرسال الإشعار: {e}")

        booking.refresh_from_db()
        return Response({
            'status':      new_status,
            'message':     'تم تحديث الحالة',
            'total_price': str(booking.total_price) if booking.total_price else None,
        })


class AgencyDashboardStatsView(APIView):
    permission_classes = [IsAgencyOrAdmin]

    def get(self, request):
        user = request.user

        if not user.is_admin and user.agency:
            qs = Booking.objects.filter(agency=user.agency)
        elif user.is_admin:
            agency_id = request.query_params.get('agency')
            qs = Booking.objects.filter(agency_id=agency_id) if agency_id else Booking.objects.all()
        else:
            return Response({'error': 'غير مصرح'}, status=403)

        total     = qs.count()
        pending   = qs.filter(status='pending').count()
        confirmed = qs.filter(status='confirmed').count()
        cancelled = qs.filter(status='cancelled').count()
        completed = qs.filter(status='completed').count()

        persons = qs.aggregate(
            adults=Sum('adults'), children=Sum('children'), infants=Sum('infants')
        )

        commission_rate = 0
        if user.agency:
            commission_rate = float(user.agency.commission_rate)
        elif user.is_admin:
            from apps.accounts.models import Agency
            agency_id = request.query_params.get('agency')
            if agency_id:
                try:
                    commission_rate = float(Agency.objects.get(id=agency_id).commission_rate)
                except Agency.DoesNotExist:
                    pass

        total_revenue = float(qs.filter(
            status__in=['confirmed', 'completed'],
            total_price__isnull=False
        ).aggregate(total=Sum('total_price'))['total'] or 0)

        commission_earned = round(total_revenue * commission_rate / 100, 2)

        today     = timezone.now().date()
        week_data = []
        for i in range(6, -1, -1):
            day   = today - timedelta(days=i)
            count = qs.filter(created_at__date=day).count()
            week_data.append({
                'date':  day.strftime('%Y-%m-%d'),
                'label': ['الإثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت','الأحد'][day.weekday()],
                'count': count,
            })

        recent = qs.select_related('package')[:5].values(
            'id', 'reference_number', 'client_name', 'client_phone',
            'status', 'booking_type', 'adults', 'children', 'infants',
            'total_price', 'currency', 'created_at', 'package__name',
        )

        return Response({
            'stats': {
                'total':             total,
                'pending':           pending,
                'confirmed':         confirmed,
                'cancelled':         cancelled,
                'completed':         completed,
                'total_persons':     (persons['adults'] or 0) + (persons['children'] or 0) + (persons['infants'] or 0),
                'adults':            persons['adults'] or 0,
                'children':          persons['children'] or 0,
                'infants':           persons['infants'] or 0,
                'total_revenue':     total_revenue,
                'commission_rate':   commission_rate,
                'commission_earned': commission_earned,
                'currency':          user.agency.currency if user.agency else 'MYR',
            },
            'week_data': list(week_data),
            'recent':    list(recent),
        })
