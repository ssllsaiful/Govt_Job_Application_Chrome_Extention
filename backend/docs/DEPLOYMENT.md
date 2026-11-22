# Production Deployment Guide (Ubuntu / Nginx / Gunicorn / PostgreSQL)

This guide details deploying the Teletalk Job Application SaaS backend and Admin Dashboard to an Ubuntu 22.04 / 24.04 LTS server.

---

## 1. System Prerequisites

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib git certbot python3-certbot-nginx
```

---

## 2. PostgreSQL Setup

```bash
sudo -u postgres psql
```
```sql
CREATE DATABASE teletalk_saas_db;
CREATE USER teletalk_user WITH PASSWORD 'StrongPasswordHere!@#';
ALTER ROLE teletalk_user SET client_encoding TO 'utf8';
ALTER ROLE teletalk_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE teletalk_user SET timezone TO 'Asia/Dhaka';
GRANT ALL PRIVILEGES ON DATABASE teletalk_saas_db TO teletalk_user;
\q
```

---

## 3. Clone & Environment Configuration

```bash
cd /var/www
git clone https://github.com/ssllsaiful/Govt_Job_Application_Chrome_Extention.git jobapplication
cd jobapplication/backend

# Create virtualenv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
pip install gunicorn psycopg2-binary
```

### Configure `.env`
```bash
cp ../.env.example .env
nano .env
```
Ensure `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS=yourdomain.com,api.yourdomain.com`, and database credentials are set.

---

## 4. Database Migrations & Static Files

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

---

## 5. Systemd Service Setup (`gunicorn.service`)

Create `/etc/systemd/system/teletalk_saas.service`:
```ini
[Unit]
Description=Gunicorn daemon for Teletalk Job SaaS Django Backend
After=network.target

[Service]
User=www-data
Group=www-data
WorkingDirectory=/var/www/jobapplication/backend
ExecStart=/var/www/jobapplication/backend/venv/bin/gunicorn \
          --access-logfile - \
          --workers 3 \
          --bind 127.0.0.1:8000 \
          config.wsgi:application

[Install]
WantedBy=multi-user.target
```

Enable and start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start teletalk_saas
sudo systemctl enable teletalk_saas
```

---

## 6. Nginx Virtual Host Configuration

Create `/etc/nginx/sites-available/teletalk_saas`:
```nginx
server {
    server_name saas.yourdomain.com;

    # Admin Dashboard Frontend Static Serving
    location /admin-dashboard/ {
        alias /var/www/jobapplication/frontend/admin-dashboard/;
        index index.html;
        try_files $uri $uri/ /admin-dashboard/index.html;
    }

    # Django Static Files
    location /static/ {
        alias /var/www/jobapplication/backend/staticfiles/;
    }

    # Django Media Files
    location /media/ {
        alias /var/www/jobapplication/backend/media/;
    }

    # Django API & Admin Proxy
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site & test:
```bash
sudo ln -s /etc/nginx/sites-available/teletalk_saas /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 7. SSL with Let's Encrypt Certbot

```bash
sudo certbot --nginx -d saas.yourdomain.com
```
