"""
URL Configuration for Teletalk Job Application SaaS.
"""

from django.contrib import admin
from django.urls import path, re_path, include
from django.views.static import serve
from django.views.generic import RedirectView
from django.conf import settings
from pathlib import Path

DASHBOARD_DIR = settings.BASE_DIR.parent / 'frontend' / 'admin-dashboard'

def serve_dashboard(request, path=''):
    if not path or path.endswith('/'):
        target = path + 'index.html'
    else:
        # If it's a directory without trailing slash
        full_p = DASHBOARD_DIR / path
        if full_p.is_dir():
            target = path + '/index.html'
        else:
            target = path
    return serve(request, target, document_root=str(DASHBOARD_DIR))

urlpatterns = [
    path('', RedirectView.as_view(url='/dashboard/', permanent=False)),
    path('admin/', admin.site.urls),
    path('api/v1/auth/', include('accounts.urls')),
    path('api/v1/subscriptions/', include('subscriptions.urls')),
    path('api/v1/payments/', include('payments.urls')),
    path('api/v1/licenses/', include('licenses.urls')),
    path('api/v1/', include('api.urls')),
    
    # Direct access to the Admin Dashboard via Django server
    re_path(r'^dashboard/(?P<path>.*)$', serve_dashboard, name='dashboard'),
]
