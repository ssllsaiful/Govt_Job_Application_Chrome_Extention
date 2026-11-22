from django.urls import path
from .views import InitiatePaymentView, BKashCallbackView, NagadCallbackView, TransactionHistoryView

urlpatterns = [
    path('initiate/', InitiatePaymentView.as_view(), name='initiate_payment'),
    path('bkash/callback/', BKashCallbackView.as_view(), name='bkash_callback'),
    path('nagad/callback/', NagadCallbackView.as_view(), name='nagad_callback'),
    path('history/', TransactionHistoryView.as_view(), name='transaction_history'),
]
