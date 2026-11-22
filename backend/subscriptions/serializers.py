from rest_framework import serializers
from .models import Plan, Subscription

class PlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Plan
        fields = '__all__'

class SubscriptionSerializer(serializers.ModelSerializer):
    plan_details = PlanSerializer(source='plan', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Subscription
        fields = ['id', 'user', 'username', 'plan', 'plan_details', 'start_date', 'end_date', 'is_active', 'auto_renew', 'created_at']
        read_only_fields = ['id', 'start_date', 'created_at']
