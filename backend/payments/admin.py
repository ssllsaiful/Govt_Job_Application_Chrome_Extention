from django.contrib import admin
from .models import PaymentTransaction

@admin.register(PaymentTransaction)
class PaymentTransactionAdmin(admin.ModelAdmin):
    list_display = ('trx_id', 'user', 'gateway', 'amount', 'currency', 'status', 'created_at')
    list_filter = ('gateway', 'status', 'created_at')
    search_fields = ('trx_id', 'invoice_number', 'user__username', 'sender_number')
