"""
URL Configuration for Teletalk Job Application SaaS.
"""

from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/subscriptions/', include('subscriptions.urls')),
    path('api/v1/payments/', include('payments.urls')),
    path('api/v1/licenses/', include('licenses.urls')),
    path('api/v1/', include('api.urls')),
]
