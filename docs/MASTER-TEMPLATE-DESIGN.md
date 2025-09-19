# 🏗️ Master Template Design - Perfekte Vorlage

## 🎯 Vision: Der perfekte Kurs Container

### Template-Architektur
```
/master-template/
├── 📄 docker-compose.yml           # Container Definition
├── 📄 Dockerfile                   # App Build
├── 📄 .env.template                # Environment Variablen
├── 📁 app/                         # Next.js Application
│   ├── 📁 pages/
│   │   ├── 📄 _app.js              # Theme Injection
│   │   ├── 📄 index.js             # Dashboard
│   │   ├── 📁 courses/             # Kurs Management
│   │   ├── 📁 students/            # Student Management
│   │   └── 📁 settings/            # Academy Settings
│   ├── 📁 components/
│   │   ├── 📁 layout/              # Layout Components
│   │   ├── 📁 course/              # Kurs Components
│   │   └── 📁 branding/            # Theme Components
│   ├── 📁 styles/
│   │   ├── 📄 globals.css          # Base Styles
│   │   └── 📄 themes.css           # Theme Overrides
│   └── 📁 lib/
│       ├── 📄 api.js               # Backend Integration
│       └── 📄 config.js            # Config Loader
├── 📁 public/
│   ├── 📄 default-logo.png         # Fallback Logo
│   └── 📁 assets/                  # Static Assets
└── 📄 package.json                 # Dependencies
```

---

## 🎨 Theme System Integration

### 1. Dynamic Theme Loading
```javascript
// pages/_app.js - Template Startup
import { useEffect, useState } from 'react'
import { ConfigProvider } from '../contexts/ConfigContext'

export default function MyApp({ Component, pageProps }) {
  const [config, setConfig] = useState(null)
  const [themeLoaded, setThemeLoaded] = useState(false)

  useEffect(() => {
    // Load tenant configuration from backend API
    fetch(process.env.NEXT_PUBLIC_CONFIG_URL || '/api/config')
      .then(res => res.json())
      .then(tenantConfig => {
        setConfig(tenantConfig)

        // Inject dynamic theme CSS
        const themeLink = document.createElement('link')
        themeLink.rel = 'stylesheet'
        themeLink.href = tenantConfig.branding.custom_css
        themeLink.id = 'tenant-theme'
        document.head.appendChild(themeLink)

        // Set academy name and meta
        document.title = `${tenantConfig.branding.academy_name} - K.I. Training Platform`

        // Set favicon if custom
        if (tenantConfig.branding.favicon) {
          const favicon = document.querySelector("link[rel*='icon']") || document.createElement('link')
          favicon.rel = 'icon'
          favicon.href = tenantConfig.branding.favicon
          document.head.appendChild(favicon)
        }

        setThemeLoaded(true)
      })
      .catch(err => {
        console.warn('Config loading failed, using defaults:', err)
        setThemeLoaded(true)
      })
  }, [])

  if (!themeLoaded) {
    return (
      <div className="loading-splash">
        <div className="spinner"></div>
        <p>Academy wird geladen...</p>
      </div>
    )
  }

  return (
    <ConfigProvider config={config}>
      <Component {...pageProps} />
    </ConfigProvider>
  )
}
```

### 2. Responsive Layout System
```javascript
// components/layout/AcademyLayout.js
import { useConfig } from '../../contexts/ConfigContext'
import Navigation from './Navigation'
import Footer from './Footer'

export default function AcademyLayout({ children }) {
  const { config } = useConfig()

  return (
    <div className="academy-container">
      {/* Dynamic Navigation */}
      <Navigation
        academyName={config?.branding?.academy_name}
        logoUrl={config?.branding?.logo_url}
        colorScheme={config?.branding?.color_scheme}
      />

      {/* Main Content */}
      <main className="academy-main">
        {children}
      </main>

      {/* Footer with Plan Info */}
      <Footer
        plan={config?.plan}
        features={config?.features}
      />
    </div>
  )
}
```

---

## 🧩 Feature Components

### 1. Plan-basierte Feature Gates
```javascript
// components/FeatureGate.js
import { useConfig } from '../contexts/ConfigContext'

export default function FeatureGate({ feature, children, fallback = null }) {
  const { config } = useConfig()

  const hasFeature = config?.features?.[feature]

  if (!hasFeature) {
    return fallback || (
      <div className="feature-locked">
        <div className="lock-icon">🔒</div>
        <p>Diese Funktion ist in Ihrem Plan nicht verfügbar.</p>
        <button className="button is-primary">
          Auf Pro Plan upgraden
        </button>
      </div>
    )
  }

  return children
}

// Usage Example:
<FeatureGate feature="ai_features">
  <AICourseTool />
</FeatureGate>
```

### 2. Adaptive Dashboard
```javascript
// pages/index.js - Academy Dashboard
import AcademyLayout from '../components/layout/AcademyLayout'
import FeatureGate from '../components/FeatureGate'
import { useConfig } from '../contexts/ConfigContext'

export default function Dashboard() {
  const { config } = useConfig()

  return (
    <AcademyLayout>
      <div className="dashboard">
        {/* Hero Section mit Academy Branding */}
        <section className="hero is-primary is-medium">
          <div className="hero-body">
            <div className="container">
              <h1 className="title is-1">
                Willkommen in der {config?.branding?.academy_name}
              </h1>
              <h2 className="subtitle">
                K.I.-gestützte Bildungsplattform der Zukunft
              </h2>
            </div>
          </div>
        </section>

        {/* Dashboard Grid */}
        <section className="section">
          <div className="container">
            <div className="columns is-multiline">

              {/* Kurse */}
              <div className="column is-6">
                <div className="card">
                  <header className="card-header">
                    <p className="card-header-title">Meine Kurse</p>
                  </header>
                  <div className="card-content">
                    <CoursesList limit={config?.features?.max_courses} />
                  </div>
                </div>
              </div>

              {/* Studenten */}
              <div className="column is-6">
                <div className="card">
                  <header className="card-header">
                    <p className="card-header-title">Studenten</p>
                  </header>
                  <div className="card-content">
                    <StudentsList limit={config?.features?.max_students} />
                  </div>
                </div>
              </div>

              {/* AI Tools (Pro only) */}
              <FeatureGate feature="ai_features">
                <div className="column is-12">
                  <div className="card">
                    <header className="card-header">
                      <p className="card-header-title">🤖 K.I. Kurs-Assistent</p>
                      <span className="tag is-primary">PRO</span>
                    </header>
                    <div className="card-content">
                      <AICourseTool />
                    </div>
                  </div>
                </div>
              </FeatureGate>

              {/* Analytics (Pro only) */}
              <FeatureGate feature="advanced_analytics">
                <div className="column is-12">
                  <div className="card">
                    <header className="card-header">
                      <p className="card-header-title">📊 Erweiterte Analytics</p>
                      <span className="tag is-primary">PRO</span>
                    </header>
                    <div className="card-content">
                      <AdvancedAnalytics />
                    </div>
                  </div>
                </div>
              </FeatureGate>

            </div>
          </div>
        </section>
      </div>
    </AcademyLayout>
  )
}
```

---

## 🎨 Styling System

### 1. CSS Custom Properties Integration
```css
/* styles/globals.css */
@import url('https://cdn.jsdelivr.net/npm/bulma@0.9.4/css/bulma.min.css');

/* Theme injection point - wird von API überschrieben */
:root {
  --primary: #1e40af;
  --secondary: #fbbf24;
  --academy-name: 'Academy';
}

/* Bulma customizations */
.hero.is-primary {
  background: linear-gradient(135deg, var(--primary), var(--secondary));
}

.button.is-primary {
  background-color: var(--primary);
  border-color: var(--primary);
}

.navbar.is-primary {
  background-color: var(--primary);
}

.card-header {
  background-color: var(--primary)10;
  border-bottom: 1px solid var(--primary);
}

/* Loading states */
.loading-splash {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: linear-gradient(135deg, var(--primary), var(--secondary));
  color: white;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255,255,255,0.3);
  border-top: 4px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Academy branding */
.academy-logo {
  max-height: 3rem;
  transition: all 0.3s ease;
}

.academy-name::before {
  content: var(--academy-name);
}

/* Responsive design */
@media (max-width: 768px) {
  .hero.is-medium .hero-body {
    padding: 3rem 1.5rem;
  }

  .academy-logo {
    max-height: 2rem;
  }
}

/* Feature gates */
.feature-locked {
  text-align: center;
  padding: 3rem;
  background: #f8fafc;
  border-radius: 8px;
  border: 2px dashed #e2e8f0;
}

.lock-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.5;
}
```

### 2. Component-spezifisches Styling
```css
/* styles/components.css */

/* Navigation anpassungen */
.navbar-brand .navbar-item img {
  max-height: 3rem;
  transition: all 0.3s ease;
}

.navbar-item.has-dropdown:hover .navbar-dropdown {
  display: block;
}

/* Card improvements */
.card {
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
  transition: all 0.3s ease;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  transform: translateY(-2px);
}

/* Progress indicators */
.progress.is-primary::-webkit-progress-value {
  background-color: var(--primary);
}

.progress.is-primary::-moz-progress-bar {
  background-color: var(--primary);
}

/* Tables */
.table.is-striped tbody tr:nth-child(odd) {
  background-color: var(--primary)05;
}

/* Buttons */
.button.is-primary:hover {
  background-color: var(--primary)dd;
  border-color: var(--primary)dd;
}

/* Tags */
.tag.is-primary {
  background-color: var(--primary);
  color: white;
}

/* Modal overlays */
.modal-background {
  background-color: rgba(0,0,0,0.8);
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: #f1f1f1;
}

::-webkit-scrollbar-thumb {
  background-color: var(--primary);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: var(--primary)dd;
}
```

---

## 🔧 Environment Configuration

### .env.template
```bash
# Tenant Configuration
TENANT_ID=beispiel-akademie
TENANT_DOMAIN=beispiel-akademie.kurs24.io
ACADEMY_NAME=Beispiel Akademie

# API Integration
NEXT_PUBLIC_CONFIG_URL=http://api:8000/api/v1/tenant/beispiel-akademie/config
NEXT_PUBLIC_THEME_URL=http://api:8000/api/v1/tenant/beispiel-akademie/theme.css
NEXT_PUBLIC_API_URL=http://api:8000/api/v1

# Features (set by deployment script)
ENABLE_AI_FEATURES=false
ENABLE_ADVANCED_ANALYTICS=false
MAX_STUDENTS=50
MAX_COURSES=10

# Plan Information
TENANT_PLAN=basis
PLAN_LIMITS_JSON={"max_students":50,"max_courses":10,"ai_features":false}

# Branding
COLOR_SCHEME=classic-royal
CUSTOM_LOGO=false

# Database (tenant-specific)
DATABASE_URL=postgresql://tenant_beispiel:password@postgres:5432/tenant_beispiel

# Session & Auth
NEXTAUTH_SECRET=random-secret-for-tenant
NEXTAUTH_URL=https://beispiel-akademie.kurs24.io

# External APIs (wenn Pro Plan)
OPENAI_API_KEY=${OPENAI_API_KEY}
ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
```

### docker-compose.yml Template
```yaml
version: '3.8'

services:
  tenant-app:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: tenant-${TENANT_ID}-app
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - TENANT_ID=${TENANT_ID}
      - ACADEMY_NAME=${ACADEMY_NAME}
    networks:
      - caddy-network
      - backend-network
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    labels:
      - "tenant=${TENANT_ID}"
      - "plan=${TENANT_PLAN}"
      - "academy=${ACADEMY_NAME}"
    depends_on:
      - tenant-db
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Optional: Separate database per tenant
  tenant-db:
    image: postgres:16-alpine
    container_name: tenant-${TENANT_ID}-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: tenant_${TENANT_ID}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: tenant_${TENANT_ID}
    volumes:
      - tenant_db_data:/var/lib/postgresql/data
    networks:
      - backend-network

networks:
  caddy-network:
    external: true
  backend-network:
    external: true

volumes:
  tenant_db_data:
    name: tenant_${TENANT_ID}_db_data
```

---

## 🚀 Deployment Integration

### Updated deploy-tenant.sh Ergänzung
```bash
# After basic tenant setup, configure the template
echo -e "${YELLOW}🎨 Configuring tenant template...${NC}"

# 1. Copy and customize environment
sed -e "s/\${TENANT_ID}/${TENANT_SUBDOMAIN}/g" \
    -e "s/\${ACADEMY_NAME}/${TENANT_SUBDOMAIN//-/ }/g" \
    -e "s/\${TENANT_PLAN}/${TENANT_PLAN}/g" \
    -e "s/\${COLOR_SCHEME}/${TENANT_COLOR}/g" \
    ${MASTER_DIR}/.env.template > ${TENANT_DIR}/.env

# 2. Generate plan-specific features
if [ "$TENANT_PLAN" = "pro" ]; then
    cat >> ${TENANT_DIR}/.env << EOF
ENABLE_AI_FEATURES=true
ENABLE_ADVANCED_ANALYTICS=true
MAX_STUDENTS=unlimited
MAX_COURSES=unlimited
EOF
else
    cat >> ${TENANT_DIR}/.env << EOF
ENABLE_AI_FEATURES=false
ENABLE_ADVANCED_ANALYTICS=false
MAX_STUDENTS=50
MAX_COURSES=10
EOF
fi

# 3. Generate unique database credentials
DB_PASSWORD=$(openssl rand -hex 16)
echo "DB_PASSWORD=${DB_PASSWORD}" >> ${TENANT_DIR}/.env

# 4. Set up initial tenant customization in database
curl -X PUT "http://localhost:8000/api/v1/tenant/${TENANT_SUBDOMAIN}/theme" \
  -H "Content-Type: application/json" \
  -d "{
    \"color_scheme\": \"${TENANT_COLOR}\",
    \"academy_name\": \"${TENANT_SUBDOMAIN//-/ }\"
  }"

echo -e "${GREEN}✅ Template configured for ${TENANT_SUBDOMAIN}${NC}"
```

---

## 🎯 Das perfekte Endergebnis

### Aus Kunden-Sicht:
1. **Sofortiger Start**: Container lädt in 10-30 Sekunden
2. **Branded Experience**: Logo, Farben, Academy-Name überall sichtbar
3. **Feature Clarity**: Klare Unterscheidung Basis vs Pro
4. **Responsive Design**: Funktioniert auf allen Geräten
5. **Intuitive Bedienung**: Bulma-basiertes, sauberes UI

### Aus Admin-Sicht:
1. **Template Updates**: Einmal ändern, alle Tenants profitieren
2. **Theme Flexibility**: 5 vorgefertigte Themes + Custom
3. **Feature Gates**: Plan-basierte Funktionen
4. **Easy Deployment**: Ein Script, alles läuft
5. **Monitoring**: Health checks, Labels für Docker

Das wäre der **perfekte Master Template** für maximale Flexibilität und professionelle Umsetzung! 🎯👑