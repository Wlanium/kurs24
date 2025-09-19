# 🎨 Tenant Configuration System

## 📋 Übersicht: Was der Kurs Container braucht

### 1. 🔐 Authentication & Access
```json
{
  "auth": {
    "admin_email": "admin@neue-akademie.de",
    "admin_password": "auto-generated-secure",
    "tenant_id": "neue-akademie",
    "api_key": "tenant_neue_akademie_key_xyz"
  }
}
```

### 2. 🎨 Branding & Design
```json
{
  "branding": {
    "academy_name": "Neue Akademie",
    "logo_url": "/assets/logos/neue-akademie-logo.png",
    "color_scheme": "ocean-blue",
    "custom_domain": "neue-akademie.kurs24.io",
    "favicon": "/assets/favicons/neue-akademie.ico"
  }
}
```

### 3. 📊 Features & Limits (Plan-based)
```json
{
  "features": {
    "plan": "pro",
    "max_students": "unlimited",
    "max_courses": "unlimited",
    "ai_features": true,
    "advanced_analytics": true,
    "custom_branding": true,
    "api_access": true,
    "white_label": true
  }
}
```

---

## 🎨 Bulma Theme System

### Vordefinierte Farbschemen
```scss
// themes/classic-royal.scss
$primary: #1e40af;      // Royal Blue
$secondary: #fbbf24;    // Gold
$success: #10b981;      // Green
$warning: #f59e0b;      // Amber
$danger: #ef4444;       // Red
$dark: #1f2937;         // Dark Gray
$light: #f9fafb;        // Light Gray

// themes/ocean-blue.scss
$primary: #0891b2;      // Ocean Blue
$secondary: #06b6d4;    // Cyan
$success: #059669;      // Emerald
$warning: #d97706;      // Orange
$danger: #dc2626;       // Red

// themes/forest-green.scss
$primary: #059669;      // Forest Green
$secondary: #10b981;    // Emerald
$success: #65a30d;      // Lime
$warning: #ca8a04;      // Yellow
$danger: #dc2626;       // Red

// themes/sunset-orange.scss
$primary: #ea580c;      // Orange
$secondary: #f97316;    // Orange-500
$success: #16a34a;      // Green
$warning: #eab308;      // Yellow
$danger: #dc2626;       // Red

// themes/royal-purple.scss
$primary: #7c3aed;      // Purple
$secondary: #a855f7;    // Purple-400
$success: #059669;      // Green
$warning: #d97706;      // Orange
$danger: #dc2626;       // Red
```

### CSS Custom Properties System
```css
/* Dynamic theme injection via CSS variables */
:root[data-theme="ocean-blue"] {
  --primary: #0891b2;
  --primary-light: #67e8f9;
  --primary-dark: #0e7490;
  --secondary: #06b6d4;
  --accent: #f0f9ff;
  --text: #0f172a;
  --background: #ffffff;
  --surface: #f8fafc;
  --border: #e2e8f0;
}

/* Bulma variable overrides */
.has-background-primary { background-color: var(--primary) !important; }
.has-text-primary { color: var(--primary) !important; }
.button.is-primary { background-color: var(--primary); border-color: var(--primary); }
```

---

## 🏗️ Backend API Endpoints

### 1. Tenant Configuration API
```python
# backend/api/tenant_config.py

@app.get("/api/v1/tenant/{tenant_id}/config")
async def get_tenant_config(tenant_id: str):
    """Vollständige Tenant-Konfiguration für Container"""
    return {
        "tenant_id": tenant_id,
        "auth": {
            "admin_email": tenant.admin_email,
            "admin_password_hash": tenant.password_hash,
            "api_key": f"tenant_{tenant_id}_{secrets.token_hex(16)}"
        },
        "branding": {
            "academy_name": tenant.academy_name,
            "logo_url": f"/api/v1/tenant/{tenant_id}/logo",
            "color_scheme": tenant.color_scheme,
            "custom_css": f"/api/v1/tenant/{tenant_id}/theme.css"
        },
        "features": get_plan_features(tenant.plan),
        "limits": get_plan_limits(tenant.plan),
        "integrations": {
            "paypal_webhook": f"/api/v1/tenant/{tenant_id}/webhooks/paypal",
            "analytics_endpoint": f"/api/v1/tenant/{tenant_id}/analytics"
        }
    }

@app.get("/api/v1/tenant/{tenant_id}/theme.css")
async def get_tenant_theme_css(tenant_id: str):
    """Dynamisches CSS für Tenant"""
    tenant = get_tenant(tenant_id)
    theme = THEMES[tenant.color_scheme]

    css = f"""
    :root {{
        --primary: {theme['primary']};
        --secondary: {theme['secondary']};
        --academy-name: '{tenant.academy_name}';
    }}

    .navbar-brand .navbar-item img {{
        max-height: 3rem;
    }}

    .hero.is-primary {{
        background: linear-gradient(135deg, {theme['primary']}, {theme['secondary']});
    }}
    """

    return Response(content=css, media_type="text/css")

@app.get("/api/v1/tenant/{tenant_id}/logo")
async def get_tenant_logo(tenant_id: str):
    """Logo für Tenant (oder Default Royal Academy)"""
    tenant = get_tenant(tenant_id)
    if tenant.custom_logo:
        return FileResponse(f"/uploads/logos/{tenant_id}.png")
    else:
        return FileResponse("/assets/logo-royal-academy.png")
```

### 2. Theme Management API
```python
@app.get("/api/v1/themes")
async def get_available_themes():
    """Verfügbare Farbschemen"""
    return {
        "classic-royal": {
            "name": "Classic Royal",
            "primary": "#1e40af",
            "secondary": "#fbbf24",
            "preview_image": "/themes/previews/classic-royal.png",
            "description": "Klassisch königlich mit Blau und Gold"
        },
        "ocean-blue": {
            "name": "Ocean Blue",
            "primary": "#0891b2",
            "secondary": "#06b6d4",
            "preview_image": "/themes/previews/ocean-blue.png",
            "description": "Frisches Ozean-Blau für moderne Akademien"
        },
        # ... weitere themes
    }

@app.put("/api/v1/tenant/{tenant_id}/theme")
async def update_tenant_theme(tenant_id: str, theme_data: dict):
    """Theme für Tenant ändern"""
    tenant = get_tenant(tenant_id)
    tenant.color_scheme = theme_data["color_scheme"]
    tenant.academy_name = theme_data.get("academy_name", tenant.academy_name)

    # Trigger Container Update
    await update_tenant_container(tenant_id)

    return {"status": "updated", "theme": theme_data["color_scheme"]}
```

---

## 📦 Container Integration

### Environment Injection
```bash
# Im deploy-tenant.sh Script:
cat > ${TENANT_DIR}/.env << EOF
# Tenant Configuration
TENANT_ID=${TENANT_SUBDOMAIN}
TENANT_CONFIG_URL=http://api:8000/api/v1/tenant/${TENANT_SUBDOMAIN}/config
TENANT_THEME_URL=http://api:8000/api/v1/tenant/${TENANT_SUBDOMAIN}/theme.css

# Features based on plan
ENABLE_AI_FEATURES=$([ "$TENANT_PLAN" = "pro" ] && echo "true" || echo "false")
MAX_STUDENTS=$([ "$TENANT_PLAN" = "pro" ] && echo "unlimited" || echo "50")
EOF
```

### Container Startup (Next.js)
```javascript
// pages/_app.js - Kurs Container
import { useEffect, useState } from 'react'

export default function MyApp({ Component, pageProps }) {
  const [tenantConfig, setTenantConfig] = useState(null)
  const [themeLoaded, setThemeLoaded] = useState(false)

  useEffect(() => {
    // Load tenant configuration
    fetch(process.env.TENANT_CONFIG_URL)
      .then(res => res.json())
      .then(config => {
        setTenantConfig(config)

        // Inject theme CSS
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = process.env.TENANT_THEME_URL
        document.head.appendChild(link)

        // Set academy name in title
        document.title = `${config.branding.academy_name} - K.I. Training Platform`

        setThemeLoaded(true)
      })
  }, [])

  if (!themeLoaded) {
    return <div className="loader">Loading Academy...</div>
  }

  return (
    <TenantProvider config={tenantConfig}>
      <Component {...pageProps} />
    </TenantProvider>
  )
}
```

---

## 🎯 Template Vorlagen System

### 1. Academy Templates
```json
{
  "templates": {
    "corporate-training": {
      "name": "Corporate Training",
      "description": "Für Unternehmensschulungen",
      "color_scheme": "forest-green",
      "features": ["certificates", "progress_tracking", "team_management"],
      "content_types": ["compliance", "leadership", "technical"],
      "default_courses": ["Führungskräfte Training", "Compliance Schulung"]
    },
    "creative-academy": {
      "name": "Creative Academy",
      "description": "Für kreative Kurse und Design",
      "color_scheme": "sunset-orange",
      "features": ["portfolio", "project_gallery", "peer_review"],
      "content_types": ["design", "photography", "art"],
      "default_courses": ["Photoshop Grundlagen", "UI/UX Design"]
    },
    "tech-academy": {
      "name": "Tech Academy",
      "description": "Für IT und Programmierung",
      "color_scheme": "ocean-blue",
      "features": ["code_editor", "live_coding", "github_integration"],
      "content_types": ["programming", "devops", "ai"],
      "default_courses": ["Python Basics", "Web Development"]
    }
  }
}
```

### 2. Logo Management
```python
@app.post("/api/v1/tenant/{tenant_id}/logo")
async def upload_tenant_logo(tenant_id: str, file: UploadFile):
    """Custom Logo upload"""
    # Validate image
    if not file.content_type.startswith('image/'):
        raise HTTPException(400, "Only image files allowed")

    # Resize and optimize
    logo_path = f"/uploads/logos/{tenant_id}.png"
    optimize_logo(file, logo_path, max_size=(200, 60))

    # Update tenant
    tenant = get_tenant(tenant_id)
    tenant.custom_logo = True

    return {"status": "uploaded", "logo_url": f"/api/v1/tenant/{tenant_id}/logo"}

def optimize_logo(file, output_path, max_size):
    """Logo optimieren für verschiedene Größen"""
    from PIL import Image

    img = Image.open(file.file)
    img.thumbnail(max_size, Image.LANCZOS)
    img.save(output_path, "PNG", optimize=True)

    # Generate different sizes
    sizes = [(200, 60), (100, 30), (50, 15)]  # navbar, mobile, favicon
    for width, height in sizes:
        size_img = img.copy()
        size_img.thumbnail((width, height), Image.LANCZOS)
        size_img.save(f"{output_path}_{width}x{height}.png", "PNG")
```

---

## 🔧 Configuration Interface

### Admin Dashboard (für uns)
```javascript
// Tenant Configuration Panel
function TenantConfigPanel({ tenantId }) {
  const [config, setConfig] = useState(null)
  const [themes, setThemes] = useState([])

  return (
    <div className="tenant-config">
      <h2>Tenant Configuration: {tenantId}</h2>

      {/* Theme Selection */}
      <div className="field">
        <label>Color Scheme</label>
        <div className="theme-grid">
          {themes.map(theme => (
            <div
              key={theme.id}
              className={`theme-card ${config.color_scheme === theme.id ? 'active' : ''}`}
              onClick={() => updateTheme(theme.id)}
            >
              <div className="theme-preview" style={{
                background: `linear-gradient(45deg, ${theme.primary}, ${theme.secondary})`
              }}></div>
              <span>{theme.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Academy Name */}
      <div className="field">
        <label>Academy Name</label>
        <input
          value={config.academy_name}
          onChange={(e) => updateConfig('academy_name', e.target.value)}
        />
      </div>

      {/* Logo Upload */}
      <div className="field">
        <label>Logo</label>
        <FileUpload onUpload={updateLogo} />
        {config.logo_url && <img src={config.logo_url} alt="Current logo" />}
      </div>

      {/* Feature Toggles */}
      <div className="field">
        <label>Features</label>
        <div className="feature-toggles">
          <label>
            <input
              type="checkbox"
              checked={config.features.ai_features}
              onChange={(e) => updateFeature('ai_features', e.target.checked)}
            />
            AI Features
          </label>
          {/* mehr features... */}
        </div>
      </div>

      <button onClick={saveConfig} className="button is-primary">
        Save & Deploy Changes
      </button>
    </div>
  )
}
```

---

## 🚀 Deployment Integration

### Updated deploy-tenant.sh
```bash
# Enhanced deployment with theme support
echo -e "${YELLOW}🎨 Configuring tenant theme...${NC}"

# Get theme configuration from API
THEME_CONFIG=$(curl -s "http://localhost:8000/api/v1/themes/${TENANT_COLOR}")

# Create tenant-specific CSS
curl -o "${TENANT_DIR}/public/theme.css" \
  "http://localhost:8000/api/v1/tenant/${TENANT_SUBDOMAIN}/theme.css"

# Update container with theme variables
cat >> ${TENANT_DIR}/.env << EOF
TENANT_THEME=${TENANT_COLOR}
ACADEMY_NAME="${TENANT_SUBDOMAIN//-/ }"
LOGO_URL="/api/v1/tenant/${TENANT_SUBDOMAIN}/logo"
EOF
```

Das wäre ein komplettes System für **Template-basierte Tenant Configuration**! 🎯