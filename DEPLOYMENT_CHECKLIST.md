# LPR Dashboard - Deployment Checklist

Use this checklist to ensure a smooth deployment of the LPR Dashboard to Raspberry Pi 3 and beyond.

---

## Pre-Deployment (Dev Machine)

### Code Review
- [ ] All backend endpoints tested locally with curl or Postman
- [ ] Frontend builds without errors: `npm run build`
- [ ] No console errors in browser DevTools
- [ ] All API calls use correct base URL
- [ ] Role-based access control verified (admin vs agent)

### Documentation
- [ ] README.md reviewed
- [ ] API_ARCHITECTURE.md reviewed
- [ ] RPI3_DEPLOYMENT.md reviewed
- [ ] Team aware of deployment plan

### Data Prep
- [ ] Test data entered (vehicles, plates, users)
- [ ] Database backed up locally
- [ ] Migration scripts prepared (if needed)
- [ ] Sample images collected for testing

### Dependencies Locked
- [ ] `backend/requirements.txt` complete and tested
- [ ] `frontend/package.json` versions pinned
- [ ] All critical dependencies documented
- [ ] No deprecated packages used

---

## Pi 3 OS Setup

### Hardware
- [ ] Raspberry Pi 3 Model B/B+ with > 16GB microSD (UHS-I recommended)
- [ ] Ethernet cable or WiFi configured
- [ ] Power supply (2.5A minimum)
- [ ] Optional: Pi camera v2.1 connected and enabled
- [ ] Optional: Heat sink/cooling fan installed

### Initial Flash & Network
- [ ] microSD flashed with Raspberry Pi OS Lite (Bullseye 32-bit)
- [ ] SSH enabled (empty `/ssh` file in boot partition)
- [ ] WiFi configured (if using WiFi)
- [ ] Static IP configured (recommend via router DHCP reservation)
- [ ] SSH access verified: `ssh pi@<ip-address>`
- [ ] OS updated: `sudo apt update && sudo apt upgrade -y`
- [ ] Timezone set: `sudo timedatectl set-timezone <timezone>`

---

## Backend Setup

### System Dependencies
- [ ] Python 3.8+ installed and verified: `python3 --version`
- [ ] pip upgraded: `pip install --upgrade pip`
- [ ] venv available: `python3 -m venv test && rm -rf test`
- [ ] Build essentials: `sudo apt install -y python3-dev build-essential`
- [ ] SQLite3 installed: `which sqlite3`
- [ ] OpenCV dependencies installed (see RPI3_DEPLOYMENT.md section 2.1)
- [ ] Pillow dependencies installed

### Backend Venv
- [ ] Virtual environment created: `/home/pi/lpr_env/`
- [ ] Activated and verified: `source /home/pi/lpr_env/bin/activate`
- [ ] Requirements installed: `pip install -r requirements.txt`
- [ ] All imports verified: `python -c "import django, rest_framework, cv2, numpy"`
- [ ] No dependency conflicts

### Django Configuration
- [ ] Code copied to Pi: `/home/pi/lpr_dashboard/`
- [ ] `backend/settings.py` reviewed:
  - [ ] `DEBUG = False`
  - [ ] `SECRET_KEY` is strong random string (not hardcoded)
  - [ ] `ALLOWED_HOSTS` includes Pi IP + domain
  - [ ] `CORS_ALLOWED_ORIGINS` includes frontend origin
  - [ ] `STATIC_ROOT` and `MEDIA_ROOT` set correctly
  - [ ] `DATABASES` uses SQLite (default)
- [ ] Database initialized: `python manage.py migrate`
- [ ] Static files collected: `python manage.py collectstatic --noinput`

### Superuser & Initial Data
- [ ] Superuser created: `python manage.py createsuperuser`
- [ ] Admin account credentials saved securely (password manager)
- [ ] Admin can login to `/admin` endpoint
- [ ] Test agent account created
- [ ] Both users have correct role assignments

### Backend Testing
- [ ] Gunicorn installed: `pip install gunicorn`
- [ ] Test run successful: `gunicorn --workers 2 --bind 0.0.0.0:8000 backend.wsgi:application`
- [ ] All API endpoints tested with token
- [ ] Database queries working
- [ ] No error messages in logs

---

## Frontend Setup

### Node.js & npm
- [ ] Node.js 16+ installed: `node --version`
- [ ] npm 8+ installed: `npm --version`
- [ ] Updated: `npm install -g npm@latest`

### Frontend Build
- [ ] `REACT_APP_API_BASE` set to backend URL (e.g., `http://192.168.1.100:8000/api`)
- [ ] Code copied to Pi: `/home/pi/lpr_dashboard/frontend/`
- [ ] Dependencies installed: `npm install` (be patient, 5-10 min)
- [ ] Production build created: `npm run build` (10+ min)
- [ ] `build/` directory created and non-empty (> 100KB)

### Nginx Configuration
- [ ] Nginx installed: `sudo apt install -y nginx`
- [ ] Config file created: `/etc/nginx/sites-available/lpr`
- [ ] Config symlinked: `sudo ln -s /etc/nginx/sites-available/lpr /etc/nginx/sites-enabled/lpr`
- [ ] Default site disabled: `sudo rm /etc/nginx/sites-enabled/default`
- [ ] Config tested: `sudo nginx -t` (should return "OK")
- [ ] Nginx started: `sudo systemctl start nginx`
- [ ] Nginx enabled: `sudo systemctl enable nginx`

---

## Systemd Services

### Backend Service
- [ ] Service file created: `/etc/systemd/system/lpr-backend.service`
- [ ] Paths correct (venv, working directory, wsgi app)
- [ ] User set to `pi`
- [ ] Restart policy set to `on-failure`
- [ ] Log directory created: `/home/pi/lpr_logs/`
- [ ] Permissions set: `chown pi:pi /home/pi/lpr_logs/`
- [ ] Service loaded: `sudo systemctl daemon-reload`
- [ ] Service enabled: `sudo systemctl enable lpr-backend.service`
- [ ] Service started: `sudo systemctl start lpr-backend.service`
- [ ] Status verified: `sudo systemctl status lpr-backend.service` (should be "active")
- [ ] Can access on port 8000 (internally or via curl)

### Pi Camera Service (Optional)
- [ ] Service file created: `/etc/systemd/system/lpr-camera.service` (if using Pi camera)
- [ ] Paths correct (`camera_pi.py` location)
- [ ] User set to `pi`
- [ ] After directive: `After=network.target lpr-backend.service`
- [ ] Service enabled: `sudo systemctl enable lpr-camera.service`
- [ ] Service started: `sudo systemctl start lpr-camera.service`
- [ ] Status verified: `sudo systemctl status lpr-camera.service` (should be "active")

### Service Integration
- [ ] Nginx listens on port 80, forwards to Django 8000
- [ ] Frontend routes correctly (no 404 on page reload)
- [ ] Backend API accessible via Nginx
- [ ] Services restart on boot: reboot and check

---

## Testing & Verification

### Connectivity
- [ ] Pi accessible via SSH: `ssh pi@<ip>`
- [ ] Web interface accessible: `http://<pi-ip>/` (opens login)
- [ ] API accessible: `curl http://<pi-ip>/api/stats/` (returns 401, OK)

### Authentication
- [ ] Admin login works
- [ ] JWT token obtained
- [ ] Token can be used for API calls
- [ ] Logout clears token
- [ ] Agent login works with restricted access

### Dashboards
- [ ] Admin dashboard loads (all KPIs visible)
- [ ] Agent dashboard loads (24h limited)
- [ ] Stats endpoint returns data
- [ ] History table populates
- [ ] Manual entry form works
- [ ] Camera management visible (admin only)

### Data Flow
- [ ] Manual entry creates record in database
- [ ] Image upload works (if testing with pictures)
- [ ] Pi camera (if enabled) auto-uploads images
- [ ] Records appear in history within seconds

### Error Handling
- [ ] Logout and try accessing admin endpoints (should redirect to login)
- [ ] Test with invalid token (should return 401)
- [ ] Test with wrong role (agent trying admin endpoint, should return 403)
- [ ] Server errors gracefully handled in UI

### Logs
- [ ] No errors in journalctl: `journalctl -u lpr-backend.service`
- [ ] No errors in Nginx: `sudo tail -f /var/log/nginx/error.log`
- [ ] Database not locked
- [ ] All migrations successful

---

## Performance & Monitoring

### Resource Usage
- [ ] Memory usage acceptable: `free -h` (< 800MB under normal load)
- [ ] CPU usage reasonable: `top` (not maxed out)
- [ ] Disk space sufficient: `df -h` (> 500MB free)
- [ ] No swap thrashing: `vmstat 1 5`

### Responsiveness
- [ ] API responses < 1 second (typical)
- [ ] History table loads within 3 seconds
- [ ] Page refresh doesn't timeout
- [ ] No memory leaks on long-running sessions

### Monitoring Setup
- [ ] Log rotation configured (if needed): `/etc/logrotate.d/`
- [ ] Cron backup script created (optional but recommended)
- [ ] Monitoring dashboard or alerts setup (optional)

---

## Security Hardening

### Firewall
- [ ] UFW enabled: `sudo ufw enable`
- [ ] SSH allowed: `sudo ufw allow 22/tcp`
- [ ] HTTP allowed: `sudo ufw allow 80/tcp`
- [ ] HTTPS allowed (if configured): `sudo ufw allow 443/tcp`
- [ ] Unnecessary ports closed
- [ ] Firewall status verified: `sudo ufw status`

### SSL/TLS (Optional but Recommended)
- [ ] Certbot installed: `sudo apt install -y certbot python3-certbot-nginx`
- [ ] Certificate obtained: `sudo certbot certonly --nginx -d <domain>`
- [ ] Nginx updated to use HTTPS
- [ ] HTTP redirects to HTTPS
- [ ] Certificate auto-renewal scheduled
- [ ] Port 443 in firewall
- [ ] All API calls use `https://`

### Authentication
- [ ] Strong superuser password set (> 12 chars, mixed case/numbers)
- [ ] Agent accounts have unique passwords
- [ ] No default credentials left
- [ ] Credentials not in version control
- [ ] Two-factor authentication considered (future)

### Django Security
- [ ] `SECRET_KEY` is strong random (not in git)
- [ ] `DEBUG = False` in production
- [ ] `SECURE_SSL_REDIRECT = True` (if HTTPS)
- [ ] `SESSION_COOKIE_SECURE = True`
- [ ] `CSRF_COOKIE_SECURE = True`
- [ ] `ALLOWED_HOSTS` restrictive (not `*`)
- [ ] CORS origins restrictive

### Database
- [ ] Automated backups configured: `/home/pi/backup_db.sh`
- [ ] Backup cron job scheduled: `crontab -e`
- [ ] First backup executed and verified
- [ ] Backup stored on external medium or cloud (if possible)
- [ ] Recovery procedure documented and tested

---

## Documentation & Knowledge Transfer

### Documentation
- [ ] Deployment logs saved (timestamps, steps taken)
- [ ] Network diagram created (Pi, network, cameras, etc.)
- [ ] User credentials saved securely (password manager, not plain text)
- [ ] Admin contact information documented
- [ ] Troubleshooting guide created
- [ ] Backup recovery procedure documented

### Team Knowledge
- [ ] Team trained on how to:
  - [ ] Access dashboards
  - [ ] Add/manage users
  - [ ] View history
  - [ ] Manage cameras
  - [ ] Interpret logs
- [ ] Support contact identified
- [ ] Escalation procedure documented
- [ ] On-call rotation setup (if applicable)

---

## Post-Deployment (First Week)

### Monitoring
- [ ] System running continuously (24h+)
- [ ] No unexpected restarts
- [ ] No memory leaks or resource issues
- [ ] Database not growing unexpectedly
- [ ] Performance stable

### User Testing
- [ ] Admin users can perform all operations
- [ ] Agent users have correct restrictions
- [ ] Manual entries visible in history
- [ ] Dashboards update correctly
- [ ] No login/logout issues

### Troubleshooting
- [ ] Any issues logged and resolved
- [ ] Root cause analysis performed
- [ ] Fix documented for future reference
- [ ] Preventive measures taken if needed

### Optimization
- [ ] Fine-tune Gunicorn workers if needed
- [ ] Adjust Django settings for performance
- [ ] Clear old logs if disk space is concern
- [ ] Database maintenance (VACUUM) if needed

---

## Scaling & Future

### For Multi-Site Setup
- [ ] Central Pi dashboard
- [ ] Multiple Pi cameras (network cameras preferred)
- [ ] Cloud storage for backups (AWS S3, etc.)
- [ ] Centralized logging (ELK, etc.)

### For Performance Improvement
- [ ] Move to Pi 4 (4GB+ RAM)
- [ ] Migrate to PostgreSQL (better multi-user)
- [ ] Separate inference server (GPU-accelerated YOLO)
- [ ] Add Redis for caching
- [ ] Add Celery for async tasks

### For Feature Enhancement
- [ ] Mobile app (React Native)
- [ ] Advanced analytics (heatmaps, traffic flow)
- [ ] Real-time alerts (email, SMS, webhook)
- [ ] Integration with external systems (parking, tolls)

---

## Sign-Off

- **Deployed By**: _________________________ **Date**: __________
- **Verified By**: _________________________ **Date**: __________
- **Approved By**: _________________________ **Date**: __________

### Notes
```
[Space for deployment notes, issues encountered, resolutions]
```

---

## Emergency Contacts

| Role | Name | Phone | Email |
|------|------|-------|-------|
| Admin | | | |
| Backup | | | |
| IT Support | | | |

---

**Version**: 1.0 | **Last Updated**: 2024 | **Applies to**: Pi 3 Model B/B+ with Django 4.2 + React 18
