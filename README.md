# 👑 Royal Academy K.I. Training Platform

**Multi-Tenant SaaS Platform für KI-Training und Kurserstellung**

Eine professionelle Platform, mit der Trainer ihre eigenen KI-gestützten Trainings-Academies erstellen können.

## 🚀 Features

- **Multi-Tenant Architecture**: Jeder Kunde bekommt seine eigene Subdomain (z.B. `kunde.kurs24.io`)
- **PayPal Integration**: Automatische Abonnement-Verwaltung für Basis (€19) und Pro (€49) Pläne
- **Google OAuth**: Moderne Authentifizierung für bessere User Experience
- **Customer Portal**: Vollständiges Management-Dashboard für Kunden
- **AI Integration**: KI-gestützte Kurserstellung für Pro Plan (GPT-4, Claude, etc.)
- **Royal Academy Branding**: Professionelles Corporate Design
- **SSL & DNS**: Automatische SSL-Zertifikate und DNS-Verwaltung

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Landing Page  │    │  Customer Portal │    │ Tenant Services │
│    (b6t.de)     │───▶│  (portal.kurs24) │───▶│  (sub.kurs24)   │
│                 │    │                  │    │                 │
│ • Marketing     │    │ • Dashboard      │    │ • AI Training   │
│ • Call-to-Action│    │ • Subscriptions  │    │ • Course Builder│
│ • Leads         │    │ • Domain Mgmt    │    │ • Royal Branding│
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## 📁 Project Structure

```
kurs24-platform/
├── docs/                          # Documentation
│   ├── CUSTOMER-PORTAL-SYSTEM.md  # Customer Portal specs
│   ├── setup-steps.md             # Deployment guide
│   └── WORK.MD                    # Current status
│
├── infrastructure/                # Docker & Config
│   ├── docker-compose.yml         # Service orchestration
│   ├── caddy/                     # Reverse proxy & SSL
│   ├── postgres/                  # Database configs
│   └── redis/                     # Cache configs
│
├── backend/                       # FastAPI Backend
│   └── api/                       # API routes & logic
│
├── portal/                        # Next.js Customer Portal
│   └── src/                       # React components
│
├── landing/                       # b6t.de Landing Page
│   └── src/                       # Next.js landing
│
├── tenant-template/               # Template für Tenant-Apps
└── scripts/                      # Deployment & Utils
```

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js 20+
- PostgreSQL 16
- Redis 7
- Domain mit DNS-Zugriff

### Development Setup

1. **Clone & Setup:**
   ```bash
   git clone <this-repo>
   cd kurs24-platform
   cp .env.local .env
   # Edit .env with your credentials
   ```

2. **Start Services:**
   ```bash
   docker compose up -d --build
   ```

3. **Verify Services:**
   ```bash
   curl https://api.kurs24.io/health
   curl https://b6t.de
   ```

### Production Deployment

1. **Server Setup:**
   - Ubuntu 24.04 LTS Server
   - Domain DNS zu Server IP
   - SSL Zertifikate via Let's Encrypt

2. **Environment:**
   ```bash
   cp .env.local .env.production
   # Configure production values
   ```

3. **Deploy:**
   ```bash
   docker compose -f docker-compose.yml up -d --build
   ```

## 🔧 Configuration

### Environment Variables

```bash
# Database
POSTGRES_USER=kurs24
POSTGRES_PASSWORD=secure_password
POSTGRES_DB=kurs24

# Redis
REDIS_PASSWORD=redis_password

# DNS APIs
PORKBUN_API_KEY=pk1_your_key
PORKBUN_SECRET_KEY=sk1_your_secret

# PayPal
PAYPAL_CLIENT_ID=your_client_id
PAYPAL_CLIENT_SECRET=your_secret

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_secret

# NextAuth.js
NEXTAUTH_URL=https://portal.kurs24.io
NEXTAUTH_SECRET=your_secret_key
```

### Services

- **API**: `https://api.kurs24.io` - FastAPI Backend
- **Landing**: `https://b6t.de` - Marketing & Signup
- **Portal**: `https://portal.kurs24.io` - Customer Dashboard
- **Admin**: `https://admin.kurs24.io:2019` - Caddy Admin
- **Tenants**: `https://{subdomain}.kurs24.io` - Customer Instances

## 🔒 Security

- **SSL/TLS**: Automatische Let's Encrypt Zertifikate
- **OAuth 2.0**: Google Single Sign-On
- **JWT**: Sichere API-Authentifizierung
- **DSGVO**: Compliant Data Processing
- **Rate Limiting**: DDoS Protection

## 📊 Monitoring

- **Health Checks**: `/health` endpoint für alle Services
- **Logs**: Docker Compose Logs
- **Metrics**: API Response Times, Database Health
- **Alerts**: E-Mail Benachrichtigungen bei Ausfällen

## 🎯 Business Model

### Pläne:
- **Basis Plan**: €19/Monat - Standard Funktionen
- **Pro Plan**: €49/Monat - Mit KI-Features

### Features:
- Multi-Tenant Subdomains
- PayPal Subscription Management
- Royal Academy Corporate Branding
- Customer Portal & Dashboard
- SSL & DNS Automation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

Proprietary - Royal Academy K.I. Training Platform

## 🆘 Support

- **Documentation**: `docs/` folder
- **Health Status**: `https://api.kurs24.io/health`
- **Admin Interface**: `https://admin.kurs24.io:2019`

---

**🏰👑 Built with Claude Code - Royal Academy K.I. Training Platform 👑🏰**