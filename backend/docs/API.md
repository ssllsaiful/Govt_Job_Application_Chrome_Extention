# Teletalk Job Application SaaS - REST API Reference (v1)

Base URL: `http://localhost:8000/api/v1/`

All request payloads and responses use standard JSON (`application/json`).

---

## 1. Authentication Endpoints (`/api/v1/auth/`)

### 1.1 Register Candidate
- **Endpoint**: `POST /auth/register/`
- **Request Body**:
  ```json
  {
    "username": "saiful_bd",
    "password": "Password123!",
    "email": "saiful@example.com",
    "phone_number": "01711223344",
    "first_name": "Md. Saiful",
    "last_name": "Islam"
  }
  ```
- **Response (201 Created)**:
  ```json
  {
    "success": true,
    "message": "User registered successfully.",
    "user": {
      "id": 1,
      "username": "saiful_bd",
      "phone_number": "01711223344",
      "role": "user"
    }
  }
  ```

### 1.2 User Login
- **Endpoint**: `POST /auth/login/`
- **Request Body**:
  ```json
  {
    "username": "saiful_bd",
    "password": "Password123!"
  }
  ```

### 1.3 User Profile
- **Endpoint**: `GET /auth/profile/` & `PUT /auth/profile/`

---

## 2. Subscription Endpoints (`/api/v1/subscriptions/`)

### 2.1 List Available Plans
- **Endpoint**: `GET /subscriptions/plans/`
- **Response (200 OK)**:
  ```json
  [
    {
      "id": 1,
      "name": "Standard Plan",
      "slug": "standard",
      "price_bdt": "300.00",
      "duration_days": 30,
      "max_profiles": 3,
      "max_devices": 2
    },
    {
      "id": 2,
      "name": "Pro / Cyber Cafe",
      "slug": "pro",
      "price_bdt": "500.00",
      "duration_days": 30,
      "max_profiles": 999,
      "max_devices": 5
    }
  ]
  ```

### 2.2 Get Active Subscription
- **Endpoint**: `GET /subscriptions/my-subscription/`

---

## 3. Payments & Gateways (`/api/v1/payments/`)

### 3.1 Initiate Payment (bKash / Nagad)
- **Endpoint**: `POST /payments/initiate/`
- **Request Body**:
  ```json
  {
    "plan_id": 2,
    "gateway": "bkash",
    "sender_number": "01711223344"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "success": true,
    "invoice_number": "INV-78A1B9C2",
    "amount": 500.0,
    "gateway": "bkash",
    "checkout_url": "https://tokenized.sandbox.bka.sh/checkout?paymentID=BK78A1B9C2"
  }
  ```

### 3.2 bKash Webhook Callback
- **Endpoint**: `GET /payments/bkash/callback/?paymentID=...&status=success&invoice=...`

### 3.3 Nagad Verification Callback
- **Endpoint**: `GET /payments/nagad/callback/?order_id=...&payment_ref_id=...`

---

## 4. Extension License Manager (`/api/v1/licenses/`)

### 4.1 Validate License & Activate Device (Chrome Extension Client)
- **Endpoint**: `POST /licenses/validate/`
- **Request Body**:
  ```json
  {
    "license_key": "BDJOB-8K9A-3M2Q-7P1L",
    "device_fingerprint": "chrome-hash-8823f0a1b",
    "device_name": "Chrome on Windows 11"
  }
  ```
- **Response (200 OK)**:
  ```json
  {
    "valid": true,
    "message": "License key validated and device activated successfully.",
    "plan_tier": "pro",
    "max_devices": 5,
    "active_devices": 2,
    "expires_at": "2027-11-22T00:00:00Z"
  }
  ```

---

## 5. System Analytics (`/api/v1/dashboard-stats/`)
- Returns KPI totals: `total_users`, `active_subscribers`, `total_revenue`, and recent payment flows.
