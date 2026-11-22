from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from .models import LicenseKey, LicenseDevice
from .serializers import LicenseKeySerializer, ValidateLicenseSerializer
from .utils import generate_license_key

class ValidateLicenseView(views.APIView):
    """
    Validates license key and registers/activates device for Chrome Extension.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ValidateLicenseSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({"valid": False, "errors": serializer.errors}, status=status.HTTP_400_BAD_REQUEST)

        key_str = serializer.validated_data['license_key'].strip().upper()
        fingerprint = serializer.validated_data['device_fingerprint'].strip()
        device_name = serializer.validated_data.get('device_name', 'Chrome Extension Client')

        try:
            license_obj = LicenseKey.objects.get(key=key_str)
        except LicenseKey.DoesNotExist:
            return Response({"valid": False, "message": "Invalid license key."}, status=status.HTTP_404_NOT_FOUND)

        if not license_obj.is_active:
            return Response({"valid": False, "message": "This license key is disabled or revoked."}, status=status.HTTP_403_FORBIDDEN)

        if license_obj.expires_at and license_obj.expires_at < timezone.now():
            return Response({"valid": False, "message": "This license has expired."}, status=status.HTTP_403_FORBIDDEN)

        # Check existing device
        device = LicenseDevice.objects.filter(license=license_obj, device_fingerprint=fingerprint).first()
        if device:
            device.is_active = True
            device.save()
        else:
            if license_obj.active_devices_count() >= license_obj.max_devices:
                return Response({
                    "valid": False,
                    "message": f"Maximum device limit ({license_obj.max_devices}) reached for this license."
                }, status=status.HTTP_403_FORBIDDEN)
            
            client_ip = request.META.get('REMOTE_ADDR')
            device = LicenseDevice.objects.create(
                license=license_obj,
                device_fingerprint=fingerprint,
                device_name=device_name,
                ip_address=client_ip,
                is_active=True
            )

        return Response({
            "valid": True,
            "message": "License key validated and device activated successfully.",
            "plan_tier": license_obj.plan.tier if license_obj.plan else "pro",
            "max_devices": license_obj.max_devices,
            "active_devices": license_obj.active_devices_count(),
            "expires_at": license_obj.expires_at
        })

class LicenseListView(views.APIView):
    """Admin endpoint to list all licenses."""
    def get(self, request):
        licenses = LicenseKey.objects.all().order_by('-created_at')
        return Response(LicenseKeySerializer(licenses, many=True).data)

    def post(self, request):
        """Admin generates new license key."""
        user = request.user if request.user.is_authenticated else None
        if not user:
            from accounts.models import CustomUser
            user = CustomUser.objects.filter(is_staff=True).first() or CustomUser.objects.first()

        max_dev = int(request.data.get('max_devices', 3))
        notes = request.data.get('notes', 'Generated from Admin Portal')
        new_key = LicenseKey.objects.create(
            key=generate_license_key(),
            user=user,
            max_devices=max_dev,
            notes=notes
        )
        return Response({
            "success": True,
            "license": LicenseKeySerializer(new_key).data
        }, status=status.HTTP_201_CREATED)
