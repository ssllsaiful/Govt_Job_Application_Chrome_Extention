from django.db import models
from django.conf import settings

class Plan(models.Model):
    PLAN_TIERS = (
        ('free', 'Free Tier (1 Profile)'),
        ('standard', 'Standard Plan (3 Profiles)'),
        ('pro', 'Pro / Cyber Cafe (Unlimited Profiles)'),
        ('enterprise', 'Agency / Commercial (Multi-Device)'),
    )

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=50, unique=True)
    tier = models.CharField(max_length=20, choices=PLAN_TIERS, default='free')
    price_bdt = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    duration_days = models.PositiveIntegerField(default=30, help_text="Plan validity in days")
    max_profiles = models.PositiveIntegerField(default=1, help_text="Number of saved candidate profiles allowed")
    max_devices = models.PositiveIntegerField(default=1, help_text="Number of browser installations allowed")
    has_photo_resizer = models.BooleanField(default=True)
    has_bulk_apply = models.BooleanField(default=False)
    has_priority_support = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - ৳{self.price_bdt}/{self.duration_days} days"

class Subscription(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT, related_name='subscriptions')
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField()
    is_active = models.BooleanField(default=True)
    auto_renew = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} - {self.plan.name} ({'Active' if self.is_active else 'Expired'})"
