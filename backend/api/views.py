from rest_framework import views, permissions
from rest_framework.response import Response
from django.db.models import Sum, Count
from accounts.models import CustomUser
from subscriptions.models import Subscription, Plan
from payments.models import PaymentTransaction
from licenses.models import LicenseKey

class HealthCheckView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return Response({
            "status": "healthy",
            "service": "Teletalk Job Application SaaS API",
            "version": "1.0.0"
        })

class DashboardStatsView(views.APIView):
    """
    Returns aggregated business KPIs for the Admin Dashboard.
    """
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        total_users = CustomUser.objects.count()
        active_subscribers = Subscription.objects.filter(is_active=True).count()
        total_revenue = PaymentTransaction.objects.filter(status='completed').aggregate(total=Sum('amount'))['total'] or 0.0
        total_licenses = LicenseKey.objects.filter(is_active=True).count()

        # Monthly metrics preview
        recent_payments = PaymentTransaction.objects.all().order_by('-created_at')[:10]
        recent_txns_data = [
            {
                "trx_id": t.trx_id,
                "user": t.user.username if t.user else "Anonymous",
                "gateway": t.gateway,
                "amount": float(t.amount),
                "status": t.status,
                "date": t.created_at.strftime("%Y-%m-%d %H:%M")
            }
            for t in recent_payments
        ]

        return Response({
            "total_users": total_users,
            "active_subscribers": active_subscribers,
            "total_revenue": float(total_revenue),
            "total_licenses": total_licenses,
            "recent_transactions": recent_txns_data,
        })
