from rest_framework import serializers
from .models import LicenseKey, LicenseDevice

class LicenseDeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LicenseDevice
        fields = ['id', 'device_fingerprint', 'device_name', 'ip_address', 'is_active', 'last_active', 'activated_at']

class LicenseKeySerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    active_devices = serializers.IntegerField(source='active_devices_count', read_only=True)
    devices = LicenseDeviceSerializer(many=True, read_only=True)

    class Meta:
        model = LicenseKey
        fields = ['id', 'key', 'user', 'username', 'plan', 'max_devices', 'active_devices', 'is_active', 'expires_at', 'notes', 'devices', 'created_at']
        read_only_fields = ['id', 'created_at']

class ValidateLicenseSerializer(serializers.Serializer):
    license_key = serializers.CharField(max_length=50)
    device_fingerprint = serializers.CharField(max_length=255)
    device_name = serializers.CharField(required=False, default="Chrome Extension Client")
