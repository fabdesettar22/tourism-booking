# apps/suppliers/views.py

from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone

from .models import (
    Supplier, SupplierStatus, ContentStatus,
    HotelSupplier, HotelRoomType, HotelAmenity,
    HotelPricePlan, PropertyImage, SupplierWaitlist,
    RoomTypeSupplier, RoomRateSupplier,
    TourSupplier, TourRateSupplier,
    TransferRouteSupplier, TransferRateSupplier,
    FlightRouteSupplier, FlightRateSupplier,
)
from .serializers import (
    SupplierSerializer,
    HotelStep0Serializer, HotelStep1Serializer,
    HotelStep2aSerializer, HotelStep2bSerializer, HotelStep2cSerializer,
    HotelRoomTypeSerializer, PropertyImageSerializer,
    HotelStep5aSerializer, HotelPricePlanSerializer,
    HotelStep6Serializer, HotelStep7Serializer,
    HotelOnboardingStatusSerializer, HotelAmenitySerializer,
    SupplierWaitlistSerializer,
    HotelSupplierSerializer,
    RoomTypeSupplierSerializer, RoomRateSupplierSerializer,
    TourSupplierSerializer, TourRateSupplierSerializer,
    TransferRouteSupplierSerializer, TransferRateSupplierSerializer,
    FlightRouteSupplierSerializer, FlightRateSupplierSerializer,
)


# ═══════════════════════════════════════════════════════
# PERMISSIONS
# ═══════════════════════════════════════════════════════

class IsSupplier(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'supplier'
            and hasattr(request.user, 'supplier_profile')
            and request.user.supplier_profile.status == SupplierStatus.APPROVED
        )


class IsSupplierPending(permissions.BasePermission):
    """مورد معتمد أو معلق — للسماح بإكمال التسجيل"""
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role == 'supplier'
            and hasattr(request.user, 'supplier_profile')
        )


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return (
            request.user.is_authenticated
            and request.user.role in ('super_admin', 'admin')
        )


# ═══════════════════════════════════════════════════════
# HELPER
# ═══════════════════════════════════════════════════════

def get_or_create_hotel_profile(supplier):
    """يُنشئ أو يُرجع بروفايل الفندق."""
    hotel, created = HotelSupplier.objects.get_or_create(
        supplier=supplier,
        defaults={'hotel_name': supplier.company_name}
    )
    return hotel, created


# ═══════════════════════════════════════════════════════
# HOTEL ONBOARDING VIEWS
# ═══════════════════════════════════════════════════════

class HotelOnboardingStatusView(APIView):
    """
    GET /api/v1/suppliers/hotel/onboarding/status/
    حالة التسجيل الكاملة ونسبة الإكمال.
    """
    permission_classes = [IsSupplierPending]

    def get(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        serializer = HotelOnboardingStatusSerializer(hotel)
        return Response(serializer.data)


class HotelStep0View(APIView):
    """
    POST /api/v1/suppliers/hotel/onboarding/step0/
    Step 0 — نوع الفندق وعدد الفنادق والمنصات الأخرى.
    """
    permission_classes = [IsSupplierPending]

    def post(self, request):
        serializer = HotelStep0Serializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)

        hotel.hotel_type   = serializer.validated_data['hotel_type']
        hotel.hotels_count = serializer.validated_data['hotels_count']
        hotel.listed_on    = serializer.validated_data.get('listed_on', [])
        hotel.save(update_fields=['hotel_type', 'hotels_count', 'listed_on'])

        return Response({
            'message': 'تم حفظ نوع الفندق.',
            'hotel_id': str(hotel.id),
            'next_step': 1,
            'data': {
                'hotel_type':   hotel.hotel_type,
                'hotels_count': hotel.hotels_count,
                'listed_on':    hotel.listed_on,
            }
        })


class HotelStep1View(APIView):
    """
    POST /api/v1/suppliers/hotel/onboarding/step1/
    Step 1 — الاسم، النجوم، السلسلة، الموقع، Channel Manager.
    """
    permission_classes = [IsSupplierPending]

    def get(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        serializer = HotelStep1Serializer(hotel)
        return Response(serializer.data)

    def post(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)

        serializer = HotelStep1Serializer(hotel, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            'message': 'تم حفظ تفاصيل الفندق.',
            'hotel_id': str(hotel.id),
            'next_step': 2,
            'data': serializer.data,
        })


class HotelStep2AmenitiesView(APIView):
    """
    GET  /api/v1/suppliers/hotel/onboarding/step2/amenities/
    POST /api/v1/suppliers/hotel/onboarding/step2/amenities/
    Step 2a — اختيار المرافق.
    """
    permission_classes = [IsSupplierPending]

    def get(self, request):
        """قائمة كل المرافق المتاحة مجمّعة حسب الفئة"""
        amenities = HotelAmenity.objects.filter(is_active=True).order_by('category', 'sort_order')
        serializer = HotelAmenitySerializer(amenities, many=True)

        # تجميع حسب الفئة
        grouped = {}
        for item in serializer.data:
            cat = item['category']
            cat_display = item['category_display']
            if cat not in grouped:
                grouped[cat] = {'category': cat, 'label': cat_display, 'items': []}
            grouped[cat]['items'].append(item)

        # المرافق المختارة مسبقاً
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        selected = list(
            hotel.property_amenities.values_list('amenity_id', flat=True)
        )

        return Response({
            'amenities': list(grouped.values()),
            'selected_ids': [str(s) for s in selected],
        })

    def post(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)

        serializer = HotelStep2aSerializer(hotel, data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            'message': f"تم حفظ {len(request.data.get('amenity_ids', []))} مرفق.",
            'next_step': '2b',
        })


class HotelStep2ServicesView(APIView):
    """
    GET  /api/v1/suppliers/hotel/onboarding/step2/services/
    POST /api/v1/suppliers/hotel/onboarding/step2/services/
    Step 2b — الإفطار، موقف السيارات، اللغات، قواعد المنزل.
    """
    permission_classes = [IsSupplierPending]

    def get(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        serializer = HotelStep2bSerializer(hotel)
        return Response(serializer.data)

    def post(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)

        serializer = HotelStep2bSerializer(hotel, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            'message': 'تم حفظ الخدمات.',
            'next_step': '2c',
            'data': serializer.data,
        })


class HotelStep2DescriptionView(APIView):
    """
    GET  /api/v1/suppliers/hotel/onboarding/step2/description/
    POST /api/v1/suppliers/hotel/onboarding/step2/description/
    Step 2c — الأوصاف.
    """
    permission_classes = [IsSupplierPending]

    def get(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        serializer = HotelStep2cSerializer(hotel)
        return Response(serializer.data)

    def post(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)

        serializer = HotelStep2cSerializer(hotel, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            'message': 'تم حفظ الأوصاف.',
            'next_step': 3,
            'data': serializer.data,
        })


class HotelRoomsView(APIView):
    """
    GET    /api/v1/suppliers/hotel/onboarding/rooms/
    POST   /api/v1/suppliers/hotel/onboarding/rooms/
    PUT    /api/v1/suppliers/hotel/onboarding/rooms/{room_id}/
    DELETE /api/v1/suppliers/hotel/onboarding/rooms/{room_id}/
    Step 3 — إضافة وإدارة الغرف.
    """
    permission_classes = [IsSupplierPending]

    def _get_hotel(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        return hotel

    def get(self, request):
        hotel = self._get_hotel(request)
        rooms = hotel.room_types.filter(is_active=True).prefetch_related('occupancy_prices')
        serializer = HotelRoomTypeSerializer(rooms, many=True)
        return Response({
            'count': rooms.count(),
            'rooms': serializer.data,
            'min_required': 1,
            'step_complete': rooms.exists(),
        })

    def post(self, request):
        hotel = self._get_hotel(request)
        serializer = HotelRoomTypeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        room = serializer.save(hotel=hotel)
        return Response({
            'message': f'تم إضافة غرفة {room.get_room_unit_type_display()}.',
            'room_id': str(room.id),
            'next_step': 4,
            'data': HotelRoomTypeSerializer(room).data,
        }, status=status.HTTP_201_CREATED)


class HotelRoomDetailView(APIView):
    """
    PUT    /api/v1/suppliers/hotel/onboarding/rooms/{room_id}/
    DELETE /api/v1/suppliers/hotel/onboarding/rooms/{room_id}/
    """
    permission_classes = [IsSupplierPending]

    def _get_room(self, request, room_id):
        supplier = request.user.supplier_profile
        try:
            return HotelRoomType.objects.get(
                id=room_id,
                hotel__supplier=supplier,
                is_active=True
            )
        except HotelRoomType.DoesNotExist:
            return None

    def put(self, request, room_id):
        room = self._get_room(request, room_id)
        if not room:
            return Response({'error': 'الغرفة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)

        serializer = HotelRoomTypeSerializer(room, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({'message': 'تم تحديث الغرفة.', 'data': serializer.data})

    def delete(self, request, room_id):
        room = self._get_room(request, room_id)
        if not room:
            return Response({'error': 'الغرفة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)

        room.is_active = False
        room.save(update_fields=['is_active'])
        return Response({'message': 'تم حذف الغرفة.'})


class HotelImagesView(APIView):
    """
    GET    /api/v1/suppliers/hotel/onboarding/images/
    POST   /api/v1/suppliers/hotel/onboarding/images/
    DELETE /api/v1/suppliers/hotel/onboarding/images/{image_id}/
    POST   /api/v1/suppliers/hotel/onboarding/images/{image_id}/set-main/
    Step 4 — رفع وإدارة الصور.
    """
    permission_classes = [IsSupplierPending]
    parser_classes     = [MultiPartParser, FormParser, JSONParser]

    def _get_hotel(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        return hotel

    def get(self, request):
        hotel  = self._get_hotel(request)
        images = hotel.images.filter(is_active=True).order_by('order', '-uploaded_at')
        serializer = PropertyImageSerializer(images, many=True, context={'request': request})
        return Response({
            'count':         images.count(),
            'images':        serializer.data,
            'min_required':  5,
            'step_complete': images.count() >= 5,
        })

    def post(self, request):
        hotel = self._get_hotel(request)

        # حد أقصى 30 صورة
        current_count = hotel.images.filter(is_active=True).count()
        if current_count >= 30:
            return Response(
                {'error': 'وصلت إلى الحد الأقصى للصور (30 صورة).'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # رفع متعدد
        images_data = request.FILES.getlist('images')
        if not images_data:
            image_file = request.FILES.get('image')
            if not image_file:
                return Response(
                    {'error': 'يجب رفع صورة واحدة على الأقل.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            images_data = [image_file]

        created = []
        is_first = current_count == 0

        for idx, img_file in enumerate(images_data):
            serializer = PropertyImageSerializer(
                data={'image': img_file, 'is_main': is_first and idx == 0, 'order': current_count + idx},
                context={'request': request}
            )
            if serializer.is_valid():
                serializer.save(hotel=hotel)
                created.append(serializer.data)
            else:
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        return Response({
            'message': f'تم رفع {len(created)} صورة.',
            'images':  created,
            'total':   hotel.images.filter(is_active=True).count(),
            'next_step': 5,
        }, status=status.HTTP_201_CREATED)


class HotelImageDetailView(APIView):
    """
    DELETE /api/v1/suppliers/hotel/onboarding/images/{image_id}/
    POST   /api/v1/suppliers/hotel/onboarding/images/{image_id}/set-main/
    """
    permission_classes = [IsSupplierPending]

    def _get_image(self, request, image_id):
        supplier = request.user.supplier_profile
        try:
            return PropertyImage.objects.get(
                id=image_id,
                hotel__supplier=supplier,
                is_active=True
            )
        except PropertyImage.DoesNotExist:
            return None

    def delete(self, request, image_id):
        image = self._get_image(request, image_id)
        if not image:
            return Response({'error': 'الصورة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)

        image.is_active = False
        image.save(update_fields=['is_active'])
        return Response({'message': 'تم حذف الصورة.'})

    def post(self, request, image_id):
        """تعيين كصورة رئيسية"""
        image = self._get_image(request, image_id)
        if not image:
            return Response({'error': 'الصورة غير موجودة.'}, status=status.HTTP_404_NOT_FOUND)

        PropertyImage.objects.filter(
            hotel=image.hotel, is_main=True
        ).update(is_main=False)
        image.is_main = True
        image.save(update_fields=['is_main'])
        return Response({'message': 'تم تعيين الصورة الرئيسية.'})


class HotelStep5PricingView(APIView):
    """
    GET  /api/v1/suppliers/hotel/onboarding/step5/pricing/
    POST /api/v1/suppliers/hotel/onboarding/step5/pricing/
    Step 5a — إعدادات الأسعار العامة.
    """
    permission_classes = [IsSupplierPending]

    def get(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        serializer = HotelStep5aSerializer(hotel)
        return Response(serializer.data)

    def post(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)

        serializer = HotelStep5aSerializer(hotel, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            'message': 'تم حفظ إعدادات الأسعار.',
            'next_step': '5b',
            'data': serializer.data,
        })


class HotelPricePlansView(APIView):
    """
    GET  /api/v1/suppliers/hotel/onboarding/step5/plans/
    POST /api/v1/suppliers/hotel/onboarding/step5/plans/
    Step 5b — خطط الأسعار (قياسي / غير قابل / أسبوعي).
    """
    permission_classes = [IsSupplierPending]

    def _get_hotel(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        return hotel

    def get(self, request):
        hotel = self._get_hotel(request)
        plans = hotel.price_plans.all()
        serializer = HotelPricePlanSerializer(plans, many=True)
        return Response({
            'plans': serializer.data,
            'step_complete': plans.filter(is_enabled=True).exists(),
        })

    def post(self, request):
        hotel = self._get_hotel(request)

        # إذا أرسل قائمة — تحديث الكل دفعة واحدة
        if isinstance(request.data, list):
            results = []
            for plan_data in request.data:
                plan_type = plan_data.get('plan_type')
                plan, _ = HotelPricePlan.objects.get_or_create(
                    hotel=hotel, plan_type=plan_type
                )
                serializer = HotelPricePlanSerializer(plan, data=plan_data, partial=True)
                if not serializer.is_valid():
                    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                serializer.save()
                results.append(serializer.data)
            return Response({
                'message': f'تم حفظ {len(results)} خطة سعر.',
                'plans': results,
                'next_step': 6,
            })

        # إذا أرسل كائن واحد
        plan_type = request.data.get('plan_type')
        plan, _ = HotelPricePlan.objects.get_or_create(
            hotel=hotel, plan_type=plan_type
        )
        serializer = HotelPricePlanSerializer(plan, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            'message': 'تم حفظ خطة السعر.',
            'data': serializer.data,
            'next_step': 6,
        })


class HotelStep6AvailabilityView(APIView):
    """
    GET  /api/v1/suppliers/hotel/onboarding/step6/availability/
    POST /api/v1/suppliers/hotel/onboarding/step6/availability/
    Step 6 — التوفر والجدول الزمني.
    """
    permission_classes = [IsSupplierPending]

    def get(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        serializer = HotelStep6Serializer(hotel)
        return Response(serializer.data)

    def post(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)

        serializer = HotelStep6Serializer(hotel, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return Response({
            'message': 'تم حفظ إعدادات التوفر.',
            'next_step': 7,
            'data': serializer.data,
        })


class HotelStep7FinalView(APIView):
    """
    GET  /api/v1/suppliers/hotel/onboarding/step7/final/
    POST /api/v1/suppliers/hotel/onboarding/step7/final/
    Step 7 — الخطوات النهائية وإكمال التسجيل.
    """
    permission_classes = [IsSupplierPending]

    def get(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)
        serializer = HotelStep7Serializer(hotel)
        return Response(serializer.data)

    def post(self, request):
        supplier = request.user.supplier_profile
        hotel, _ = get_or_create_hotel_profile(supplier)

        serializer = HotelStep7Serializer(hotel, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        serializer.save()

        # التحقق من اكتمال التسجيل
        status_serializer = HotelOnboardingStatusSerializer(hotel)
        completion = status_serializer.data.get('completion_pct', 0)

        if hotel.terms_accepted:
            # تغيير حالة المحتوى إلى PENDING_REVIEW
            hotel.content_status = ContentStatus.PENDING_REVIEW
            hotel.save(update_fields=['content_status'])

            return Response({
                'message': 'تم إكمال التسجيل بنجاح! سيراجع فريقنا طلبك خلال 24 ساعة.',
                'completion_pct': completion,
                'content_status': hotel.content_status,
                'open_immediately': hotel.open_immediately,
            })

        return Response({
            'message': 'تم حفظ البيانات.',
            'completion_pct': completion,
            'data': serializer.data,
        })


# ═══════════════════════════════════════════════════════
# WAITLIST VIEW
# ═══════════════════════════════════════════════════════

class SupplierWaitlistView(APIView):
    """
    POST /api/v1/suppliers/waitlist/
    تسجيل في قائمة الانتظار — لا يحتاج تسجيل دخول.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = SupplierWaitlistSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        entry = serializer.save()

        # عداد قائمة الانتظار لهذا النوع
        count = SupplierWaitlist.objects.filter(
            supplier_type=entry.supplier_type
        ).count()

        return Response({
            'message': 'تم تسجيلك في قائمة الانتظار. سنتواصل معك قريباً.',
            'waitlist_id': str(entry.id),
            'supplier_type': entry.supplier_type,
            'position': count,
        }, status=status.HTTP_201_CREATED)


class WaitlistCountView(APIView):
    """
    GET /api/v1/suppliers/waitlist/counts/
    عدد المسجلين في كل نوع.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from django.db.models import Count
        counts = SupplierWaitlist.objects.values('supplier_type').annotate(
            count=Count('id')
        )
        return Response({c['supplier_type']: c['count'] for c in counts})


# ═══════════════════════════════════════════════════════
# ADMIN VIEWS
# ═══════════════════════════════════════════════════════

class AdminHotelListView(APIView):
    """
    GET /api/v1/suppliers/admin/hotels/
    قائمة الفنادق للمسؤول مع فلتر حسب الحالة.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = HotelSupplier.objects.select_related('supplier').order_by('-created_at')

        # فلتر
        content_status = request.query_params.get('status')
        hotel_type     = request.query_params.get('type')
        city           = request.query_params.get('city')

        if content_status:
            qs = qs.filter(content_status=content_status.upper())
        if hotel_type:
            qs = qs.filter(hotel_type=hotel_type.upper())
        if city:
            qs = qs.filter(city__icontains=city)

        serializer = HotelOnboardingStatusSerializer(qs, many=True)
        return Response({
            'count':   qs.count(),
            'results': serializer.data,
        })


class AdminHotelApproveView(APIView):
    """
    POST /api/v1/suppliers/admin/hotels/{hotel_id}/approve/
    """
    permission_classes = [IsAdminUser]

    def post(self, request, hotel_id):
        try:
            hotel = HotelSupplier.objects.select_related('supplier__user').get(id=hotel_id)
        except HotelSupplier.DoesNotExist:
            return Response({'error': 'الفندق غير موجود.'}, status=status.HTTP_404_NOT_FOUND)

        hotel.content_status = ContentStatus.APPROVED
        hotel.save(update_fields=['content_status'])

        return Response({
            'message': f'تم اعتماد {hotel.hotel_name}.',
            'hotel_id': str(hotel.id),
        })


class AdminHotelRejectView(APIView):
    """
    POST /api/v1/suppliers/admin/hotels/{hotel_id}/reject/
    """
    permission_classes = [IsAdminUser]

    def post(self, request, hotel_id):
        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response(
                {'error': 'يجب تحديد سبب الرفض.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        try:
            hotel = HotelSupplier.objects.get(id=hotel_id)
        except HotelSupplier.DoesNotExist:
            return Response({'error': 'الفندق غير موجود.'}, status=status.HTTP_404_NOT_FOUND)

        hotel.content_status = ContentStatus.REJECTED
        hotel.save(update_fields=['content_status'])

        return Response({
            'message': f'تم رفض {hotel.hotel_name}.',
            'reason':  reason,
        })


class AdminWaitlistView(APIView):
    """
    GET /api/v1/suppliers/admin/waitlist/
    قائمة الانتظار للمسؤول.
    """
    permission_classes = [IsAdminUser]

    def get(self, request):
        qs = SupplierWaitlist.objects.order_by('-created_at')

        supplier_type = request.query_params.get('type')
        is_contacted  = request.query_params.get('contacted')

        if supplier_type:
            qs = qs.filter(supplier_type=supplier_type.upper())
        if is_contacted is not None:
            qs = qs.filter(is_contacted=is_contacted.lower() == 'true')

        serializer = SupplierWaitlistSerializer(qs, many=True)
        return Response({'count': qs.count(), 'results': serializer.data})

    def patch(self, request, entry_id=None):
        """تعيين is_contacted = True"""
        try:
            entry = SupplierWaitlist.objects.get(id=entry_id)
        except SupplierWaitlist.DoesNotExist:
            return Response({'error': 'غير موجود.'}, status=status.HTTP_404_NOT_FOUND)

        entry.is_contacted  = True
        entry.contacted_at  = timezone.now()
        entry.notes         = request.data.get('notes', entry.notes)
        entry.save(update_fields=['is_contacted', 'contacted_at', 'notes'])

        return Response({'message': 'تم تحديث حالة التواصل.'})


# ═══════════════════════════════════════════════════════
# LEGACY VIEWSETS — محفوظة للتوافق
# ═══════════════════════════════════════════════════════

class IsSupplierBase(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated

class SupplierOwnedViewSet(viewsets.ModelViewSet):
    supplier_field = 'supplier'
    def get_permissions(self): return [permissions.IsAuthenticated()]
    def get_supplier(self):
        try: return self.request.user.supplier_profile
        except: return None
    def get_queryset(self):
        user = self.request.user
        qs   = super().get_queryset()
        if user.role in ('super_admin', 'admin'): return qs
        supplier = self.get_supplier()
        if supplier: return qs.filter(**{self.supplier_field: supplier})
        return qs.none()
    def perform_create(self, serializer):
        supplier = self.get_supplier()
        if not supplier:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied("ليس لديك بروفايل مورد.")
        serializer.save(**{self.supplier_field: supplier})

class SupplierProfileViewSet(viewsets.ModelViewSet):
    serializer_class = SupplierSerializer
    def get_permissions(self): return [permissions.IsAuthenticated()]
    def get_queryset(self):
        user = self.request.user
        if user.role in ('super_admin', 'admin'):
            return Supplier.objects.select_related('user').all()
        if user.role == 'supplier':
            return Supplier.objects.filter(user=user)
        return Supplier.objects.none()
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        if request.user.role not in ('super_admin', 'admin'):
            return Response({'error': 'غير مصرح.'}, status=status.HTTP_403_FORBIDDEN)
        supplier = self.get_object()
        supplier.status = SupplierStatus.APPROVED
        supplier.approved_at = timezone.now()
        supplier.approved_by = request.user
        supplier.save(update_fields=['status', 'approved_at', 'approved_by'])
        return Response({'message': 'تم اعتماد المورد.'})
    @action(detail=True, methods=['post'])
    def reject(self, request, pk=None):
        if request.user.role not in ('super_admin', 'admin'):
            return Response({'error': 'غير مصرح.'}, status=status.HTTP_403_FORBIDDEN)
        supplier = self.get_object()
        reason = request.data.get('reason', '')
        if not reason:
            return Response({'error': 'سبب الرفض مطلوب.'}, status=status.HTTP_400_BAD_REQUEST)
        supplier.status = SupplierStatus.REJECTED
        supplier.rejection_reason = reason
        supplier.save(update_fields=['status', 'rejection_reason'])
        return Response({'message': 'تم رفض المورد.'})

class HotelSupplierViewSet(SupplierOwnedViewSet):
    serializer_class = HotelSupplierSerializer
    queryset = HotelSupplier.objects.select_related('supplier')

class RoomTypeSupplierViewSet(SupplierOwnedViewSet):
    serializer_class = RoomTypeSupplierSerializer
    supplier_field   = 'hotel__supplier'
    queryset         = RoomTypeSupplier.objects.select_related('hotel__supplier')
    def get_queryset(self):
        user = self.request.user
        qs   = RoomTypeSupplier.objects.select_related('hotel__supplier')
        if user.role in ('super_admin', 'admin'): return qs
        supplier = self.get_supplier()
        if supplier: return qs.filter(hotel__supplier=supplier)
        return qs.none()

class RoomRateSupplierViewSet(SupplierOwnedViewSet):
    serializer_class = RoomRateSupplierSerializer
    supplier_field   = 'room_type__hotel__supplier'
    queryset         = RoomRateSupplier.objects.select_related('room_type__hotel__supplier')
    def get_queryset(self):
        user = self.request.user
        qs   = RoomRateSupplier.objects.select_related('room_type__hotel__supplier')
        if user.role in ('super_admin', 'admin'): return qs
        supplier = self.get_supplier()
        if supplier: return qs.filter(room_type__hotel__supplier=supplier)
        return qs.none()

class TourSupplierViewSet(SupplierOwnedViewSet):
    serializer_class = TourSupplierSerializer
    queryset         = TourSupplier.objects.select_related('supplier')

class TourRateSupplierViewSet(SupplierOwnedViewSet):
    serializer_class = TourRateSupplierSerializer
    supplier_field   = 'tour__supplier'
    queryset         = TourRateSupplier.objects.select_related('tour__supplier')
    def get_queryset(self):
        user = self.request.user
        qs   = TourRateSupplier.objects.select_related('tour__supplier')
        if user.role in ('super_admin', 'admin'): return qs
        supplier = self.get_supplier()
        if supplier: return qs.filter(tour__supplier=supplier)
        return qs.none()

class TransferRouteSupplierViewSet(SupplierOwnedViewSet):
    serializer_class = TransferRouteSupplierSerializer
    queryset         = TransferRouteSupplier.objects.select_related('supplier')

class TransferRateSupplierViewSet(SupplierOwnedViewSet):
    serializer_class = TransferRateSupplierSerializer
    supplier_field   = 'route__supplier'
    queryset         = TransferRateSupplier.objects.select_related('route__supplier')
    def get_queryset(self):
        user = self.request.user
        qs   = TransferRateSupplier.objects.select_related('route__supplier')
        if user.role in ('super_admin', 'admin'): return qs
        supplier = self.get_supplier()
        if supplier: return qs.filter(route__supplier=supplier)
        return qs.none()

class FlightRouteSupplierViewSet(SupplierOwnedViewSet):
    serializer_class = FlightRouteSupplierSerializer
    queryset         = FlightRouteSupplier.objects.select_related('supplier')

class FlightRateSupplierViewSet(SupplierOwnedViewSet):
    serializer_class = FlightRateSupplierSerializer
    supplier_field   = 'route__supplier'
    queryset         = FlightRateSupplier.objects.select_related('route__supplier')
    def get_queryset(self):
        user = self.request.user
        qs   = FlightRateSupplier.objects.select_related('route__supplier')
        if user.role in ('super_admin', 'admin'): return qs
        supplier = self.get_supplier()
        if supplier: return qs.filter(route__supplier=supplier)
        return qs.none()
