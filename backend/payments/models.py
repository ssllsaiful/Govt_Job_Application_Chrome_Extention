from django.db import models
from django.conf import settings
from subscriptions.models import Plan, Subscription

class PaymentTransaction(models.Model):
    GATEWAY_CHOICES = (
        ('bkash', 'bKash Tokenized Checkout'),
        ('nagad', 'Nagad Payment Gateway'),
        ('manual', 'Manual Cash / Over Counter'),
    )

    STATUS_CHOICES = (
        ('pending', 'Pending Authorization'),
        ('completed', 'Successful'),
        ('failed', 'Failed'),
        ('cancelled', 'Cancelled by User'),
        ('refunded', 'Refunded'),
    )

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='payments')
    plan = models.ForeignKey(Plan, on_delete=models.SET_NULL, null=True, blank=True, related_name='payments')
    gateway = models.CharField(max_length=20, choices=GATEWAY_CHOICES, default='bkash')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default='BDT')
    trx_id = models.CharField(max_length=100, unique=True, db_index=True)
    invoice_number = models.CharField(max_length=100, unique=True, db_index=True)
    payment_id = models.CharField(max_length=100, null=True, blank=True, help_text="Gateway internal Payment ID")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    sender_number = models.CharField(max_length=20, null=True, blank=True)
    gateway_response = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.trx_id} | {self.gateway.upper()} | ৳{self.amount} | {self.status}"
