# Database Schema & Entity Relationships

The backend uses a relational data model with PostgreSQL (production) or SQLite3 (local development).

## Entity Relationship Overview

```mermaid
erDiagram
    CustomUser ||--o{ Subscription : "has"
    CustomUser ||--o{ PaymentTransaction : "initiates"
    CustomUser ||--o{ LicenseKey : "owns"
    Plan ||--o{ Subscription : "defines"
    Plan ||--o{ PaymentTransaction : "purchased_in"
    Plan ||--o{ LicenseKey : "grants_access_to"
    LicenseKey ||--o{ LicenseDevice : "authorizes"

    CustomUser {
        int id PK
        string username UK
        string email
        string phone_number UK
        string role
        boolean is_verified
        datetime created_at
    }

    Plan {
        int id PK
        string name
        string slug UK
        string tier
        decimal price_bdt
        int duration_days
        int max_profiles
        int max_devices
        boolean has_photo_resizer
        boolean is_active
    }

    Subscription {
        int id PK
        int user_id FK
        int plan_id FK
        datetime start_date
        datetime end_date
        boolean is_active
        boolean auto_renew
    }

    PaymentTransaction {
        int id PK
        int user_id FK
        int plan_id FK
        string gateway
        decimal amount
        string trx_id UK
        string invoice_number UK
        string payment_id
        string status
        string sender_number
        json gateway_response
        datetime created_at
    }

    LicenseKey {
        int id PK
        string key UK
        int user_id FK
        int plan_id FK
        int max_devices
        boolean is_active
        datetime expires_at
        text notes
    }

    LicenseDevice {
        int id PK
        int license_id FK
        string device_fingerprint
        string device_name
        string ip_address
        boolean is_active
        datetime last_active
    }
```

## Indexes
- `PaymentTransaction.trx_id`: Unique index for bKash/Nagad instant verification.
- `PaymentTransaction.invoice_number`: Unique index for gateway tracking.
- `LicenseKey.key`: Unique B-Tree index for sub-millisecond client validation.
- `LicenseDevice.(license, device_fingerprint)`: Composite unique constraint preventing duplicate device activations.
