from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import Plan, Subscription
from .serializers import PlanSerializer, SubscriptionSerializer

class PlanListView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        plans = Plan.objects.filter(is_active=True).order_by('price_bdt')
        return Response(PlanSerializer(plans, many=True).data)

class MySubscriptionView(views.APIView):
    def get(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        sub = Subscription.objects.filter(user=request.user, is_active=True).order_by('-end_date').first()
        if not sub:
            return Response({"active": False, "message": "No active subscription found."})
        return Response({
            "active": True,
            "subscription": SubscriptionSerializer(sub).data
        })

class UpgradePlanView(views.APIView):
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)
        plan_id = request.data.get('plan_id')
        try:
            plan = Plan.objects.get(id=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({"error": "Invalid plan selected."}, status=status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        end_date = now + timedelta(days=plan.duration_days)
        
        # Deactivate old subscriptions
        Subscription.objects.filter(user=request.user, is_active=True).update(is_active=False)

        new_sub = Subscription.objects.create(
            user=request.user,
            plan=plan,
            end_date=end_date,
            is_active=True
        )
        return Response({
            "success": True,
            "message": f"Successfully subscribed to {plan.name}.",
            "subscription": SubscriptionSerializer(new_sub).data
        }, status=status.HTTP_201_CREATED)
