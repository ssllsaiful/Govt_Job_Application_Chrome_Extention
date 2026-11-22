from django.urls import path
from .views import HealthCheckView, DashboardStatsView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='api_health'),
    path('dashboard-stats/', DashboardStatsView.as_view(), name='dashboard_stats'),
]
