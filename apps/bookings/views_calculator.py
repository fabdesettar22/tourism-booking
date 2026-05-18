"""Booking price calculator endpoint.

POST /api/v1/bookings/calculate/
Preview-only — لا يحفظ شيئاً في قاعدة البيانات.

يأخذ تكوين الحجز الكامل (الباقة + المجموعة + الفنادق + الجولات + النقل + الطيران)
ويرجع breakdown مفصّل بـ MYR + EUR + USD لكل سطر + الإجمالي + سعر الفرد.

تستخدم apps.pricing.services.* للحساب الفعلي.
"""
from decimal import Decimal
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from apps.packages.models import CustomPackage
from apps.hotels.models import Hotel
from apps.rooms.models import RoomType
from apps.tours_excursions.models import Tour
from apps.airport_transfers.models import AirportTransfer
from apps.gifts.models import Gift

from apps.pricing.services import (
    quote_room_stay,
    quote_tour_for_group,
    quote_airport_transfer_for_group,
    quote_gift_for_group,
    aggregate_quotes,
    per_person_split,
)


# ────────────────────────────────────────────────────────────
# Input serializers (validation only — no model binding)
# ────────────────────────────────────────────────────────────


class _RoomConfigSerializer(serializers.Serializer):
    hotel_id              = serializers.IntegerField(required=True)
    room_type_id          = serializers.IntegerField(required=True)
    nights                = serializers.IntegerField(min_value=1, required=True)
    rooms_count           = serializers.IntegerField(min_value=1, default=1)
    adults_in_room        = serializers.IntegerField(min_value=0, default=0)
    children_in_room      = serializers.IntegerField(min_value=0, default=0)
    infants_in_room       = serializers.IntegerField(min_value=0, default=0)
    children_with_bed     = serializers.IntegerField(min_value=0, default=0)
    children_without_bed  = serializers.IntegerField(min_value=0, default=0)
    infants_with_bed      = serializers.IntegerField(min_value=0, default=0)
    infants_without_bed   = serializers.IntegerField(min_value=0, default=0)
    check_in_date         = serializers.DateField(required=False, allow_null=True)


class _TourConfigSerializer(serializers.Serializer):
    tour_id        = serializers.IntegerField(required=True)
    direction      = serializers.ChoiceField(choices=['one_way', 'round_trip'], default='one_way')
    include_guide  = serializers.BooleanField(default=False)
    day_index      = serializers.IntegerField(required=False, allow_null=True)
    # override pax (اختياري — يفترض المجموعة الكاملة إن لم يُذكر)
    adults         = serializers.IntegerField(required=False, allow_null=True)
    children       = serializers.IntegerField(required=False, allow_null=True)


class _TransferConfigSerializer(serializers.Serializer):
    transfer_id    = serializers.IntegerField(required=True)
    direction      = serializers.ChoiceField(
        choices=['to_hotel', 'to_airport', 'round_trip'], default='to_hotel'
    )
    include_guide  = serializers.BooleanField(default=False)


class CalculateInputSerializer(serializers.Serializer):
    """تكوين الحجز الكامل المطلوب لحساب السعر."""
    package_id   = serializers.IntegerField(required=False, allow_null=True)
    adults       = serializers.IntegerField(min_value=0, default=2)
    children     = serializers.IntegerField(min_value=0, default=0)
    infants      = serializers.IntegerField(min_value=0, default=0)
    rooms        = _RoomConfigSerializer(many=True, required=False, default=list)
    tours        = _TourConfigSerializer(many=True, required=False, default=list)
    transfers    = _TransferConfigSerializer(many=True, required=False, default=list)
    gift_id      = serializers.IntegerField(required=False, allow_null=True)
    on_date      = serializers.DateField(required=False, allow_null=True)

    def validate(self, data):
        if data.get('adults', 0) + data.get('children', 0) == 0:
            raise serializers.ValidationError("يجب وجود بالغ واحد أو طفل واحد على الأقل")
        return data


# ────────────────────────────────────────────────────────────
# View
# ────────────────────────────────────────────────────────────


class BookingCalculateView(APIView):
    """POST /api/v1/bookings/calculate/

    حساب سعر الحجز بدون حفظ. يرجع breakdown + المجموع بـ MYR/EUR/USD + سعر الفرد.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        ser = CalculateInputSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        data = ser.validated_data

        on_date  = data.get('on_date')
        adults   = data['adults']
        children = data['children']
        infants  = data['infants']
        countable_persons = adults + children  # الرضع لا يُحتسبون في per-person

        line_quotes = []
        warnings = []

        # ── 1) هدية الباقة (إجبارية إن وُجدت) ──
        gift_id = data.get('gift_id')
        if not gift_id and data.get('package_id'):
            pkg = CustomPackage.objects.filter(pk=data['package_id']).first()
            if pkg and pkg.gift_id:
                gift_id = pkg.gift_id
        if gift_id:
            gift = get_object_or_404(Gift, pk=gift_id)
            line_quotes.append(quote_gift_for_group(
                gift, adults=adults, children=children, infants=infants,
                on_date=on_date,
            ))
        else:
            warnings.append("لا توجد هدية مرتبطة بالباقة أو محددة في الطلب")

        # ── 2) الفنادق + الغرف ──
        for room_cfg in data['rooms']:
            hotel     = get_object_or_404(Hotel, pk=room_cfg['hotel_id'])
            room_type = get_object_or_404(RoomType, pk=room_cfg['room_type_id'])
            try:
                line_quotes.append(quote_room_stay(
                    hotel=hotel,
                    room_type=room_type,
                    nights=room_cfg['nights'],
                    rooms_count=room_cfg['rooms_count'],
                    children_with_bed=room_cfg['children_with_bed'],
                    children_without_bed=room_cfg['children_without_bed'],
                    infants_with_bed=room_cfg['infants_with_bed'],
                    infants_without_bed=room_cfg['infants_without_bed'],
                    check_in_date=room_cfg.get('check_in_date'),
                    on_date=on_date,
                ))
            except ValueError as exc:
                warnings.append(f"غرفة {hotel.name}: {exc}")

        # ── 3) الجولات ──
        for tour_cfg in data['tours']:
            tour = get_object_or_404(Tour, pk=tour_cfg['tour_id'])
            t_adults   = tour_cfg.get('adults')   if tour_cfg.get('adults')   is not None else adults
            t_children = tour_cfg.get('children') if tour_cfg.get('children') is not None else children
            try:
                line_quotes.append(quote_tour_for_group(
                    tour, adults=t_adults, children=t_children, infants=infants,
                    direction=tour_cfg['direction'],
                    include_guide=tour_cfg['include_guide'],
                    on_date=on_date,
                ))
            except ValueError as exc:
                warnings.append(f"جولة {tour}: {exc}")

        # ── 4) النقل ──
        for trf_cfg in data['transfers']:
            trf = get_object_or_404(AirportTransfer, pk=trf_cfg['transfer_id'])
            try:
                line_quotes.append(quote_airport_transfer_for_group(
                    trf, adults=adults, children=children, infants=infants,
                    direction=trf_cfg['direction'],
                    include_guide=trf_cfg['include_guide'],
                    on_date=on_date,
                ))
            except ValueError as exc:
                warnings.append(f"نقل {trf}: {exc}")

        # ── 5) التجميع ──
        result = aggregate_quotes(line_quotes, on_date=on_date)
        result['per_person'] = per_person_split(result['totals'], countable_persons)
        result['persons_breakdown'] = {
            'adults': adults,
            'children': children,
            'infants': infants,
            'countable_for_per_person': countable_persons,
        }
        if warnings:
            result['warnings'] = warnings

        return Response(result, status=status.HTTP_200_OK)
