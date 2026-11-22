import uuid
from rest_framework import views, status, permissions
from rest_framework.response import Response
from django.utils import timezone
from datetime import timedelta
from .models import PaymentTransaction
from .serializers import PaymentTransactionSerializer, InitiatePaymentSerializer
from .bkash import BKashPaymentGateway
from .nagad import NagadPaymentGateway
from subscriptions.models import Plan, Subscription

class InitiatePaymentView(views.APIView):
    def post(self, request):
        if not request.user.is_authenticated:
            return Response({"error": "Authentication required"}, status=status.HTTP_401_UNAUTHORIZED)

        serializer = InitiatePaymentSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        plan_id = serializer.validated_data['plan_id']
        gateway = serializer.validated_data['gateway']
        sender_num = serializer.validated_data.get('sender_number', '')

        try:
            plan = Plan.objects.get(id=plan_id, is_active=True)
        except Plan.DoesNotExist:
            return Response({"error": "Plan not found"}, status=status.HTTP_404_NOT_FOUND)

        invoice_no = f"INV-{uuid.uuid4().hex[:8].upper()}"
        trx_temp = f"TEMP-{uuid.uuid4().hex[:10].upper()}"

        txn = PaymentTransaction.objects.create(
            user=request.user,
            plan=plan,
            gateway=gateway,
            amount=plan.price_bdt,
            currency="BDT",
            trx_id=trx_temp,
            invoice_number=invoice_no,
            sender_number=sender_num,
            status='pending'
        )

        redirect_url = ""
        if gateway == 'bkash':
            bkash = BKashPaymentGateway()
            resp = bkash.create_payment(plan.price_bdt, invoice_no, f"/api/v1/payments/bkash/callback/?invoice={invoice_no}")
            txn.payment_id = resp.get('paymentID', '')
            txn.save()
            redirect_url = resp.get('bkashURL', '')
        elif gateway == 'nagad':
            nagad = NagadPaymentGateway()
            resp = nagad.initiate_payment(plan.price_bdt, invoice_no, f"/api/v1/payments/nagad/callback/?order_id={invoice_no}")
            redirect_url = resp.get('callbackUrl', '')
        else:
            redirect_url = f"/admin-dashboard/payments/?invoice={invoice_no}"

        return Response({
            "success": True,
            "invoice_number": invoice_no,
            "amount": float(plan.price_bdt),
            "gateway": gateway,
            "checkout_url": redirect_url,
            "transaction_id": txn.id
        })

class BKashCallbackView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        payment_id = request.query_params.get('paymentID')
        status_param = request.query_params.get('status')
        invoice_no = request.query_params.get('invoice')

        if status_param == 'success' and payment_id:
            bkash = BKashPaymentGateway()
            exec_resp = bkash.execute_payment(payment_id)
            if exec_resp.get('statusCode') == '0000':
                txn = PaymentTransaction.objects.filter(payment_id=payment_id).first()
                if txn:
                    txn.status = 'completed'
                    txn.trx_id = exec_resp.get('trxID', f"BK-{uuid.uuid4().hex[:8].upper()}")
                    txn.gateway_response = exec_resp
                    txn.save()

                    # Activate subscription
                    Subscription.objects.filter(user=txn.user, is_active=True).update(is_active=False)
                    Subscription.objects.create(
                        user=txn.user,
                        plan=txn.plan,
                        end_date=timezone.now() + timedelta(days=txn.plan.duration_days),
                        is_active=True
                    )
                    return Response({"success": True, "message": "bKash Payment Completed Successfully", "trx_id": txn.trx_id})

        return Response({"success": False, "message": "Payment was cancelled or failed"}, status=status.HTTP_400_BAD_REQUEST)

class NagadCallbackView(views.APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        payment_ref = request.query_params.get('payment_ref_id')
        order_id = request.query_params.get('order_id')
        nagad = NagadPaymentGateway()
        res = nagad.verify_payment(payment_ref)
        if res.get('status') == 'Success':
            txn = PaymentTransaction.objects.filter(invoice_number=order_id).first()
            if txn:
                txn.status = 'completed'
                txn.trx_id = f"NGD-{uuid.uuid4().hex[:8].upper()}"
                txn.gateway_response = res
                txn.save()
                return Response({"success": True, "message": "Nagad Payment Verified", "trx_id": txn.trx_id})
        return Response({"success": False, "message": "Nagad payment verification failed"}, status=status.HTTP_400_BAD_REQUEST)

class TransactionHistoryView(views.APIView):
    def get(self, request):
        # Admin gets all, user gets own
        if request.user.is_staff or getattr(request.user, 'role', '') == 'admin':
            txns = PaymentTransaction.objects.all().order_by('-created_at')
        elif request.user.is_authenticated:
            txns = PaymentTransaction.objects.filter(user=request.user).order_by('-created_at')
        else:
            # Fallback for dashboard preview demo
            txns = PaymentTransaction.objects.all().order_by('-created_at')[:20]
        return Response(PaymentTransactionSerializer(txns, many=True).data)
