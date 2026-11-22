from django.contrib import admin
from .models import Plan, Subscription

@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    list_display = ('name', 'tier', 'price_bdt', 'duration_days', 'max_profiles', 'max_devices', 'is_active')
    list_filter = ('tier', 'is_active')
    search_fields = ('name', 'slug')

@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'plan', 'start_date', 'end_date', 'is_active', 'auto_renew')
    list_filter = ('is_active', 'plan')
    search_fields = ('user__username', 'user__email')
