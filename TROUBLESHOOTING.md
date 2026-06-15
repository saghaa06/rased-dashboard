# LPR Dashboard - Troubleshooting Guide

Common issues, diagnostic steps, and solutions.

---

## Backend Issues

### Issue: Django Won't Start (Port Conflict)

**Symptoms**: `Address already in use` error when running `python manage.py runserver`

**Diagnosis**:
```bash
lsof -i :8000
```

**Solution**:
```bash
# Option 1: Use a different port
python manage.py runserver 0.0.0.0:8001

# Option 2: Kill the existing process
kill -9 <PID>

# Option 3: Restart systemd service (production)
sudo systemctl restart lpr-backend.service
```

---

### Issue: Database Locked

**Symptoms**: `database is locked` error, transactions failing

**Diagnosis**:
```bash
ps aux | grep django
ps aux | grep python
```

**Solution**:
```bash
# Check for stale processes
lsof +D /home/pi/lpr_dashboard/backend/

# Kill stuck processes
pkill -f "python manage.py"
pkill -f gunicorn

# Restart service
sudo systemctl restart lpr-backend.service

# If corruption suspected, check integrity
sqlite3 /home/pi/lpr_dashboard/backend/db.sqlite3 "PRAGMA integrity_check;"
```

**Prevention**:
- Only run one Django instance at a time
- Use connection pooling (add `django-db-multitenant` if needed)

---

### Issue: Module Not Found

**Symptoms**: `ModuleNotFoundError: No module named 'cv2'` or similar

**Diagnosis**:
```bash
source /home/pi/lpr_env/bin/activate
python -c "import cv2; print(cv2.__version__)"
pip list
```

**Solution**:
```bash
# Reinstall package
pip install --upgrade opencv-python

# Or full environment reset (use with caution)
rm -rf /home/pi/lpr_env
python3 -m venv /home/pi/lpr_env
source /home/pi/lpr_env/bin/activate
pip install -r /home/pi/lpr_dashboard/backend/requirements.txt
```

---

### Issue: API Returns 401 Unauthorized

**Symptoms**: All API endpoints return `{"detail": "Authentication credentials not provided"}`

**Diagnosis**:
```bash
# Check if token is in request header
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/stats/

# Verify token format
# Should be: Authorization: Bearer eyJ0eXAi...
```

**Solution**:
```bash
# Get new token
curl -X POST http://localhost:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use returned access token in header
TOKEN="eyJ0eXAi..."
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/stats/
```

---

### Issue: API Returns 403 Forbidden

**Symptoms**: Authenticated but `{"error": "Non autorisé"}` response

**Diagnosis**:
```bash
# Check user role
python manage.py shell
from django.contrib.auth.models import User
from recognition.models import UserProfile
user = User.objects.get(username='agent1')
profile = UserProfile.objects.get(user=user)
print(f"Admin: {profile.is_admin}, Agent: {profile.is_agent}")
```

**Solution**:
```bash
# Fix user role
python manage.py shell
from django.contrib.auth.models import User
from recognition.models import UserProfile
user = User.objects.get(username='agent1')
profile = UserProfile.objects.get(user=user)
profile.is_admin = True  # or False, depending on need
profile.save()
```

**Reference**: See [API_ARCHITECTURE.md](./API_ARCHITECTURE.md) - Role-Based Access Control section

---

### Issue: CORS Error (Frontend Can't Call Backend)

**Symptoms**: Browser console shows `CORS policy: Response to preflight request doesn't pass access control check`

**Diagnosis**:
```bash
# Check backend settings
grep -A 5 "CORS_ALLOWED_ORIGINS" /home/pi/lpr_dashboard/backend/backend/settings.py

# Check what origin browser is sending
# (visible in browser DevTools Network tab under Request Headers)
```

**Solution**:
```python
# Edit backend/settings.py and add frontend origin
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",           # Dev
    "http://192.168.1.100",            # Production Pi IP
    "http://raspberrypi.local",        # Pi hostname
]
```

Then restart Django:
```bash
sudo systemctl restart lpr-backend.service
```

---

### Issue: Static Files Not Loading (404)

**Symptoms**: `/api/stats/` works but `/static/main.js` returns 404

**Diagnosis**:
```bash
# Check static files were collected
ls -la /home/pi/lpr_dashboard/backend/static/

# Check Nginx config
grep "location /static" /etc/nginx/sites-available/lpr
```

**Solution**:
```bash
# Collect static files
cd /home/pi/lpr_dashboard/backend
python manage.py collectstatic --noinput --clear

# Verify Nginx has correct path
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

---

## Frontend Issues

### Issue: React Page Blank / Won't Load

**Symptoms**: Browser shows blank page, no content, no obvious errors

**Diagnosis**:
1. **Open browser DevTools** (F12)
2. **Check Console tab** for JavaScript errors
3. **Check Network tab** - see if API calls succeed
4. **Check if backend is running**: `curl http://127.0.0.1:8000/api/stats/`

**Solution**:
```bash
# Development
cd /home/pi/lpr_dashboard/frontend
npm start  # This should show errors in terminal

# Production
npm run build
# Check for build errors

# Check if REACT_APP_API_BASE is set
echo $REACT_APP_API_BASE

# If not set, export it
export REACT_APP_API_BASE='http://127.0.0.1:8000/api'
npm start
```

---

### Issue: Login Form Doesn't Work

**Symptoms**: Clicking "Login" does nothing, or shows error

**Diagnosis**:
```bash
# Check browser console (F12) for errors
# Check if backend is running
curl http://127.0.0.1:8000/api/token/ \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

**Solution**:
```javascript
// Check frontend/src/AuthContext.js
// Verify API_BASE is correct

const API_BASE = process.env.REACT_APP_API_BASE || 'http://127.0.0.1:8000/api';
// Should match your backend URL

// If stuck, set hardcoded temporarily:
// const API_BASE = 'http://192.168.1.100:8000/api';
```

**Restart frontend**:
```bash
npm start  # or Ctrl+C and restart
```

---

### Issue: Dashboard Shows "Loading..." Forever

**Symptoms**: Dashboards never load data, always spinning

**Diagnosis**:
1. Check **Network tab** in DevTools - are API calls succeeding?
2. Check browser **Console** for errors
3. Check backend **logs**: `journalctl -u lpr-backend.service -f`

**Solution**:
```bash
# Check backend is responding
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/stats/

# If 401 or 403, see earlier sections

# If 500 error, check Django logs
journalctl -u lpr-backend.service -n 50

# If slow, check database
python manage.py shell
from recognition.models import RecognizedPlate
print(RecognizedPlate.objects.count())  # Should be fast
```

---

### Issue: Logout Doesn't Work

**Symptoms**: Clicking logout does nothing, or returns to logged-in state

**Diagnosis**:
```javascript
// Check browser DevTools → Application → Local Storage
// Look for "token" key
```

**Solution**:
```javascript
// Check frontend/src/AuthContext.js logout function
const logout = () => {
  setAuthToken(null);
  setUser(null);
};

// Make sure it's clearing localStorage
localStorage.removeItem('token');
```

**Manual fix**:
```javascript
// In browser console (F12)
localStorage.removeItem('token');
window.location.href = '/login';
```

---

### Issue: npm install Takes Forever

**Symptoms**: `npm install` hangs or takes > 30 minutes

**Diagnosis**:
```bash
# Check network
ping 8.8.8.8

# Check npm registry
npm config get registry

# Check available disk space
df -h
```

**Solution**:
```bash
# Use faster registry (optional)
npm config set registry https://registry.npmjs.org/

# Clear npm cache
npm cache clean --force

# Retry install (be patient on Pi 3, can take 10-15 min)
npm install

# Or use yarn (faster alternative)
npm install -g yarn
yarn install
```

---

## Pi Camera Issues

### Issue: Camera Not Detected

**Symptoms**: `camera_pi.py` fails or `libmmal` errors

**Diagnosis**:
```bash
# Check camera is enabled
vcgencmd get_camera

# Test with raspistill
raspistill -o /tmp/test.jpg
```

**Solution**:
```bash
# Enable camera via raspi-config
sudo raspi-config
# Navigate to: Interfacing Options → Camera → Enable → Reboot

# Increase GPU memory (optional, helps with video)
sudo raspi-config
# Advanced Options → GPU Memory → 256 MB
```

---

### Issue: camera_pi.py Script Fails

**Symptoms**: Script crashes or logs show errors

**Diagnosis**:
```bash
# Run script directly (not via systemd)
cd /home/pi
python3 camera_pi.py

# Watch logs
journalctl -u lpr-camera.service -f
```

**Solution**:
```bash
# Check script exists and is executable
ls -la /home/pi/camera_pi.py
chmod +x /home/pi/camera_pi.py

# Check Python path in systemd file
cat /etc/systemd/system/lpr-camera.service
# Should use /usr/bin/python3 or /home/pi/lpr_env/bin/python

# Test script with hardcoded backend URL
# Edit camera_pi.py line:
# url = 'http://127.0.0.1:8000/api/capture/'
# And run it directly
python3 /home/pi/camera_pi.py
```

---

### Issue: Captured Images Not Appearing

**Symptoms**: camera_pi.py runs but no images in history

**Diagnosis**:
```bash
# Check if uploads directory exists
ls -la /home/pi/lpr_dashboard/backend/media/uploads/

# Check logs for errors
journalctl -u lpr-backend.service | grep -i "upload\|image"

# Check database has records
sqlite3 /home/pi/lpr_dashboard/backend/db.sqlite3 \
  "SELECT COUNT(*) FROM recognition_recognizedplate WHERE entry_method='auto';"
```

**Solution**:
```bash
# Ensure media directory is writable
sudo chown pi:pi -R /home/pi/lpr_dashboard/backend/media
chmod 755 /home/pi/lpr_dashboard/backend/media
chmod 755 /home/pi/lpr_dashboard/backend/media/uploads

# Restart services
sudo systemctl restart lpr-backend.service
sudo systemctl restart lpr-camera.service

# Check camera script has correct token (if auth required)
# Edit camera_pi.py to include auth header
```

---

## Network & Connectivity Issues

### Issue: Can't SSH to Pi

**Symptoms**: `Connection refused` or timeout

**Diagnosis**:
```bash
# From your PC/Mac
ping <pi-ip>
ssh -vvv pi@<pi-ip>  # Verbose output
```

**Solution**:
```bash
# Verify Pi is on network
# Check router admin page for Pi IP

# Ensure SSH is enabled on Pi (headless setup)
# Reflash microSD with SSH enabled, or:
sudo systemctl enable ssh
sudo systemctl start ssh

# Check firewall (if Pi has ufw enabled)
sudo ufw allow 22/tcp
```

---

### Issue: Frontend Can't Reach Backend on Network

**Symptoms**: Works on localhost (http://127.0.0.1:8000) but not on Pi IP

**Diagnosis**:
```bash
# From your PC on same network
ping <pi-ip>
curl http://<pi-ip>/api/stats/  # Should get 401 (auth required)
```

**Solution**:
1. **Update `ALLOWED_HOSTS` in backend settings**:
   ```python
   ALLOWED_HOSTS = [
       '127.0.0.1',
       'localhost',
       '<pi-ip>',
       'raspberrypi.local',
       '192.168.1.*'
   ]
   ```

2. **Update `REACT_APP_API_BASE`**:
   ```bash
   export REACT_APP_API_BASE='http://<pi-ip>:8000/api'
   # or modify frontend src/AuthContext.js
   ```

3. **Restart services**:
   ```bash
   sudo systemctl restart lpr-backend.service
   npm start  # or rebuild
   ```

---

### Issue: Nginx Returns 502 Bad Gateway

**Symptoms**: `502 Bad Gateway` when accessing http://<pi-ip>/

**Diagnosis**:
```bash
# Check Nginx error log
sudo tail -f /var/log/nginx/error.log

# Check if Django is running
curl http://127.0.0.1:8000/api/stats/  # On Pi itself

# Check Nginx config
sudo nginx -t

# Check what's listening on port 8000
lsof -i :8000
```

**Solution**:
```bash
# Start/restart Django service
sudo systemctl restart lpr-backend.service
sudo systemctl status lpr-backend.service

# Or start manually to debug
/home/pi/lpr_env/bin/gunicorn \
  --workers 1 \
  --bind 0.0.0.0:8000 \
  --chdir /home/pi/lpr_dashboard/backend \
  backend.wsgi:application

# Check Nginx can reach Django
curl -H "Host: localhost" http://127.0.0.1:8000/api/stats/

# Reload Nginx
sudo systemctl reload nginx
```

---

## Performance & Resource Issues

### Issue: Pi Running Slow / High CPU/Memory

**Symptoms**: System sluggish, fans loud, responsive slow

**Diagnosis**:
```bash
# Check resource usage
htop  # Interactive process viewer
free -h  # Memory
df -h  # Disk space
vcgencmd measure_temp  # Temperature

# Check for process leaks
ps aux | grep python
ps aux | grep node
```

**Solution**:
```bash
# Kill unnecessary processes
pkill -f "old_process"

# Reduce Gunicorn workers if memory constrained
# Edit /etc/systemd/system/lpr-backend.service
# Change: --workers 2 → --workers 1

# Stop unnecessary services
sudo systemctl stop lpr-camera.service  # If not needed
sudo systemctl disable bluetooth  # If not used

# Restart services
sudo systemctl daemon-reload
sudo systemctl restart lpr-backend.service

# Monitor over time
watch -n 2 free -h
```

### Issue: Database Growing Too Large

**Symptoms**: Disk space filling up, queries slow

**Diagnosis**:
```bash
# Check database size
du -h /home/pi/lpr_dashboard/backend/db.sqlite3

# Check record count
sqlite3 db.sqlite3 "SELECT COUNT(*) FROM recognition_recognizedplate;"
```

**Solution**:
```bash
# Delete old records (Django way)
python manage.py shell
from recognition.models import RecognizedPlate
from datetime import timedelta
from django.utils import timezone

cutoff = timezone.now() - timedelta(days=30)
old = RecognizedPlate.objects.filter(created_at__lt=cutoff)
print(f"Deleting {old.count()} old records...")
old.delete()

# Vacuum database (optimize storage)
sqlite3 db.sqlite3 "VACUUM;"
```

---

## Backup & Recovery

### Issue: Need to Restore from Backup

**Symptoms**: Data lost or corruption detected

**Solution**:
```bash
# Stop services
sudo systemctl stop lpr-backend.service

# Backup current (corrupted) database
cp db.sqlite3 db.sqlite3.corrupted

# Restore from backup
cp /home/pi/backups/db_20240115.sqlite3 /home/pi/lpr_dashboard/backend/db.sqlite3

# Fix permissions
sudo chown pi:pi /home/pi/lpr_dashboard/backend/db.sqlite3

# Restart
sudo systemctl start lpr-backend.service

# Verify
curl -H "Authorization: Bearer $TOKEN" http://127.0.0.1:8000/api/stats/
```

---

## Getting Help

### Information to Gather Before Asking for Help

1. **Error messages** (exact text from logs)
2. **Affected endpoint** (e.g., `/api/history/`)
3. **Steps to reproduce** (sequence of actions)
4. **System info**:
   ```bash
   uname -a
   python --version
   pip list
   node --version
   npm --version
   ```
5. **Relevant logs**:
   ```bash
   journalctl -u lpr-backend.service -n 100
   tail -50 /var/log/nginx/error.log
   journalctl -u lpr-camera.service -n 50
   ```

### Where to Look for Logs

| Component | Log Location |
|-----------|--------------|
| Django | `journalctl -u lpr-backend.service` |
| Gunicorn | `/home/pi/lpr_logs/gunicorn_*.log` |
| Nginx (access) | `/var/log/nginx/access.log` |
| Nginx (error) | `/var/log/nginx/error.log` |
| Camera script | `journalctl -u lpr-camera.service` |
| System | `journalctl` |

---

## Quick Reference: Service Management

```bash
# Check status
sudo systemctl status lpr-backend.service

# Start/stop/restart
sudo systemctl start lpr-backend.service
sudo systemctl stop lpr-backend.service
sudo systemctl restart lpr-backend.service

# View logs (live)
journalctl -u lpr-backend.service -f

# View last 50 lines
journalctl -u lpr-backend.service -n 50

# View since last hour
journalctl -u lpr-backend.service --since "1 hour ago"

# Enable/disable auto-start
sudo systemctl enable lpr-backend.service
sudo systemctl disable lpr-backend.service
```

---

**Version**: 1.0 | **Last Updated**: 2024 | **For**: Django 4.2 + React 18 on Raspberry Pi 3
