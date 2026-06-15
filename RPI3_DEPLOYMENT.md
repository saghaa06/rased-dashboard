# LPR Dashboard - Raspberry Pi 3 Deployment Guide

This guide walks through deploying the Django + React LPR Dashboard on Raspberry Pi 3 with full role-based admin/agent architecture, camera management, manual entry, and Pi camera support.

## Prerequisites

- **Hardware**: Raspberry Pi 3 Model B/B+ with 1GB RAM, 16GB+ microSD (fast UHS-I recommended)
- **Network**: Ethernet or WiFi (WiFi 5GHz recommended for stability)
- **Optional**: Raspberry Pi Camera v2.1 or USB webcam
- **Time**: ~45 minutes for first-time setup

---

## 1. OS Setup & Network

### 1.1 Flash microSD Card
- Download **Raspberry Pi OS Lite** (Bullseye 32-bit) from https://www.raspberrypi.com/software/
- Use **Raspberry Pi Imager** to write to microSD
- Enable SSH: Create empty `/ssh` file in boot partition
- Optional WiFi: Create `wpa_supplicant.conf` in boot partition:
  ```
  country=DZ
  ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
  update_config=1
  network={
      ssid="YourWiFiSSID"
      psk="YourPassword"
      key_mgmt=WPA-PSK
  }
  ```

### 1.2 Initial Boot & SSH
```bash
# Insert microSD, boot Pi, then SSH from PC/Mac:
ssh pi@raspberrypi.local    # or ssh pi@<pi-ip-address>
# Default password: raspberry
```

### 1.3 System Update
```bash
sudo apt update && sudo apt upgrade -y
sudo raspi-config  # Enable Camera, increase GPU memory to 256MB
sudo reboot
```

---

## 2. Backend Setup (Django)

### 2.1 Install System Dependencies
```bash
# Core Python/dev tools
sudo apt install -y python3-pip python3-venv python3-dev
sudo apt install -y libatlas-base-dev libjasper-dev libtiff5 libjasper1 libharfbuzz0b libwebp6
sudo apt install -y libopenjp2-7 libtiff5 libopenjp2-7 libtiffxx5 libatlas-base-dev
sudo apt install -y libjasper-dev libharfbuzz0b libwebp6 libopenjp2-7 libopenjp2-7-dev

# OpenCV dependencies
sudo apt install -y libatlas-base-dev libjasper-dev libtiff5 libharfbuzz0b libjasper1

# SQLite (included with Python, but ensure build tools)
sudo apt install -y sqlite3 libsqlite3-dev

# For PIL/Pillow
sudo apt install -y libjpeg-dev zlib1g-dev
```

### 2.2 Create Backend Virtual Environment
```bash
cd /home/pi
python3 -m venv lpr_env
source lpr_env/bin/activate
pip install --upgrade pip setuptools wheel
```

### 2.3 Copy Backend Code & Install Dependencies
```bash
# Copy from your dev machine to Pi (run from your PC):
# Windows: use WinSCP or scp from PowerShell
# Linux/Mac:
scp -r /path/to/lpr_dashboard/backend pi@<pi-ip>:/home/pi/

# Or clone if using git:
cd /home/pi && git clone <your-repo-url> lpr_dashboard
cd /home/pi/lpr_dashboard/backend
```

### 2.4 Install Python Requirements
```bash
source /home/pi/lpr_env/bin/activate
cd /home/pi/lpr_dashboard/backend

# Create lightweight requirements for Pi (no GPU)
pip install django==4.2.0
pip install djangorestframework==3.14.0
pip install djangorestframework-simplejwt==5.2.2
pip install django-cors-headers==3.14.0
pip install pillow==10.0.0
pip install opencv-python==4.8.0.74
pip install numpy==1.24.3
pip install whitenoise==6.5.0

# Optional: YOLO for plate detection (can be slow on Pi 3)
# pip install ultralytics==8.0.0

# Test imports
python -c "import django, rest_framework, cv2; print('OK')"
```

### 2.5 Configure Django Settings
Edit `/home/pi/lpr_dashboard/backend/backend/settings.py`:

```python
# Add at the top if not present
import os
from pathlib import Path

# Set to False for production, but disable during setup
DEBUG = False  # Change to False in production

# For Pi behind router
ALLOWED_HOSTS = [
    '127.0.0.1',
    'localhost',
    '192.168.1.*',      # Adjust to your LAN subnet
    'raspberrypi.local',
    '<your-pi-fixed-ip>',
]

# Static/Media files
STATIC_ROOT = '/home/pi/lpr_dashboard/backend/static'
STATIC_URL = '/static/'
MEDIA_ROOT = '/home/pi/lpr_dashboard/backend/media'
MEDIA_URL = '/media/'

# Security headers (when DEBUG=False)
CSRF_TRUSTED_ORIGINS = [
    'http://192.168.1.*:3000',
    'http://localhost:3000',
]

# Whitenoise for static file serving (no nginx needed)
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Add this
    # ... rest of middleware
]

# Enable gzip compression for Pi bandwidth
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'
```

### 2.6 Initialize Database
```bash
cd /home/pi/lpr_dashboard/backend
python manage.py migrate
python manage.py collectstatic --noinput
```

### 2.7 Create Superuser (Admin Account)
```bash
python manage.py createsuperuser
# Follow prompts for username/password
```

### 2.8 Test Backend
```bash
cd /home/pi/lpr_dashboard/backend
python manage.py runserver 0.0.0.0:8000 &
# Then test from another terminal:
curl http://localhost:8000/api/stats/
# Should fail with 401 (auth required) - that's OK
pkill -f "runserver"
```

---

## 3. Frontend Setup (React)

### 3.1 Install Node.js
```bash
# Pi 3 needs 32-bit Node (builds are slow - be patient)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify
node -v  # should be v18.x
npm -v   # should be 9.x
```

### 3.2 Build Frontend for Production
```bash
cd /home/pi/lpr_dashboard/frontend

# Set API endpoint for Pi
export REACT_APP_API_BASE="http://127.0.0.1:8000/api"

# Install dependencies (will take 5-10 minutes)
npm install

# Build static bundle (takes another 10+ minutes)
npm run build

# Result: frontend/build/ directory created
```

### 3.3 Copy Frontend to Django Static Dir
```bash
# The Django backend will serve the React frontend
cp -r /home/pi/lpr_dashboard/frontend/build/* /home/pi/lpr_dashboard/backend/static/

# Update Django settings to serve index.html for all routes
```

### 3.4 Configure Django to Serve Frontend
Edit `backend/backend/urls.py` to add this at the end:

```python
from django.views.generic import TemplateView
from django.urls import path, re_path

# Add this path after the API routes
if not DEBUG:
    urlpatterns += [
        re_path(r'^(?!api|admin).*$', TemplateView.as_view(
            template_name='index.html'
        ), name='frontend'),
    ]
```

Or simpler: use a webserver (nginx) to serve frontend on separate port (see **Systemd Services** section).

---

## 4. Pi Camera Setup (Optional)

### 4.1 Enable Camera & Test
```bash
# Via GUI (recommended for Pi 3):
sudo raspi-config  # Interfacing Options → Camera → Enable

# Test capture
raspistill -o /tmp/test.jpg  # Should work
```

### 4.2 Copy & Configure Pi Capture Script
```bash
cp /home/pi/lpr_dashboard/camera_pi.py /home/pi/
chmod +x /home/pi/camera_pi.py

# Edit to match your Pi's IP and backend URL:
# Line: url = 'http://127.0.0.1:8000/api/capture/'
# Change 127.0.0.1 to your Pi's actual LAN IP if capturing from separate Pi

# Test script (with dummy user token - will fail auth, but shows connection):
# cd /home/pi
# python3 camera_pi.py
```

---

## 5. Systemd Services

Create systemd service files to auto-start and manage services.

### 5.1 Django Backend Service
Create `/etc/systemd/system/lpr-backend.service`:

```ini
[Unit]
Description=LPR Dashboard Django Backend
After=network.target

[Service]
User=pi
WorkingDirectory=/home/pi/lpr_dashboard/backend
Environment="PATH=/home/pi/lpr_env/bin"
ExecStart=/home/pi/lpr_env/bin/gunicorn \
    --workers 2 \
    --worker-class=sync \
    --bind=0.0.0.0:8000 \
    --timeout=30 \
    --access-logfile=/home/pi/lpr_logs/gunicorn_access.log \
    --error-logfile=/home/pi/lpr_logs/gunicorn_error.log \
    backend.wsgi:application

Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 5.2 Nginx Reverse Proxy (Optional but Recommended)
Create `/etc/nginx/sites-available/lpr`:

```nginx
upstream django {
    server 127.0.0.1:8000;
}

server {
    listen 80 default_server;
    server_name _;

    client_max_body_size 10M;

    location /api {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin {
        proxy_pass http://django;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /media {
        alias /home/pi/lpr_dashboard/backend/media;
    }

    location / {
        # Serve React frontend
        root /home/pi/lpr_dashboard/frontend/build;
        try_files $uri /index.html;
    }
}
```

Enable & start:
```bash
sudo ln -s /etc/nginx/sites-available/lpr /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 5.3 Pi Camera Capture Service (Optional)
Create `/etc/systemd/system/lpr-camera.service`:

```ini
[Unit]
Description=LPR Pi Camera Capture
After=network.target lpr-backend.service
Wants=lpr-backend.service

[Service]
User=pi
WorkingDirectory=/home/pi
ExecStart=/usr/bin/python3 /home/pi/camera_pi.py
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 5.4 Enable & Start Services
```bash
# Install gunicorn for Django
source /home/pi/lpr_env/bin/activate
pip install gunicorn==21.0.0

# Create logs directory
mkdir -p /home/pi/lpr_logs

# Reload systemd
sudo systemctl daemon-reload

# Enable services
sudo systemctl enable lpr-backend.service
sudo systemctl enable lpr-camera.service  # if using Pi camera

# Start services
sudo systemctl start lpr-backend.service
sudo systemctl start lpr-camera.service

# Check status
sudo systemctl status lpr-backend.service
sudo systemctl status lpr-camera.service
journalctl -u lpr-backend.service -f  # tail logs
```

---

## 6. User & Role Setup

### 6.1 Create Admin Account
Already done in step 2.7. Verify:
```bash
python manage.py shell
from django.contrib.auth.models import User
from recognition.models import UserProfile
admin = User.objects.get(username='<your-admin-user>')
profile = UserProfile.objects.get(user=admin)
print(f"Admin: {profile.is_admin}, Agent: {profile.is_agent}")
# Should print: Admin: True, Agent: False
```

### 6.2 Create Agent Accounts
```bash
python manage.py shell
from django.contrib.auth.models import User
from recognition.models import UserProfile

# Create agent user
agent = User.objects.create_user(username='agent1', password='agent123')
profile = UserProfile.objects.get(user=agent)
profile.is_admin = False
profile.is_agent = True
profile.assigned_gate = 'Portail 1'  # Optional: assign to specific gate
profile.save()

# Now agent1 can login with password 'agent123'
```

### 6.3 Login & Access
- **Admin**: Full access to stats, history, camera CRUD, settings, manual entry
- **Agent**: Last 24h history only (optionally filtered by assigned gate), manual entry only

Login URL: `http://<pi-ip>/` → redirects to `/login`

---

## 7. Verification & Troubleshooting

### 7.1 Check All Services
```bash
sudo systemctl status lpr-backend.service
sudo systemctl status nginx
# sudo systemctl status lpr-camera.service  # if enabled

# All should show "active (running)"
```

### 7.2 Test API Endpoints
```bash
# Get token
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"<password>"}'

# Use returned access token:
TOKEN="<access-token>"
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/stats/
```

### 7.3 Memory & CPU Issues
Pi 3 has only 1GB RAM. If services crash:
- Reduce gunicorn workers: change `--workers 2` → `--workers 1` in service file
- Disable Pi camera service if not using: `sudo systemctl disable lpr-camera.service`
- Monitor: `htop` or `free -h`

### 7.4 Database Locks (SQLite)
If you see `database is locked`:
```bash
# Check for stale processes
ps aux | grep django
ps aux | grep python

# Kill if needed, then restart service
sudo systemctl restart lpr-backend.service
```

### 7.5 Port Conflicts
- 8000 (Django) and 80 (nginx) in use?
  ```bash
  sudo lsof -i :8000
  sudo lsof -i :80
  ```
- Change port in service files and nginx config

---

## 8. Production Hardening

### 8.1 SSL/TLS (Let's Encrypt via Certbot)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d raspberrypi.local  # or your domain

# Update nginx to use cert
# Add to /etc/nginx/sites-available/lpr:
# listen 443 ssl;
# ssl_certificate /etc/letsencrypt/live/.../fullchain.pem;
# ssl_certificate_key /etc/letsencrypt/live/.../privkey.pem;
```

### 8.2 Firewall
```bash
sudo ufw enable
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw default deny incoming
```

### 8.3 Django Security Settings
Update `backend/settings.py` for production:
```python
DEBUG = False
SECRET_KEY = 'use-a-strong-random-key'
SECURE_SSL_REDIRECT = True          # If using HTTPS
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
ALLOWED_HOSTS = ['your-domain.com', '192.168.1.100']
```

### 8.4 Database Backups
```bash
# Daily backup script: /home/pi/backup_db.sh
#!/bin/bash
cp /home/pi/lpr_dashboard/backend/db.sqlite3 \
   /home/pi/backups/db_$(date +%Y%m%d).sqlite3

# Add to crontab:
# 0 2 * * * /home/pi/backup_db.sh
```

---

## 9. Monitoring & Logs

### 9.1 View Logs
```bash
# Django logs
journalctl -u lpr-backend.service -f -n 50

# Nginx logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Gunicorn logs (if configured)
tail -f /home/pi/lpr_logs/gunicorn_*.log
```

### 9.2 Monitor Services
```bash
# Auto-restart if Pi crashes
sudo systemctl restart lpr-backend.service

# Check if still alive
curl http://127.0.0.1:8000/api/stats/ 2>/dev/null || echo "Backend down!"
```

---

## 10. Quick Commands Reference

```bash
# Activate environment
source /home/pi/lpr_env/bin/activate

# Django shell
cd /home/pi/lpr_dashboard/backend && python manage.py shell

# View services
sudo systemctl list-units --type=service | grep lpr

# Restart all
sudo systemctl restart lpr-backend.service && sudo systemctl restart nginx

# Full logs
journalctl -u lpr-backend.service --since="1 hour ago"

# Clean up old media files (older than 30 days)
find /home/pi/lpr_dashboard/backend/media/uploads -mtime +30 -delete
```

---

## Support & Next Steps

- **Scaling**: Move to Pi 4 (4GB+) for better performance with YOLO inference
- **Cloud Sync**: Add PostgreSQL + Sync service to backup to cloud
- **Mobile App**: Add React Native companion app for alerts
- **Multi-Pi**: Setup mesh network of Pi cameras with central dashboard Pi

Estimated Resource Usage:
- **Storage**: 500MB (OS) + 200MB (deps) + 100MB (DB + uploads) ≈ **1GB**
- **Memory (idle)**: ~300MB; (under load): ~600MB
- **CPU**: Low for recognition; spikes on YOLO inference

---

**Last Updated**: 2024
**Compatible**: Raspberry Pi 3 Model B/B+, Bullseye 32-bit
**Django**: 4.2.0 | **React**: 18.x | **Node**: 18.x
