# LPR Dashboard - License Plate Recognition System

> Full-stack Django + React license plate recognition dashboard with role-based access, camera management, and Raspberry Pi deployment.

## 🎯 Features

- **License Plate Recognition**: Automatic detection & OCR (YOLO + CRNN)
- **Role-Based Access Control**: Admin (full) vs Agent (24h limited, optional gate filter)
- **Camera Management**: Add/edit/delete IP cameras (admin only)
- **Manual Entry**: Both admins and agents can manually log vehicles
- **Dashboard Analytics**: Stats, history tables, vehicle type breakdown
- **Raspberry Pi 3 Support**: Lightweight Django + React, SQLite database
- **System Settings**: Confidence threshold, history retention, capture interval
- **JWT Authentication**: Secure token-based API authentication
- **Pi Camera Integration**: Optional auto-capture script with inference

## 📋 Quick Links

- 🚀 **Get Started**: [QUICKSTART.md](./QUICKSTART.md) - Run locally in 5 minutes
- 🐍 **Deploy to Pi**: [RPI3_DEPLOYMENT.md](./RPI3_DEPLOYMENT.md) - Production deployment guide
- 📚 **API Reference**: [API_ARCHITECTURE.md](./API_ARCHITECTURE.md) - All endpoints & database schema
- 🏗️ **Architecture**: System diagram, auth flow, role matrix

## 📁 Project Structure

```
lpr_dashboard/
├── backend/                    # Django REST API
│   ├── recognition/            # Main app (models, views, urls)
│   ├── manage.py
│   ├── db.sqlite3             # SQLite database
│   ├── media/uploads/         # Uploaded images
│   └── requirements.txt        # Python dependencies
│
├── frontend/                   # React SPA (Create React App)
│   ├── src/
│   │   ├── App.js             # Main router & role-based routing
│   │   ├── AuthContext.js     # JWT auth context
│   │   └── components/        # Dashboard & form components
│   ├── package.json
│   └── public/
│
├── camera_pi.py               # Raspberry Pi camera capture script
├── QUICKSTART.md              # Local development guide
├── RPI3_DEPLOYMENT.md         # Production Pi 3 deployment (10 sections)
└── API_ARCHITECTURE.md        # Complete API & database reference
```

## 🔐 Architecture Overview

```
┌─────────────────────────────────────────┐
│         Raspberry Pi 3 (Production)      │
├─────────────────────────────────────────┤
│  Browser → Nginx (80) ↓                 │
│            ├─→ Django (8000) + SQLite   │
│            ├─→ /api/* endpoints         │
│            └─→ React UI (static)        │
│                                         │
│  Camera Pi → camera_pi.py →             │
│              /api/upload/ (JPEG + OCR)  │
└─────────────────────────────────────────┘

Authentication: JWT (SimpleJWT)
Authorization: UserProfile.role (admin | agent)
Database: SQLite3
Models: User, UserProfile, RecognizedPlate, Camera, AdminSetting
```

## 🚀 Getting Started

### Local Development (5 minutes)

#### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate (Windows)
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # username: admin, password: admin123
python manage.py runserver
```

#### Frontend (new terminal)
```bash
cd frontend
npm install
export REACT_APP_API_BASE='http://127.0.0.1:8000/api'
npm start
```

Open http://localhost:3000 → Login with admin credentials

**Full guide**: [QUICKSTART.md](./QUICKSTART.md)

### Production (Raspberry Pi 3)

Follow the complete deployment guide: [RPI3_DEPLOYMENT.md](./RPI3_DEPLOYMENT.md)

Key steps:
1. Flash Pi OS to microSD
2. Install Python, Node.js, system deps
3. Setup backend venv + Django migrations
4. Build React frontend
5. Configure Nginx reverse proxy
6. Setup systemd services (Django + camera capture)
7. Configure SSL (optional but recommended)

**Est. time**: 45 minutes

## 🔑 API Highlights

### Authentication
```bash
POST /api/token/
Request: { username, password }
Response: { access, refresh }
```

### Key Endpoints
- `GET /api/stats/` - General vehicle stats
- `GET /api/admin_stats/` - Admin: agent performance, 24h summary
- `GET /api/history/` - Vehicle history (role-filtered)
- `POST /api/manual_entry/` - Agent/Admin: log vehicle manually
- `GET/POST/PATCH/DELETE /api/camera_settings/` - Admin: manage cameras
- `GET/POST /api/admin_settings/` - Admin: system config
- `GET /api/user/profile/` - Current user profile

**Full API Reference**: [API_ARCHITECTURE.md](./API_ARCHITECTURE.md)

## 🛡️ Role-Based Access

| Feature | Admin | Agent |
|---------|-------|-------|
| View full history | ✅ | ❌ (24h only) |
| View all gates | ✅ | ❌ (assigned only) |
| Manual entry | ✅ | ✅ |
| Manage cameras | ✅ | ❌ |
| System settings | ✅ | ❌ |
| Agent stats | ✅ | ❌ |

## 📊 Dashboard

### Admin Dashboard
- **KPIs**: Total vehicles, today's entries, active gates, 24h count
- **History Table**: Filterable by gate, full records
- **Camera Management**: CRUD for IP cameras
- **System Settings**: Confidence threshold, retention, capture interval

### Agent Dashboard
- **KPIs**: Vehicles today, last 24h count
- **History**: Last 24h records, searchable by plate/gate
- **Manual Entry**: Log vehicle passages
- **No Access**: Camera management, system settings, full history

## 🎥 Pi Camera Support (Optional)

The `camera_pi.py` script captures images from Pi camera and uploads to backend:

```bash
# Setup
python camera_pi.py
# Reads from /dev/video0 (Pi camera)
# Detects plate using YOLO
# Uploads to /api/upload/
# Repeats every 2 seconds (configurable)
```

Configure via **Admin Settings** → `capture_interval_seconds`

## 🔧 Tech Stack

### Backend
- **Framework**: Django 4.2 + Django REST Framework
- **Authentication**: SimpleJWT (JWT tokens)
- **Database**: SQLite3 (optimized for Pi)
- **Image Processing**: OpenCV, NumPy, Pillow
- **Inference**: YOLOv8 (optional, can run separately)
- **Server**: Gunicorn + Nginx (production)
- **CORS**: django-cors-headers
- **Static Files**: Whitenoise

### Frontend
- **Framework**: React 18 (Create React App)
- **HTTP Client**: Axios
- **Routing**: React Router v6
- **Styling**: CSS modules
- **Charts**: Recharts (optional)
- **Date Handling**: date-fns

### DevOps
- **OS**: Raspberry Pi OS (Bullseye 32-bit)
- **Python**: 3.8+
- **Node.js**: 16+
- **Service Manager**: systemd
- **Web Server**: Nginx
- **SSL**: Certbot + Let's Encrypt (optional)

## 📊 Database Schema

### RecognizedPlate
```python
id, plate_text, confidence, created_at, exit_time, duration_minutes,
image, box_x, box_y, box_w, box_h, vehicle_type, gate, direction,
entry_method, entered_by (User FK), wilaya, annee, numero_enregistrement
```

### UserProfile (one-to-one with User)
```python
user, is_admin, is_agent, assigned_gate, role (property)
```

### Camera
```python
id, name, url, gate_number, is_active, created_at
```

### AdminSetting (singleton)
```python
confidence_threshold, history_retention_days, capture_interval_seconds
```

## ⚙️ Configuration

### Environment Variables (Frontend)
```bash
REACT_APP_API_BASE=http://127.0.0.1:8000/api
```

### Django Settings (Backend)
- `DEBUG`: Set to `False` in production
- `SECRET_KEY`: Use strong random key
- `ALLOWED_HOSTS`: Configure for your Pi's IP/domain
- `CORS_ALLOWED_ORIGINS`: Allow frontend origin
- `DATABASES`: SQLite (default, no changes needed)

**See**: [RPI3_DEPLOYMENT.md](./RPI3_DEPLOYMENT.md) section 2.5

## 🧪 Testing

### API Testing (curl/Postman)
```bash
# Get token
curl -X POST http://127.0.0.1:8000/api/token/ \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Use token
TOKEN="eyJ0eXAi..."
curl -H "Authorization: Bearer $TOKEN" \
  http://127.0.0.1:8000/api/stats/
```

### Frontend Testing
```bash
cd frontend
npm test       # Run Jest tests
npm run build  # Production build
```

## 📈 Performance Notes

### Pi 3 (1GB RAM)
- Django + Gunicorn: ~300MB idle, ~600MB under load
- React SPA: ~100KB gzipped
- SQLite: Fast for < 10k records/day
- YOLO inference: Slow (5-10 sec/image); recommend separate GPU machine

### Optimization Tips
- Disable YOLO on Pi 3; run separately
- Migrate to PostgreSQL for production
- Enable gzip compression (Whitenoise handles this)
- Implement image caching
- Use CDN for static files if scale required

## 🐛 Troubleshooting

### Django Won't Start
```bash
# Check for port conflicts
lsof -i :8000

# Reset database
rm db.sqlite3
python manage.py migrate
```

### React UI Blank
- Check browser console (F12) for errors
- Verify backend is running: `curl http://127.0.0.1:8000/api/stats/`
- Check `REACT_APP_API_BASE` env var

### Nginx 502 Bad Gateway
- Verify gunicorn is running: `systemctl status lpr-backend.service`
- Check gunicorn logs: `journalctl -u lpr-backend.service -f`
- Verify port 8000 is listening: `lsof -i :8000`

## 📝 License

[Specify your license - MIT, Apache, GPL, etc.]

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

- **Issues**: Create GitHub issue with reproduction steps
- **Documentation**: Check [API_ARCHITECTURE.md](./API_ARCHITECTURE.md) first
- **Deployment Help**: See [RPI3_DEPLOYMENT.md](./RPI3_DEPLOYMENT.md)

## 🗓️ Roadmap

- [ ] PostgreSQL support for multi-instance deployment
- [ ] YOLO inference on separate GPU machine
- [ ] Email/SMS alerts for specific plates
- [ ] Multi-Pi mesh network architecture
- [ ] Mobile app (React Native)
- [ ] Cloud sync (AWS S3 backups)
- [ ] Advanced analytics (heatmaps, traffic patterns)

## 📄 Documentation

| File | Purpose |
|------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | Local development (5 min setup) |
| [RPI3_DEPLOYMENT.md](./RPI3_DEPLOYMENT.md) | Production deployment for Raspberry Pi 3 |
| [API_ARCHITECTURE.md](./API_ARCHITECTURE.md) | Complete API reference + database schema |
| [README.md](./README.md) | This file (project overview) |

## 🎓 Learning Resources

- Django REST Framework: https://www.django-rest-framework.org/
- React Hooks: https://react.dev/reference/react
- Raspberry Pi Setup: https://www.raspberrypi.com/documentation/
- JWT Auth: https://django-rest-framework-simplejwt.readthedocs.io/

---

**Version**: 1.0  
**Last Updated**: 2024  
**Status**: Production Ready for Pi 3  
**Maintainer**: [Your Name/Team]

Made with ❤️ for vehicle recognition and management
"# lpr_dashboard" 
