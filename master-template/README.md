# IHK Privatrecht - Kurs Management System

## Übersicht
Vollständiges Kurs-Management-System mit Admin-Panel, Benutzerverwaltung und modernem UI-Design. Entwickelt als Basis für das KI-gestützte Kurserstellungs-System (kurs24.io).

## Features
- 🎓 **Rollen-basierte Authentifizierung** (Teilnehmer/Dozenten/Admin)
- 👥 **Benutzerverwaltung** mit manueller Freigabe
- 🎨 **Einheitliches Design-System** mit modernen UI-Komponenten
- 📱 **Responsive Design** für alle Geräte
- 🔐 **Sichere Authentifizierung** mit Session-Management
- ⚡ **Flash-Message System** für Benutzer-Feedback

## Technologie Stack
- **Backend:** Python Flask
- **Database:** SQLite
- **Frontend:** HTML5, CSS3, JavaScript
- **Styling:** Custom CSS-Framework mit Design Tokens
- **Icons:** Font Awesome 6
- **Container:** Docker + Docker Compose

## Schnellstart

### 1. Container starten
```bash
docker compose up -d --build
```

### 2. Admin-Login
- **URL:** http://localhost:8080
- **Username:** admin
- **Passwort:** Admin2024!Secure

### 3. Erste Schritte
1. Als Admin einloggen
2. Zu "Benutzerverwaltung" navigieren
3. Neue Benutzer freigeben oder Dozenten hinzufügen

## Projekt-Struktur

```
ihk-privatrecht/
├── app/
│   ├── __init__.py           # Flask App Setup & DB Init
│   ├── routes.py             # Main Routes (Login, Teilnehmer, Dozent)
│   ├── admin_routes.py       # Admin-Panel Routen
│   └── email_service.py      # E-Mail Verifizierung
├── templates/
│   ├── base.html            # Base Template mit Navigation
│   ├── login.html           # Login/Register Interface
│   ├── teilnehmer.html      # Teilnehmer Dashboard
│   ├── dozent_new.html      # Dozenten Dashboard
│   └── admin_users_new.html # Admin-Panel
├── static/css/
│   └── app.css              # Einheitliches CSS-Framework
├── data/
│   └── begriffe.db          # SQLite Database
├── docker-compose.yml       # Container-Konfiguration
└── README.md               # Diese Datei
```

## Datenbank-Schema

### Users Table
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    contact_type TEXT DEFAULT 'email',
    is_verified BOOLEAN DEFAULT 0,      -- E-Mail/SMS verifiziert
    verification_code TEXT,
    verification_expires DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_login DATETIME,
    is_active BOOLEAN DEFAULT 1,        -- Account aktiv/deaktiviert
    is_admin BOOLEAN DEFAULT 0,         -- Admin/Dozenten-Rechte
    is_approved BOOLEAN DEFAULT 0       -- Manuelle Freigabe durch Dozent
);
```

### Begriffe Table (Lerninhalte)
Enthält 200+ Privatrecht-Begriffe mit Kategorien, Schwierigkeitsgraden und mehrsprachiger Unterstützung.

## Benutzer-Rollen

### 1. **Teilnehmer**
- Müssen sich registrieren und E-Mail/SMS verifizieren
- Benötigen Freigabe durch Dozenten (`is_approved = 1`)
- Zugriff auf Lernmaterial und Quizzes
- **Route:** `/teilnehmer`

### 2. **Dozenten** 
- Haben Admin-Rechte (`is_admin = 1`)
- Können Benutzer freigeben/verwalten
- Zugriff auf Dozenten-Dashboard und Benutzerverwaltung
- **Routes:** `/dozent`, `/admin/users`

### 3. **Administratoren**
- Vollzugriff auf alle Funktionen
- Können andere zu Dozenten machen
- Benutzerverwaltung mit Bulk-Aktionen

## API-Endpoints

### Authentication
- `GET/POST /login` - Login/Logout
- `POST /register` - Registrierung
- `POST /verify` - E-Mail/SMS Verifizierung
- `GET /logout` - Abmelden

### Main Routes
- `GET /` - Redirect zu Login
- `GET /teilnehmer` - Teilnehmer Dashboard
- `GET /dozent` - Dozenten Dashboard (Admin required)

### Admin Panel
- `GET /admin/users` - Benutzerverwaltung
- `POST /admin/users/<id>/approve` - Benutzer freigeben
- `POST /admin/users/<id>/reject` - Freigabe entziehen
- `POST /admin/users/<id>/toggle-admin` - Admin-Rechte umschalten
- `POST /admin/users/<id>/toggle-active` - Account aktivieren/deaktivieren
- `POST /admin/make-dozent/<username>` - Als Dozent einrichten

## CSS-Framework

Das System verwendet ein einheitliches CSS-Framework mit:

### Design Tokens
```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #10b981;
    --success-color: #10b981;
    --warning-color: #f59e0b;
    --error-color: #ef4444;
    /* ... weitere Variablen */
}
```

### Komponenten
- **Buttons:** `.btn`, `.btn-primary`, `.btn-secondary`, etc.
- **Cards:** `.card`, `.card-header`, `.card-body`
- **Tables:** `.table` mit Hover-Effekten
- **Alerts:** `.alert`, `.alert-success`, `.alert-error`
- **Forms:** `.form-group`, `.form-label`, `.form-input`

## Development Notes

### Aktuelle Implementation
- Vollständig refactored von Legacy-UI zu modernem Design-System
- Einheitliche Navigation mit rollen-basiertem Menü
- Flash-Message System für Benutzer-Feedback
- Responsive Design für Mobile/Desktop

### Basis für KI-System
Dieses System dient als **Template** für das automatisierte Kurserstellungs-System:

1. **Template-Engine:** Base.html + Component-System
2. **User-Management:** Fertige Admin-Funktionen
3. **Responsive Design:** Mobile-first Approach
4. **Database-Schema:** Erweiterbar für verschiedene Kurstypen

### Next Steps für KI-Integration
1. **Template-Generierung:** Automatische Kursinhalte basierend auf Themen
2. **Multi-Tenant:** Subdomain-System für verschiedene Dozenten
3. **API-Integration:** REST-APIs für externe KI-Services
4. **Content-Management:** Dynamische Begriffe/Quiz-Generierung

## Environment Variables

```env
# Database
DATABASE_PATH=/app/data/begriffe.db

# Admin Account (auto-created on startup)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=Admin2024!Secure

# Mail Configuration (optional)
MAIL_SERVER=mail.t173.de
MAIL_PORT=465
MAIL_USE_SSL=True
MAIL_USERNAME=ihk-kurs@opd.agency
MAIL_PASSWORD=***
```

## Deployment

### Docker Compose
```yaml
version: '3'
services:
  ihk-privatrecht:
    build: .
    container_name: ihk-privatrecht
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - ./data:/app/data
    environment:
      - FLASK_ENV=production
      - DATABASE_PATH=/app/data/begriffe.db
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=Admin2024!Secure
```

### Für neuen Server
1. Docker Image importieren: `docker load -i ihk-privatrecht.tar`
2. App-Struktur entpacken: `tar -xzf ihk-privatrecht-app.tar.gz`
3. Container starten: `docker compose up -d`
4. Admin-Account ist automatisch verfügbar

## Security Features

- **Password Hashing:** Werkzeug PBKDF2
- **Session Management:** Flask-Sessions mit Secure Cookies
- **CSRF Protection:** Implicit durch POST-only sensitive actions
- **Input Validation:** Username/Password Längen-Checks
- **Authorization:** Rollen-basierte Route-Protection

## Troubleshooting

### Häufige Probleme
1. **500 Error:** Check Docker logs: `docker logs ihk-privatrecht`
2. **Login funktioniert nicht:** Admin-User wurde automatisch erstellt
3. **Database Errors:** Volume-Mount prüfen: `./data:/app/data`
4. **Template nicht gefunden:** Alle Templates sind in `app/templates/`

### Debug-Modus
```bash
# Lokale Entwicklung
export FLASK_ENV=development
python run.py
```

## License
Entwickelt für das kurs24.io Projekt - Private Use

---
**Erstellt:** September 2025  
**Basis für:** KI-gestütztes Kurserstellungs-System  
**Status:** Production Ready - Basis für Erweiterungen