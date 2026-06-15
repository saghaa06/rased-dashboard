# Quick Start - Local Development

This guide gets the LPR Dashboard running on your dev machine for testing.

## Prerequisites

- Python 3.8+ (with venv)
- Node.js 16+ (npm)
- SQLite3 (included with Python)

---

## Backend Setup (Windows/Mac/Linux)

### 1. Create Virtual Environment
```bash
cd lpr_dashboard/backend
python -m venv venv

# Activate:
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate
```

### 2. Install Dependencies
```bash
pip install --upgrade pip
pip install django==4.2.0 djangorestframework==3.14.0 djangorestframework-simplejwt==5.2.2
pip install django-cors-headers==3.14.0 pillow==10.0.0 opencv-python==4.8.0.74 numpy==1.24.3
```

### 3. Database Setup
```bash
cd lpr_dashboard/backend
python manage.py migrate
python manage.py createsuperuser
# Follow prompts (e.g., username: admin, password: admin123)
```

### 4. Run Django Server
```bash
cd lpr_dashboard/backend
python manage.py runserver 0.0.0.0:8000
# Should see: Starting development server at http://127.0.0.1:8000/
```

Leave this terminal running.

---

## Frontend Setup (New Terminal)

### 1. Install Dependencies
```bash
cd lpr_dashboard/frontend
npm install
# Takes 2-5 minutes
```

### 2. Set API Endpoint
```bash
# Windows (PowerShell):
$env:REACT_APP_API_BASE = 'http://127.0.0.1:8000/api'

# Mac/Linux:
export REACT_APP_API_BASE='http://127.0.0.1:8000/api'
```

### 3. Run React Dev Server
```bash
cd lpr_dashboard/frontend
npm start
# Should open http://localhost:3000 in browser
```

---

## Login & Test

1. **Open browser**: http://localhost:3000
2. **Login page**: Use superuser credentials from step 3 (e.g., admin / admin123)
3. **Dashboard**: Should see Admin dashboard with stats, history, camera management

### Create Test Agent Account
```bash
# In a 3rd terminal, activate backend venv:
source lpr_dashboard/backend/venv/bin/activate
cd lpr_dashboard/backend

# Open Django shell:
python manage.py shell

# Create agent:
from django.contrib.auth.models import User
from recognition.models import UserProfile

agent = User.objects.create_user(username='agent1', password='agent123')
profile = UserProfile.objects.get(user=agent)
profile.is_admin = False
profile.is_agent = True
profile.assigned_gate = 'Portail 1'
profile.save()

# Logout and login as agent1 to see agent dashboard
```

---

## Common Commands

### Backend
```bash
# Activate venv (always do this first)
source lpr_dashboard/backend/venv/bin/activate

# Run server
python manage.py runserver

# Django shell (query database)
python manage.py shell

# Create new migration (after model changes)
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create admin user
python manage.py createsuperuser

# Clear all data
python manage.py flush
```

### Frontend
```bash
cd lpr_dashboard/frontend

# Install dependencies
npm install

# Start dev server (opens browser)
npm start

# Build for production
npm run build

# Run tests
npm test
```

---

## Testing API Endpoints

Use curl or Postman to test:

### Get Token
```bash
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Response:
# {"access":"eyJ0eXAi...","refresh":"eyJ0eXAi..."}
```

### Use Token
```bash
TOKEN="eyJ0eXAi..."

# Get user profile
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/user/profile/

# Get stats
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/stats/

# Get history
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/history/
```

---

## Troubleshooting

### Port Already in Use
```bash
# Port 8000 (Django)
lsof -i :8000     # Find process
kill -9 <PID>     # Kill process

# Port 3000 (React)
lsof -i :3000
```

### CORS Errors
- Django backend has `CORS_ALLOWED_ORIGINS` set for `localhost:3000`
- If error persists, check `backend/settings.py` CORS config

### Database Errors
```bash
# Reset database (WARNING: Clears all data)
rm lpr_dashboard/backend/db.sqlite3
cd lpr_dashboard/backend
python manage.py migrate
python manage.py createsuperuser
```

### Module Not Found
```bash
# Backend
pip list  # Check installed packages
pip install <missing-package>

# Frontend
npm list  # Check installed packages
npm install  # Reinstall all
```

### React Not Updating Changes
```bash
# Clear node_modules and reinstall
cd lpr_dashboard/frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

---

## File Structure Overview

```
lpr_dashboard/
├── backend/                    # Django API server
│   ├── manage.py
│   ├── db.sqlite3             # Database (auto-created)
│   ├── media/uploads/         # Image uploads
│   ├── static/                # React build (production)
│   ├── backend/
│   │   ├── settings.py        # Django config
│   │   ├── urls.py            # API routes
│   │   └── wsgi.py
│   └── recognition/
│       ├── models.py          # 5 database models
│       ├── views.py           # 18+ API endpoints
│       ├── urls.py            # API paths
│       ├── admin.py           # Django admin
│       └── inference.py       # YOLO/OCR (placeholder)
│
├── frontend/                   # React app
│   ├── package.json
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js             # Main router
│   │   ├── AuthContext.js     # Auth + JWT
│   │   ├── index.js           # Entry point
│   │   └── components/
│   │       ├── Login.js
│   │       ├── DashboardAdmin.js
│   │       ├── DashboardAgent.js
│   │       ├── ManualEntryForm.js
│   │       └── CameraManagement.js
│   └── build/                 # Production build (npm run build)
│
├── camera_pi.py               # Pi camera capture script
├── RPI3_DEPLOYMENT.md         # Deployment guide
├── API_ARCHITECTURE.md        # API reference
└── QUICKSTART.md             # This file
```

---

## Next Steps

1. **Explore the code**: Read through `backend/recognition/models.py` and `views.py`
2. **Add test data**: Use manual entry form or API to add plates
3. **Export data**: Add export to Excel feature
4. **Deploy to Pi**: Follow `RPI3_DEPLOYMENT.md` when ready

---

## Support

**Issue**: API returns 401 Unauthorized
- Solution: Make sure token is in header: `Authorization: Bearer <token>`

**Issue**: React shows blank page
- Solution: Check browser console (F12) for errors; check that backend is running

**Issue**: Database locked errors
- Solution: Only one Django server should run at a time; kill any stray processes

---

**Ready to deploy to Raspberry Pi?** Follow [RPI3_DEPLOYMENT.md](./RPI3_DEPLOYMENT.md)

**Need API documentation?** See [API_ARCHITECTURE.md](./API_ARCHITECTURE.md)
