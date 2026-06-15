# LPR Dashboard - Architecture & API Reference

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     LPR Dashboard (Raspberry Pi 3)               │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌──────────────────┐              ┌──────────────────────────┐ │
│  │   Nginx Proxy    │─────http──────│   Django Backend + REST │ │
│  │   (Port 80)      │              │   (Port 8000, internal) │ │
│  └──────────────────┘              └──────────────────────────┘ │
│         ▲                                      ▲                 │
│         │                                      │                 │
│         └──serves────────────┐        ┌────────┼─────────────┐  │
│                              ▼        ▼        │             ▼  │
│                    ┌──────────────┐ ┌──────────────────┐          │
│  ┌──────────────┐  │   React UI   │ │  SQLite Database │  ┌────┐│
│  │   Browser    │──│   (SPA)      │ │  (db.sqlite3)    │  │FS  ││
│  │   :3000      │  │              │ │                  │  └────┘│
│  └──────────────┘  └──────────────┘ └──────────────────┘        │
│         ▲                     │             ▲                    │
│         │                     └─────auth────┘                    │
│         │                          JWT                            │
│         └─────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────────┐       ┌──────────────────┐                │
│  │  Pi Camera       │──────▶│  Python Script   │──▶ Upload       │
│  │  (optional)      │       │  (camera_pi.py)  │    to /api/     │
│  └──────────────────┘       │                  │    capture/     │
│                             └──────────────────┘                │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### UserProfile (User → Profile, one-to-one)
```python
{
    user: ForeignKey(User),
    is_admin: Boolean,           # Admin (full access)
    is_agent: Boolean,           # Agent (limited 24h + manual entry)
    assigned_gate: String,       # Optional gate restriction
    role: @property → 'admin' | 'agent'
}
```

### RecognizedPlate (License Plate Entry)
```python
{
    id: Primary Key,
    image: ImageField,           # Upload to media/uploads/
    plate_text: String,          # Detected plate
    confidence: Float,           # 0.0-1.0 confidence score
    created_at: DateTime,        # Auto-set
    exit_time: DateTime,         # Optional, for duration calc
    duration_minutes: Float,     # Auto-calculated
    entered_by: ForeignKey(User),# Manual entry user (nullable)
    
    # Bounding box (for annotation)
    box_x, box_y, box_w, box_h: Integer,
    
    # Classification
    vehicle_type: Integer,       # 1=Car, 2=Truck, etc.
    gate: String,                # 'Portail 1', 'Portail 2', etc.
    direction: String,           # 'in' | 'out'
    entry_method: String,        # 'auto' | 'manual'
    
    # Plate info (extracted from plate_text)
    wilaya: Integer,             # Wilaya (province) code
    annee: Integer,              # Year
    numero_enregistrement: Integer, # Registration number
}
```

### Camera (IP Camera Config)
```python
{
    id: Primary Key,
    name: String,                # 'Camera Portail 1'
    url: URL,                    # 'http://192.168.1.100/snapshot.jpg'
    gate_number: Integer,        # 1, 2, or 3
    is_active: Boolean,
    created_at: DateTime,
}
```

### AdminSetting (System Configuration, singleton)
```python
{
    id: Primary Key,
    confidence_threshold: Float,        # Min confidence for acceptance
    history_retention_days: Integer,    # How long to keep records
    capture_interval_seconds: Integer,  # Pi camera capture frequency
}
```

---

## REST API Endpoints

### Authentication
All endpoints require JWT token in header: `Authorization: Bearer <access_token>`

#### POST `/api/token/`
**Get JWT access token**
```json
Request: {
  "username": "admin",
  "password": "password"
}
Response: {
  "access": "eyJ0eXAi...",
  "refresh": "eyJ0eXAi..."
}
```

---

### Stats & Monitoring

#### GET `/api/stats/`
**General statistics (public for logged-in users)**
```json
Response: {
  "total_vehicles": 1234,
  "today_count": 45,
  "last_7_days": [
    {"date": "2024-01-01", "count": 180},
    {"date": "2024-01-02", "count": 195},
    ...
  ],
  "gate_counts": [
    {"gate": "Portail 1", "count": 500},
    {"gate": "Portail 2", "count": 400}
  ],
  "vehicle_types": {
    "Tourisme": 900,
    "Camion": 200,
    "Camionnette": 80,
    "Autocar": 40,
    "Autre": 14
  }
}
```

#### GET `/api/admin_stats/`
**Admin-only: Agent performance & 24h summary**
```json
Admin Only (403 if not admin)
Response: {
  "by_gate": [
    {"gate": "Portail 1", "count": 500}
  ],
  "by_agent": [
    {"entered_by__username": "agent1", "count": 50}
  ],
  "last_24h": 180
}
```

---

### History & Records

#### GET `/api/history/`
**Vehicle history with role-based filtering**
```json
Query params:
  - gate: Optional filter by gate name
  
Admin: Full history
Agent: Last 24 hours only, optionally filtered by assigned_gate

Response: [{
  "id": 1,
  "plate_text": "14212114-05",
  "confidence": 0.95,
  "created_at": "2024-01-15T10:23:45Z",
  "gate": "Portail 1",
  "direction": "in",
  "entry_method": "auto",
  "vehicle_type": 1,
  "wilaya": 16,
  "annee": 2021,
  "numero_enregistrement": 123456,
  "entered_by": null,
  "image_url": "/media/uploads/plate_12345.jpg",
  "box": {"x": 100, "y": 50, "w": 200, "h": 80},
  "exit_time": null,
  "duration_minutes": null
}]
```

#### GET `/api/history/gate/<gate_number>/`
**Admin-only: History for specific gate**
```json
Admin Only (403 if not admin)
Response: [{ ...RecognizedPlate }]
```

#### GET `/api/annotated/<record_id>/`
**Get annotated image (bounding box drawn on plate)**
```
Returns: JPEG image (Content-Type: image/jpeg)
Used by: Frontend image viewer
```

---

### Image Upload & Capture

#### POST `/api/upload/`
**Upload image and detect plate**
```json
Multipart form:
  - image: File (JPEG/PNG)

Response: {
  "id": 123,
  "plate_text": "14212114-05",
  "confidence": 0.92,
  "created_at": "2024-01-15T10:23:45Z",
  "image_url": "/media/uploads/plate_123.jpg"
}
```

#### GET `/api/capture/`
**Endpoint for Pi camera capture script to POST images**
- Pi script sends image and polls this endpoint
- Returns: Last admin settings (inference model, thresholds)

---

### Manual Entry

#### POST `/api/manual_entry/`
**Agent/Admin: Manually log a vehicle passage**
```json
Request: {
  "plate": "14212114-05",
  "gate": "Portail 1",
  "direction": "in"
}

Admin/Agent Only (403 if neither)
Response: {
  "message": "Entrée manuelle enregistrée",
  "id": 456
}
```

---

### Camera Management (Admin Only)

#### GET `/api/camera_settings/`
**List all configured cameras**
```json
Admin Only
Response: [{
  "id": 1,
  "name": "Camera Portail 1",
  "url": "http://192.168.1.100/snapshot.jpg",
  "gate_number": 1,
  "is_active": true
}]
```

#### POST `/api/camera_settings/`
**Create new camera**
```json
Admin Only
Request: {
  "name": "Camera Portail 2",
  "url": "http://192.168.1.101/snapshot.jpg",
  "gate_number": 2,
  "is_active": true
}
Response: {"id": 2}
```

#### GET `/api/camera_settings/<camera_id>/`
**Get camera details**
```json
Admin Only
Response: { ...Camera }
```

#### PATCH `/api/camera_settings/<camera_id>/`
**Update camera**
```json
Admin Only
Request: {
  "name": "Updated Name",
  "is_active": false
}
Response: {"message": "Caméra mise à jour"}
```

#### DELETE `/api/camera_settings/<camera_id>/`
**Delete camera**
```json
Admin Only
Response: {"message": "Caméra supprimée"}
```

---

### System Settings (Admin Only)

#### GET `/api/admin_settings/`
**Get system configuration**
```json
Admin Only
Response: {
  "confidence_threshold": 0.40,
  "history_retention_days": 30,
  "capture_interval_seconds": 2
}
```

#### POST `/api/admin_settings/`
**Update system settings**
```json
Admin Only
Request: {
  "confidence_threshold": 0.50,
  "history_retention_days": 60,
  "capture_interval_seconds": 3
}
Response: {"message": "Paramètres mis à jour"}
```

---

### User Profile

#### GET `/api/user/profile/`
**Get current user's profile (all authenticated users)**
```json
Response: {
  "username": "agent1",
  "is_admin": false,
  "is_agent": true,
  "assigned_gate": "Portail 1",
  "role": "agent"
}
```

---

## Role-Based Access Control

| Endpoint | Unauthenticated | Agent | Admin |
|----------|-----------------|-------|-------|
| `/token/` | ✅ | ✅ | ✅ |
| `/stats/` | ❌ | ✅ | ✅ |
| `/admin_stats/` | ❌ | ❌ | ✅ |
| `/history/` | ❌ | ✅ (24h) | ✅ (all) |
| `/manual_entry/` | ❌ | ✅ | ✅ |
| `/camera_settings/` | ❌ | ❌ | ✅ |
| `/admin_settings/` | ❌ | ❌ | ✅ |
| `/user/profile/` | ❌ | ✅ | ✅ |

---

## Frontend Components

### AuthContext (Authentication Wrapper)
```javascript
{
  user: { username, role },
  token: string,
  login(username, password),
  logout(),
  loading: boolean
}
```

### App.js (Main Router)
- Routes to `/login` if not authenticated
- Shows `DashboardAdmin` if `user.role === 'admin'`
- Shows `DashboardAgent` if `user.role === 'agent'`

### DashboardAdmin
- Stats + Admin stats KPIs
- Full history table with gate filter
- Camera CRUD panel
- Manual entry modal
- Refresh button

### DashboardAgent
- Stats (limited to today's data)
- Last 24h history with search
- Manual entry modal
- No camera/settings access

### ManualEntryForm
- Modal popup
- Plate + Gate + Direction inputs
- Calls `/api/manual_entry/`
- Callback on success

### CameraManagement
- Camera list table
- Form to add/edit/delete cameras
- Gate number selector
- API calls to `/api/camera_settings/`

---

## Error Codes & Messages

| Status | Scenario | Response |
|--------|----------|----------|
| 200 | Success | `{ "data": ... }` |
| 400 | Bad request | `{ "error": "Plaque requise" }` |
| 401 | Unauthorized (no token) | `{ "detail": "Authentication credentials not provided" }` |
| 403 | Forbidden (wrong role) | `{ "error": "Non autorisé" }` |
| 404 | Not found | `{ "error": "Caméra introuvable" }` |
| 500 | Server error | `{ "error": "..." }` |

---

## Data Flow Examples

### Example 1: Admin Login & View Stats
```
1. POST /api/token/ { username, password }
   → Returns: { access, refresh }
   
2. GET /api/stats/
   Header: Authorization: Bearer <access>
   → Returns: { total_vehicles, today_count, ... }
   
3. GET /api/admin_stats/
   Header: Authorization: Bearer <access>
   → Returns: { by_gate, by_agent, last_24h }
```

### Example 2: Agent Manual Entry
```
1. POST /api/manual_entry/
   Header: Authorization: Bearer <agent_token>
   Body: { plate: "14212114-05", gate: "Portail 1", direction: "in" }
   → Returns: { message, id: 123 }
   
2. GET /api/history/
   Header: Authorization: Bearer <agent_token>
   → Returns: Last 24h records (entry_method: "manual" for this one)
```

### Example 3: Pi Camera Auto-Capture
```
1. Pi camera_pi.py reads from /dev/video0 (camera)
2. Detects plate using local YOLO model
3. POST /api/upload/ with image + detected plate
   → Django stores in media/uploads/, returns record ID
4. GET /api/capture/ to check settings (confidence_threshold, etc.)
```

---

## Performance Tips for Pi 3

- **Plate Detection**: Disable YOLO inference on Pi 3; pre-detect on a more powerful machine and upload via `/api/upload/`
- **Database**: SQLite works fine for < 10k records/day; migrate to PostgreSQL for larger scale
- **Frontend**: Minified React build is ~100KB gzip; lazy-load pages if needed
- **Media Storage**: Store uploads on external USB drive if microSD fills up

---

## Deployment Checklist

- [ ] Backend: `DEBUG = False`, strong `SECRET_KEY`
- [ ] Frontend: Rebuild with production `REACT_APP_API_BASE`
- [ ] Database: Run migrations, create superuser
- [ ] Services: Install gunicorn, configure systemd files
- [ ] Nginx: Configure reverse proxy + SSL
- [ ] Backups: Setup automated DB backup script
- [ ] Monitoring: Enable journalctl log rotation
- [ ] Security: Enable firewall, configure CORS for frontend origin
- [ ] Testing: Verify all API endpoints with curl or Postman

---

**Version**: 1.0 | **Last Updated**: 2024 | **Platform**: Django 4.2 + React 18
