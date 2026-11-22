from django.urls import path
from .views import PlanListView, MySubscriptionView, UpgradePlanView

urlpatterns = [
    path('plans/', PlanListView.as_view(), name='subscription_plans'),
    path('my-subscription/', MySubscriptionView.as_view(), name='my_subscription'),
    path('upgrade/', UpgradePlanView.as_view(), name='upgrade_plan'),
]
