"""2FA endpoints — enroll, verify, disable."""
from rest_framework import permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import TOTPDevice


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def enroll_totp(request):
    """Generate a new TOTP secret + provisioning URI for the QR code."""
    device, _ = TOTPDevice.objects.get_or_create(user=request.user)
    if device.confirmed:
        return Response(
            {"detail": "TOTP already enrolled. Disable first to re-enroll."},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response({
        "secret": device.secret,
        "uri": device.provisioning_uri(),
        "issuer": "MYBRIDGE",
    })


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def confirm_totp(request):
    """Verify the first 6-digit code to confirm enrollment."""
    code = (request.data.get("code") or "").strip()
    try:
        device = TOTPDevice.objects.get(user=request.user)
    except TOTPDevice.DoesNotExist:
        return Response({"detail": "Not enrolled."}, status=status.HTTP_404_NOT_FOUND)
    if device.verify(code):
        return Response({"confirmed": True})
    return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@permission_classes([permissions.IsAuthenticated])
def disable_totp(request):
    """Remove TOTP device. Requires a current valid code as proof of possession."""
    code = (request.data.get("code") or "").strip()
    try:
        device = TOTPDevice.objects.get(user=request.user)
    except TOTPDevice.DoesNotExist:
        return Response({"detail": "Not enrolled."}, status=status.HTTP_404_NOT_FOUND)
    if not device.verify(code):
        return Response({"detail": "Invalid code."}, status=status.HTTP_400_BAD_REQUEST)
    device.delete()
    return Response({"disabled": True})


@api_view(["GET"])
@permission_classes([permissions.IsAuthenticated])
def totp_status(request):
    try:
        d = TOTPDevice.objects.get(user=request.user)
        return Response({"enrolled": True, "confirmed": d.confirmed})
    except TOTPDevice.DoesNotExist:
        return Response({"enrolled": False, "confirmed": False})
