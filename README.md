# 🇧🇩 Govt Job Application SaaS & Chrome Extension (Teletalk Autofill BD)

[![Chrome Extension](https://img.shields.io/badge/Chrome-Extension%20MV3-blue.svg?logo=googlechrome)](https://developer.chrome.com/docs/extensions/)
[![Backend: Django REST](https://img.shields.io/badge/Backend-Django%205.2%20DRF-092e20.svg?logo=django)](https://www.djangoproject.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Privacy: 100% Local](https://img.shields.io/badge/Privacy-100%25%20Offline%20Local-success.svg)](frontend/extension/PRIVACY_POLICY.md)

A complete, production-ready commercial SaaS platform and privacy-focused Chrome Extension designed to eliminate tedious manual typing on all Bangladesh Government Job Recruitment portals (`*.teletalk.com.bd`). Fill complex multi-page government job applications in **1 click**, manage **multiple candidate profiles** directly on the webpage, automatically upload resized **300×300 passport photos** and **300×80 signatures**, and monetize via **bKash / Nagad subscription licenses**.

---

## 🏗️ Clean Project Architecture (2 Main Directories)

```text
jobapplication/
│
├── frontend/
│   │
│   ├── extension/                    # 🚀 Chrome Extension (Load this folder in Chrome)
│   │   ├── manifest.json
│   │   ├── background.js
│   │   ├── content.js
│   │   ├── popup.html / popup.js / popup.css
│   │   ├── options.html / options.js / options.css
│   │   ├── storage.js
│   │   ├── autofill-engine.js
│   │   ├── bangladesh-data.js
│   │   ├── site-mappings.js
│   │   ├── validation.js
│   │   ├── passport-photo-editor.js
│   │   ├── PRIVACY_POLICY.md
│   │   ├── tests/                    # Offline Form Testing Suite
│   │   └── icons/
│   │
│   └── admin-dashboard/              # 💻 SaaS Admin Web Portal
│       ├── assets/css/admin.css
│       ├── assets/js/admin.js
│       ├── login/index.html          # Superuser Authentication
│       ├── dashboard/index.html      # Real-time KPIs & Analytics
│       ├── payments/index.html       # bKash & Nagad Transaction Ledger
│       ├── users/index.html          # Candidate Accounts & Directory
│       └── licenses/index.html       # BDJOB License Key Management
│
├── backend/                          # ⚙️ Django REST Framework Backend
│   ├── config/                       # Settings, ASGI/WSGI, Root URLs
│   ├── accounts/                     # Custom User Model & Auth
│   ├── subscriptions/                # Plans (Free, Standard, Pro, Cyber Cafe)
│   ├── payments/                     # bKash Tokenized & Nagad PG APIs
│   ├── licenses/                     # Multi-device Key Verification Engine
│   ├── api/                          # Analytics & Health Checks
│   ├── docs/                         # Technical API & Deployment Guides
│   │   ├── API.md
│   │   ├── DATABASE.md
│   │   └── DEPLOYMENT.md
│   ├── seed_data.py                  # Database Seeder (Admin & Plans)
│   ├── requirements.txt              # Production Dependencies
│   ├── .env                          # Environment Variables
│   └── manage.py
│
└── README.md
```

---

## ⚡ Quick Start: Running the Django Backend

### 1. Install Dependencies
```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Copy `.env.example` or use the provided `.env`:
```bash
# In backend/.env
DJANGO_SECRET_KEY=your-secure-secret-key
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1
```

### 3. Run Migrations & Seed Default Data
```bash
python manage.py migrate
python seed_data.py
```
> **Default Superuser**: Username `admin` | Password `admin123`  
> **Demo License Key**: `BDJOB-DEMO-2026-SAAS`

### 4. Start Local Development Server
```bash
python manage.py runserver
```
- **API Base**: [http://127.0.0.1:8000/api/v1/](http://127.0.0.1:8000/api/v1/)
- **Django Admin**: [http://127.0.0.1:8000/admin/](http://127.0.0.1:8000/admin/)
- **Admin Dashboard**: Open `frontend/admin-dashboard/login/index.html` in your browser.

---

## 📥 How to Install the Chrome Extension

1. Open **Google Chrome** (or Edge/Brave/Opera).
2. Navigate to `chrome://extensions`.
3. Enable **Developer mode** (toggle in top-right corner).
4. Click **Load unpacked**.
5. Select the **`frontend/extension`** folder from this repository.
6. The extension is now loaded and ready to autofill all `*.teletalk.com.bd` job portals!

---

## 💳 Payment Gateway Integrations
- **bKash Tokenized Checkout (v1.2)**: Automated agreement creation, checkout execution, and instant subscription renewal.
- **Nagad Online Payment Gateway**: Direct merchant check-out initialization and callback verification.

---

## 📚 Documentation
- [REST API Reference](backend/docs/API.md)
- [Database Schema & ER Diagrams](backend/docs/DATABASE.md)
- [Production Deployment Guide](backend/docs/DEPLOYMENT.md)

---

## 📄 License & Privacy
- Extension operates **100% offline and locally** on the user's browser.
- Open-source under the [MIT License](LICENSE).
- [Privacy Policy](frontend/extension/PRIVACY_POLICY.md)
