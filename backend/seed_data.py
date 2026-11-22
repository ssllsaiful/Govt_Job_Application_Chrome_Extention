import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from accounts.models import CustomUser
from subscriptions.models import Plan
from licenses.models import LicenseKey
from payments.models import PaymentTransaction

def seed():
    print("🌱 Seeding database...")
    
    # 1. Create Superuser if not exists
    if not CustomUser.objects.filter(username='admin').exists():
        admin = CustomUser.objects.create_superuser(
            username='admin',
            email='admin@bdjobautofill.com',
            password='admin123',
            phone_number='01700000000',
            role='admin',
            is_verified=True
        )
        print("✅ Superuser created: admin / admin123")
    else:
        admin = CustomUser.objects.get(username='admin')
        print("ℹ️ Superuser 'admin' already exists.")

    # 2. Create Plans
    plans_data = [
        {
            "name": "Free Tier",
            "slug": "free",
            "tier": "free",
            "price_bdt": 0.00,
            "duration_days": 365,
            "max_profiles": 1,
            "max_devices": 1,
            "has_photo_resizer": True,
            "has_bulk_apply": False,
        },
        {
            "name": "Standard Plan",
            "slug": "standard",
            "tier": "standard",
            "price_bdt": 300.00,
            "duration_days": 30,
            "max_profiles": 3,
            "max_devices": 2,
            "has_photo_resizer": True,
            "has_bulk_apply": False,
        },
        {
            "name": "Pro / Cyber Cafe",
            "slug": "pro",
            "tier": "pro",
            "price_bdt": 500.00,
            "duration_days": 30,
            "max_profiles": 999,
            "max_devices": 5,
            "has_photo_resizer": True,
            "has_bulk_apply": True,
        },
        {
            "name": "Agency / Commercial",
            "slug": "enterprise",
            "tier": "enterprise",
            "price_bdt": 1500.00,
            "duration_days": 90,
            "max_profiles": 9999,
            "max_devices": 15,
            "has_photo_resizer": True,
            "has_bulk_apply": True,
        }
    ]

    for p in plans_data:
        obj, created = Plan.objects.get_or_create(slug=p['slug'], defaults=p)
        if created:
            print(f"✅ Plan created: {p['name']} (৳{p['price_bdt']})")

    # 3. Create Sample License
    pro_plan = Plan.objects.filter(slug='pro').first()
    if not LicenseKey.objects.filter(key='BDJOB-DEMO-2026-SAAS').exists():
        LicenseKey.objects.create(
            key='BDJOB-DEMO-2026-SAAS',
            user=admin,
            plan=pro_plan,
            max_devices=5,
            notes='Default Sandbox Demo License Key'
        )
        print("✅ Demo License created: BDJOB-DEMO-2026-SAAS")

    print("🎉 Database seeding completed successfully!")

if __name__ == '__main__':
    seed()
