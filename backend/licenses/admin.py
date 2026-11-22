from django.contrib import admin
from .models import LicenseKey, LicenseDevice

class LicenseDeviceInline(admin.TabularInline):
    model = LicenseDevice
    extra = 0
    readonly_fields = ('device_fingerprint', 'activated_at', 'last_active')

@admin.register(LicenseKey)
class LicenseKeyAdmin(admin.ModelAdmin):
    list_display = ('key', 'user', 'plan', 'max_devices', 'is_active', 'expires_at', 'created_at')
    list_filter = ('is_active', 'created_at')
    search_fields = ('key', 'user__username', 'notes')
    inlines = [LicenseDeviceInline]

@admin.register(LicenseDevice)
class LicenseDeviceAdmin(admin.ModelAdmin):
    list_display = ('device_name', 'license', 'device_fingerprint', 'ip_address', 'is_active', 'last_active')
    list_filter = ('is_active',)
