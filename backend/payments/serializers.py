from rest_framework import serializers
from .models import PaymentTransaction

class PaymentTransactionSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username', read_only=True)
    plan_name = serializers.CharField(source='plan.name', read_only=True)

    class Meta:
        model = PaymentTransaction
        fields = ['id', 'user', 'username', 'plan', 'plan_name', 'gateway', 'amount', 'currency', 'trx_id', 'invoice_number', 'payment_id', 'status', 'sender_number', 'created_at']
        read_only_fields = ['id', 'created_at']

class InitiatePaymentSerializer(serializers.Serializer):
    plan_id = serializers.IntegerField()
    gateway = serializers.ChoiceField(choices=['bkash', 'nagad', 'manual'])
    sender_number = serializers.CharField(required=False, allow_blank=True)
