from django.urls import path
from .views import ValidateLicenseView, LicenseListView

urlpatterns = [
    path('validate/', ValidateLicenseView.as_view(), name='validate_license'),
    path('admin/list/', LicenseListView.as_view(), name='admin_licenses_list'),
    path('admin/generate/', LicenseListView.as_view(), name='admin_generate_license'),
]
