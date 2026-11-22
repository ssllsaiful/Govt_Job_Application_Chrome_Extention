from django.db import models
from django.conf import settings
from subscriptions.models import Plan
from .utils import generate_license_key

class LicenseKey(models.Model):
    key = models.CharField(max_length=50, unique=True, default=generate_license_key, db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='licenses')
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True)
    max_devices = models.PositiveIntegerField(default=3)
    is_active = models.BooleanField(default=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    notes = models.TextField(blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def active_devices_count(self):
        return self.devices.filter(is_active=True).count()

    def __str__(self):
        return f"{self.key} ({self.user.username}) - {'Active' if self.is_active else 'Disabled'}"

class LicenseDevice(models.Model):
    license = models.ForeignKey(LicenseKey, on_delete=models.CASCADE, related_name='devices')
    device_fingerprint = models.CharField(max_length=255, db_index=True)
    device_name = models.CharField(max_length=150, default="Chrome Browser")
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    last_active = models.DateTimeField(auto_now=True)
    activated_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('license', 'device_fingerprint')

    def __str__(self):
        return f"{self.device_name} ({self.device_fingerprint[:8]}...) - {self.license.key}"
