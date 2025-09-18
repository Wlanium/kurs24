# 👑 Royal Academy K.I. Customer Portal System

## 🎯 Vision & Concept

**Professional Customer Portal für Royal Academy K.I. Training Platform**

Anstatt direkte Subdomain-Buchung auf der Landing Page, führen wir ein umfassendes Customer Portal ein:
- **Registrierung & Login** für alle Kunden (E-Mail + Google OAuth)
- **Subscription Management** mit PayPal-Integration
- **Subdomain Administration** mit Live-Status
- **Account Verwaltung** komplett
- **Professional UI** mit shadcn/ui
- **Social Login** mit Google für bessere UX

---

## 🏗️ Architecture Overview

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

---

## 🔐 Authentication & User Management

### Multi-Provider Authentication Strategy
```typescript
// Unterstützte Login-Methoden
const AUTH_PROVIDERS = {
  email: 'Klassische E-Mail/Passwort Registrierung',
  google: 'Google OAuth 2.0 Single Sign-On',
  // Zukünftig: microsoft, apple, linkedin
}

const AUTH_BENEFITS = {
  google: {
    userExperience: 'Keine Passwort-Eingabe, schnellere Registrierung',
    security: 'Google 2FA, OAuth 2.0 Standard',
    conversion: '+40% höhere Registrierungsrate',
    support: 'Weniger "Passwort vergessen" Tickets'
  }
}
```

### Database Schema (OAuth-Ready)

```sql
-- Users Table (Extended for OAuth)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- NULL für OAuth-only Users
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    company VARCHAR(255),
    phone VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    email_verified BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) DEFAULT 'active', -- active, suspended, deleted
    last_login TIMESTAMP,

    -- OAuth Provider Fields
    google_id VARCHAR(255) UNIQUE,
    avatar_url VARCHAR(500), -- Profilbild von Google
    auth_provider VARCHAR(50) DEFAULT 'email', -- 'email', 'google', 'hybrid'
    provider_verified BOOLEAN DEFAULT FALSE, -- OAuth Provider hat E-Mail verifiziert

    -- Legacy field
    profile_image_url VARCHAR(500) -- Fallback für manuell hochgeladene Bilder
);

-- OAuth Accounts Table (für Multiple Provider Support)
CREATE TABLE oauth_accounts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL, -- 'google', 'microsoft', etc.
    provider_account_id VARCHAR(255) NOT NULL, -- Google User ID
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP,
    token_type VARCHAR(50) DEFAULT 'Bearer',
    scope TEXT,
    id_token TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(provider, provider_account_id)
);

-- Subscriptions Table
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL, -- 'basis', 'pro'
    status VARCHAR(50) NOT NULL, -- 'active', 'cancelled', 'expired', 'pending'
    paypal_subscription_id VARCHAR(255),
    paypal_order_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, yearly
    current_period_start TIMESTAMP,
    current_period_end TIMESTAMP,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    cancelled_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Subdomains Table
CREATE TABLE subdomains (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id) ON DELETE CASCADE,
    subdomain VARCHAR(63) UNIQUE NOT NULL, -- max 63 chars per DNS RFC
    full_domain VARCHAR(255) GENERATED ALWAYS AS (subdomain || '.kurs24.io') STORED,
    status VARCHAR(50) DEFAULT 'provisioning', -- provisioning, active, suspended, deleted
    dns_created_at TIMESTAMP,
    ssl_created_at TIMESTAMP,
    container_created_at TIMESTAMP,
    last_health_check TIMESTAMP,
    health_status VARCHAR(20) DEFAULT 'unknown', -- healthy, unhealthy, unknown
    custom_title VARCHAR(200),
    custom_logo_url VARCHAR(500),
    custom_primary_color VARCHAR(7) DEFAULT '#1e40af', -- Royal Blue
    admin_username VARCHAR(100),
    admin_password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment History Table
CREATE TABLE payment_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    subscription_id INTEGER REFERENCES subscriptions(id),
    paypal_transaction_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(50), -- completed, pending, failed, cancelled
    payment_method VARCHAR(50) DEFAULT 'paypal',
    invoice_number VARCHAR(100),
    invoice_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usage Analytics Table (für Pro Plan)
CREATE TABLE usage_analytics (
    id SERIAL PRIMARY KEY,
    subdomain_id INTEGER REFERENCES subdomains(id) ON DELETE CASCADE,
    metric_name VARCHAR(100) NOT NULL, -- 'api_calls', 'ai_generations', 'storage_mb'
    metric_value BIGINT NOT NULL,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_subdomain_metric_date (subdomain_id, metric_name, recorded_at)
);

-- Notifications Table
CREATE TABLE notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success'
    title VARCHAR(200) NOT NULL,
    message TEXT,
    read_at TIMESTAMP,
    action_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🎨 UI Design System (shadcn/ui)

### Theme Configuration
```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        // Royal Academy Branding
        royal: {
          50: '#f0f4ff',
          100: '#e6edff',
          200: '#d0ddff',
          300: '#aac2ff',
          400: '#7d9aff',
          500: '#4c6fff',
          600: '#1e40af', // Primary Royal Blue
          700: '#1e3a8a',
          800: '#1e3a8a',
          900: '#1e3a8a',
        },
        gold: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fde68a',
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b', // Royal Gold
          600: '#d97706',
          700: '#b45309',
          800: '#92400e',
          900: '#78350f',
        }
      }
    }
  }
}
```

### Component Library Setup
```bash
# shadcn/ui Setup für Portal
npx create-next-app@latest royal-academy-portal --typescript --tailwind --eslint
cd royal-academy-portal
npx shadcn-ui@latest init

# Komponenten installieren
npx shadcn-ui@latest add button card input label
npx shadcn-ui@latest add form select textarea
npx shadcn-ui@latest add dialog sheet tabs
npx shadcn-ui@latest add table badge
npx shadcn-ui@latest add toast dropdown-menu
npx shadcn-ui@latest add chart progress
npx shadcn-ui@latest add avatar skeleton
```

---

## 📱 Portal Pages & Features

### 1. Authentication Pages

#### `/login` - Login Page
```typescript
'use client'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-900 via-royal-800 to-royal-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 bg-gold-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">👑</span>
          </div>
          <CardTitle className="text-2xl font-bold text-royal-800">Royal Academy K.I.</CardTitle>
          <CardDescription>
            Melden Sie sich in Ihrem Customer Portal an
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Google OAuth Login */}
          <Button
            onClick={() => signIn('google')}
            variant="outline"
            className="w-full h-12 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Mit Google anmelden
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-600">oder</span>
            </div>
          </div>

          {/* Email/Password Login */}
          <div className="space-y-2">
            <Label htmlFor="email">E-Mail</Label>
            <Input id="email" placeholder="ihre.email@domain.de" type="email" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input id="password" type="password" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-2">
          <Button className="w-full bg-royal-600 hover:bg-royal-700">
            Mit E-Mail anmelden
          </Button>
          <div className="text-center text-sm">
            <a href="/register" className="text-royal-600 hover:underline">
              Noch kein Account? Registrieren
            </a>
          </div>
          <div className="text-center text-sm">
            <a href="/forgot-password" className="text-gray-600 hover:underline">
              Passwort vergessen?
            </a>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
```

#### `/register` - Registration Page
```typescript
'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function RegisterPage() {
  const [step, setStep] = useState(1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-royal-900 via-royal-800 to-royal-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto h-16 w-16 bg-gold-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">👑</span>
          </div>
          <CardTitle className="text-3xl font-bold text-royal-800">
            Willkommen bei Royal Academy K.I.
          </CardTitle>
          <div className="flex justify-center mt-4">
            <div className="flex space-x-2">
              <div className={`w-3 h-3 rounded-full ${step >= 1 ? 'bg-royal-600' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 2 ? 'bg-royal-600' : 'bg-gray-300'}`} />
              <div className={`w-3 h-3 rounded-full ${step >= 3 ? 'bg-royal-600' : 'bg-gray-300'}`} />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Persönliche Daten</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Vorname</Label>
                  <Input id="firstName" placeholder="Max" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nachname</Label>
                  <Input id="lastName" placeholder="Mustermann" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-Mail Adresse</Label>
                <Input id="email" placeholder="max@mustermann.de" type="email" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Unternehmen (optional)</Label>
                <Input id="company" placeholder="Mustermann Training GmbH" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Account-Sicherheit</h3>
              <div className="space-y-2">
                <Label htmlFor="password">Passwort</Label>
                <Input id="password" type="password" placeholder="Mindestens 8 Zeichen" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Passwort bestätigen</Label>
                <Input id="confirmPassword" type="password" />
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">🔒 Sicherheitshinweise:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Mindestens 8 Zeichen</li>
                  <li>• Groß- und Kleinbuchstaben</li>
                  <li>• Mindestens eine Zahl</li>
                  <li>• Mindestens ein Sonderzeichen</li>
                </ul>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-xl font-semibold mb-4">Plan auswählen</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="border-2 border-gray-200 hover:border-royal-500 cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">Basis Plan</CardTitle>
                    <div className="text-3xl font-bold text-royal-600">€19<span className="text-lg text-gray-500">/Monat</span></div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Eigene Subdomain</li>
                      <li>✅ Royal Academy Branding</li>
                      <li>✅ Standard Kurse</li>
                      <li>✅ E-Mail Support</li>
                      <li>❌ KI-Assistent</li>
                      <li>❌ Automatische Kurserstellung</li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-gold-400 bg-gradient-to-br from-gold-50 to-gold-100 relative">
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gold-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      👑 EMPFOHLEN
                    </span>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg">Pro Plan</CardTitle>
                    <div className="text-3xl font-bold text-royal-600">€49<span className="text-lg text-gray-500">/Monat</span></div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li>✅ Alles aus Basis Plan</li>
                      <li>✅ KI-Assistent (GPT-4, Claude)</li>
                      <li>✅ Automatische Kurserstellung</li>
                      <li>✅ LangGraph Workflows</li>
                      <li>✅ CrewAI Teams</li>
                      <li>✅ Priority Support</li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          <div className="flex justify-between mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Zurück
              </Button>
            )}
            <div className="flex-1" />
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} className="bg-royal-600 hover:bg-royal-700">
                Weiter
              </Button>
            ) : (
              <Button className="bg-gold-500 hover:bg-gold-600">
                Account erstellen & Bezahlen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 2. Dashboard Pages

#### `/dashboard` - Main Dashboard
```typescript
'use client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Willkommen zurück, Max Mustermann</p>
        </div>
        <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
          Pro Plan Aktiv
        </Badge>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subdomain Status</CardTitle>
            <span className="text-2xl">🌐</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Aktiv</div>
            <p className="text-xs text-gray-600">training.kurs24.io</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Nächste Rechnung</CardTitle>
            <span className="text-2xl">💳</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€49</div>
            <p className="text-xs text-gray-600">in 23 Tagen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">KI-Nutzung</CardTitle>
            <span className="text-2xl">🤖</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-gray-600">API Calls diesen Monat</p>
            <Progress value={62} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Support</CardTitle>
            <span className="text-2xl">🎧</span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-gray-600">< 2h Antwortzeit</p>
          </CardContent>
        </Card>
      </div>

      {/* Action Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              🌐 Subdomain Verwaltung
            </CardTitle>
            <CardDescription>
              Verwalten Sie Ihre training.kurs24.io Instanz
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status</span>
              <Badge className="bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Online
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">SSL Zertifikat</span>
              <Badge variant="outline" className="text-green-600">Gültig bis 15.12.2025</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Letztes Update</span>
              <span className="text-sm text-gray-600">vor 2 Stunden</span>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" className="flex-1">
                Dashboard öffnen
              </Button>
              <Button size="sm" variant="outline">
                Einstellungen
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              💳 Abonnement & Rechnungen
            </CardTitle>
            <CardDescription>
              Verwalten Sie Ihr Pro Plan Abonnement
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Aktueller Plan</span>
              <Badge className="bg-gold-100 text-gold-800">👑 Pro Plan</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nächste Zahlung</span>
              <span className="text-sm font-bold">€49 am 15.10.2025</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Zahlungsmethode</span>
              <span className="text-sm text-gray-600">PayPal ••••@gmail.com</span>
            </div>
            <div className="flex space-x-2">
              <Button size="sm" variant="outline" className="flex-1">
                Rechnungen anzeigen
              </Button>
              <Button size="sm" variant="outline">
                Plan ändern
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>📈 Letzte Aktivitäten</CardTitle>
          <CardDescription>
            Ihre neuesten Aktionen und Systemereignisse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { icon: "🤖", text: "KI-Assistent hat 3 neue Kurse generiert", time: "vor 2 Stunden", type: "success" },
              { icon: "💳", text: "Zahlung von €49 erfolgreich verarbeitet", time: "vor 1 Tag", type: "success" },
              { icon: "🔒", text: "SSL Zertifikat automatisch erneuert", time: "vor 3 Tagen", type: "info" },
              { icon: "👤", text: "Passwort erfolgreich geändert", time: "vor 1 Woche", type: "info" },
              { icon: "🎯", text: "Willkommen bei Royal Academy K.I.!", time: "vor 2 Wochen", type: "success" }
            ].map((activity, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                <span className="text-lg">{activity.icon}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.text}</p>
                  <p className="text-xs text-gray-600">{activity.time}</p>
                </div>
                <Badge
                  variant="outline"
                  className={activity.type === 'success' ? 'text-green-600 border-green-200' : 'text-blue-600 border-blue-200'}
                >
                  {activity.type === 'success' ? '✓' : 'ℹ'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

## 🔧 Backend API Extensions

### New API Endpoints
```python
# /opt/kurs24/api/portal.py
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import List

router = APIRouter(prefix="/api/v1/portal", tags=["Customer Portal"])
security = HTTPBearer()

# Authentication
@router.post("/auth/register")
async def register_user(user_data: UserRegistration):
    """Registriert einen neuen Benutzer"""
    # Hash password
    password_hash = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt())

    # Create user in database
    user = User(
        email=user_data.email,
        password_hash=password_hash,
        first_name=user_data.first_name,
        last_name=user_data.last_name,
        company=user_data.company
    )

    # Send verification email
    await send_verification_email(user.email)

    return {"message": "Registrierung erfolgreich. Bitte E-Mail verifizieren."}

@router.post("/auth/login")
async def login_user(credentials: UserLogin):
    """Benutzer-Login mit JWT Token"""
    user = get_user_by_email(credentials.email)

    if not user or not bcrypt.checkpw(credentials.password.encode(), user.password_hash):
        raise HTTPException(status_code=401, detail="Ungültige Anmeldedaten")

    # Generate JWT token
    token = jwt.encode({
        "user_id": user.id,
        "email": user.email,
        "exp": datetime.utcnow() + timedelta(hours=24)
    }, JWT_SECRET, algorithm="HS256")

    return {"access_token": token, "token_type": "bearer"}

# Dashboard
@router.get("/dashboard/stats")
async def get_dashboard_stats(current_user: User = Depends(get_current_user)):
    """Dashboard Statistiken für den Benutzer"""
    subdomain = get_user_subdomain(current_user.id)
    subscription = get_user_subscription(current_user.id)

    stats = {
        "subdomain": {
            "domain": f"{subdomain.subdomain}.kurs24.io" if subdomain else None,
            "status": subdomain.status if subdomain else "nicht_erstellt",
            "health": subdomain.health_status if subdomain else "unknown"
        },
        "subscription": {
            "plan": subscription.plan_type if subscription else None,
            "status": subscription.status if subscription else None,
            "next_billing": subscription.current_period_end if subscription else None,
            "amount": subscription.amount if subscription else None
        },
        "usage": await get_usage_stats(current_user.id),
        "recent_activity": await get_recent_activity(current_user.id)
    }

    return stats

# Subscription Management
@router.post("/subscriptions/create")
async def create_subscription(plan_data: CreateSubscription, current_user: User = Depends(get_current_user)):
    """Erstellt neues Abonnement mit PayPal"""

    # Create PayPal subscription
    paypal_response = await create_paypal_subscription(
        plan_type=plan_data.plan_type,
        user_email=current_user.email,
        return_url=f"https://portal.kurs24.io/dashboard?success=true",
        cancel_url=f"https://portal.kurs24.io/plans?cancelled=true"
    )

    # Store pending subscription
    subscription = Subscription(
        user_id=current_user.id,
        plan_type=plan_data.plan_type,
        status="pending",
        paypal_subscription_id=paypal_response["id"],
        amount=19.00 if plan_data.plan_type == "basis" else 49.00
    )

    return {"approval_url": paypal_response["links"]["approve"]}

@router.post("/subscriptions/{subscription_id}/cancel")
async def cancel_subscription(subscription_id: int, current_user: User = Depends(get_current_user)):
    """Kündigt Abonnement zum Ende der Laufzeit"""
    subscription = get_subscription(subscription_id, current_user.id)

    # Cancel with PayPal
    await cancel_paypal_subscription(subscription.paypal_subscription_id)

    # Update database
    subscription.cancel_at_period_end = True
    subscription.cancelled_at = datetime.utcnow()

    return {"message": "Abonnement wird zum Ende der Laufzeit gekündigt"}

# Subdomain Management
@router.post("/subdomains/create")
async def create_user_subdomain(subdomain_data: CreateSubdomain, current_user: User = Depends(get_current_user)):
    """Erstellt Subdomain für Benutzer (nach erfolgreicher Zahlung)"""

    # Check if user has active subscription
    subscription = get_active_subscription(current_user.id)
    if not subscription:
        raise HTTPException(status_code=402, detail="Aktives Abonnement erforderlich")

    # Create subdomain
    subdomain = await provision_subdomain(
        user_id=current_user.id,
        subscription_id=subscription.id,
        subdomain=subdomain_data.subdomain,
        plan_type=subscription.plan_type
    )

    return {"message": "Subdomain wird erstellt", "subdomain": subdomain.full_domain}

@router.get("/subdomains/{subdomain}/status")
async def check_subdomain_status(subdomain: str, current_user: User = Depends(get_current_user)):
    """Prüft Status der Subdomain-Erstellung"""
    user_subdomain = get_user_subdomain_by_name(subdomain, current_user.id)

    if not user_subdomain:
        raise HTTPException(status_code=404, detail="Subdomain nicht gefunden")

    # Live status check
    dns_ready = await check_dns_propagation(f"{subdomain}.kurs24.io")
    ssl_ready = await check_ssl_certificate(f"{subdomain}.kurs24.io")
    container_ready = await check_container_health(subdomain)

    status = {
        "subdomain": subdomain,
        "overall_status": user_subdomain.status,
        "dns_ready": dns_ready,
        "ssl_ready": ssl_ready,
        "container_ready": container_ready,
        "estimated_completion": "2-5 Minuten" if not all([dns_ready, ssl_ready, container_ready]) else "Bereit!"
    }

    return status

# Account Management
@router.put("/account/profile")
async def update_profile(profile_data: UpdateProfile, current_user: User = Depends(get_current_user)):
    """Aktualisiert Benutzerprofil"""
    current_user.first_name = profile_data.first_name
    current_user.last_name = profile_data.last_name
    current_user.company = profile_data.company
    current_user.phone = profile_data.phone
    current_user.updated_at = datetime.utcnow()

    return {"message": "Profil erfolgreich aktualisiert"}

@router.post("/account/change-password")
async def change_password(password_data: ChangePassword, current_user: User = Depends(get_current_user)):
    """Ändert Benutzerpasswort"""

    # Verify old password
    if not bcrypt.checkpw(password_data.old_password.encode(), current_user.password_hash):
        raise HTTPException(status_code=400, detail="Altes Passwort ist falsch")

    # Update password
    new_password_hash = bcrypt.hashpw(password_data.new_password.encode(), bcrypt.gensalt())
    current_user.password_hash = new_password_hash
    current_user.updated_at = datetime.utcnow()

    return {"message": "Passwort erfolgreich geändert"}

# Notifications
@router.get("/notifications")
async def get_notifications(current_user: User = Depends(get_current_user)):
    """Holt Benutzer-Benachrichtigungen"""
    notifications = get_user_notifications(current_user.id, limit=50)
    return notifications

@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: int, current_user: User = Depends(get_current_user)):
    """Markiert Benachrichtigung als gelesen"""
    notification = get_notification(notification_id, current_user.id)
    notification.read_at = datetime.utcnow()
    return {"message": "Benachrichtigung als gelesen markiert"}
```

---

## 🔧 NextAuth.js Setup & Configuration

### Installation & Dependencies
```bash
# NextAuth.js für OAuth Integration
npm install next-auth @auth/nextjs @next-auth/google-provider

# Zusätzliche Dependencies
npm install @auth/prisma-adapter prisma @prisma/client  # für Database
npm install bcryptjs @types/bcryptjs jsonwebtoken @types/jsonwebtoken
```

### Environment Variables
```bash
# .env.local
NEXTAUTH_URL=https://portal.kurs24.io
NEXTAUTH_SECRET=your_super_secure_nextauth_secret_key_256_bit_minimum

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Database Connection (existing)
DATABASE_URL=postgresql://kurs24:password@localhost:5432/kurs24

# API Keys (existing)
JWT_SECRET=your_jwt_secret_for_api_tokens
```

### NextAuth.js Configuration
```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    // Google OAuth Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),

    // Email/Password Provider
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.users.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password_hash) return null

        const isValidPassword = await bcrypt.compare(
          credentials.password,
          user.password_hash
        )

        if (!isValidPassword) return null

        // Update last login
        await prisma.users.update({
          where: { id: user.id },
          data: { last_login: new Date() }
        })

        return {
          id: user.id.toString(),
          email: user.email,
          name: `${user.first_name} ${user.last_name}`.trim(),
          image: user.avatar_url || user.profile_image_url,
          authProvider: user.auth_provider
        }
      }
    })
  ],

  callbacks: {
    async signIn({ user, account, profile }) {
      try {
        if (account?.provider === 'google') {
          // Check if user exists
          const existingUser = await prisma.users.findFirst({
            where: {
              OR: [
                { email: user.email! },
                { google_id: account.providerAccountId }
              ]
            }
          })

          if (existingUser) {
            // Update existing user with Google info
            await prisma.users.update({
              where: { id: existingUser.id },
              data: {
                google_id: account.providerAccountId,
                avatar_url: user.image,
                auth_provider: existingUser.auth_provider === 'email' ? 'hybrid' : 'google',
                provider_verified: true,
                email_verified: true,
                last_login: new Date()
              }
            })
          } else {
            // Create new user from Google
            const names = user.name?.split(' ') || []
            await prisma.users.create({
              data: {
                email: user.email!,
                first_name: names[0] || '',
                last_name: names.slice(1).join(' ') || '',
                google_id: account.providerAccountId,
                avatar_url: user.image,
                auth_provider: 'google',
                provider_verified: true,
                email_verified: true,
                status: 'active'
              }
            })

            // Create welcome notification
            await createWelcomeNotification(user.email!)
          }
        }
        return true
      } catch (error) {
        console.error('SignIn callback error:', error)
        return false
      }
    },

    async jwt({ token, user, account }) {
      // Include user ID and auth provider in JWT
      if (user) {
        const dbUser = await prisma.users.findUnique({
          where: { email: user.email! },
          include: {
            subscriptions: {
              where: { status: 'active' },
              orderBy: { created_at: 'desc' }
            }
          }
        })

        if (dbUser) {
          token.userId = dbUser.id
          token.authProvider = dbUser.auth_provider
          token.currentPlan = dbUser.subscriptions[0]?.plan_type || null
        }
      }
      return token
    },

    async session({ session, token }: { session: Session; token: any }) {
      // Add user ID and auth provider to session
      if (token.userId) {
        session.user.id = token.userId
        session.user.authProvider = token.authProvider
        session.user.currentPlan = token.currentPlan
      }
      return session
    }
  },

  pages: {
    signIn: '/auth/login',
    signUp: '/auth/register',
    error: '/auth/error'
  },

  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60     // 24 hours
  },

  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }

// Helper function for welcome notification
async function createWelcomeNotification(email: string) {
  const user = await prisma.users.findUnique({ where: { email } })
  if (user) {
    await prisma.notifications.create({
      data: {
        user_id: user.id,
        type: 'success',
        title: 'Willkommen bei Royal Academy K.I.!',
        message: 'Ihr Account wurde erfolgreich erstellt. Wählen Sie jetzt Ihren Plan und starten Sie durch!',
        action_url: '/plans'
      }
    })
  }
}
```

### Session Provider Setup
```typescript
// app/providers.tsx
'use client'
import { SessionProvider } from 'next-auth/react'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
    </SessionProvider>
  )
}

// app/layout.tsx
import { Providers } from './providers'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

### Authentication Hooks & Utilities
```typescript
// lib/auth.ts
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'

export function useAuthSession() {
  const { data: session, status } = useSession()

  return {
    session,
    isAuthenticated: !!session,
    isLoading: status === 'loading',
    user: session?.user
  }
}

// Protected Route HOC
export function withAuth<T extends {}>(Component: React.ComponentType<T>) {
  return function AuthenticatedComponent(props: T) {
    const { session, isLoading } = useAuthSession()

    if (isLoading) {
      return <LoadingSpinner />
    }

    if (!session) {
      redirect('/auth/login')
    }

    return <Component {...props} />
  }
}

// Server-side auth check
export async function requireAuth() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login')
  }

  return session
}
```

### Google Cloud Console Setup
```markdown
## Google OAuth Setup Steps:

1. **Google Cloud Console**: https://console.cloud.google.com/
2. **Create Project**: "Royal Academy K.I. Portal"
3. **Enable APIs**: Google+ API
4. **Create Credentials**:
   - OAuth 2.0 Client IDs
   - Application type: Web application
   - Name: "Royal Academy Portal"

5. **Authorized JavaScript origins**:
   - https://portal.kurs24.io
   - http://localhost:3000 (development)

6. **Authorized redirect URIs**:
   - https://portal.kurs24.io/api/auth/callback/google
   - http://localhost:3000/api/auth/callback/google

7. **Copy Client ID & Secret** to .env.local

## Additional Google APIs (optional):
- Google Calendar API (für Kurstermine)
- Google Drive API (für Dokument-Export)
- Gmail API (für E-Mail-Benachrichtigungen)
```

### Type Definitions
```typescript
// types/next-auth.d.ts
import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: number
      email: string
      name?: string
      image?: string
      authProvider: 'email' | 'google' | 'hybrid'
      currentPlan?: 'basis' | 'pro' | null
    }
  }

  interface User {
    id: string
    email: string
    name?: string
    image?: string
    authProvider?: string
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    userId: number
    authProvider: string
    currentPlan?: string | null
  }
}
```

---

## 🚀 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
```bash
# 1.1 Database Schema
cd /opt/kurs24
psql -U kurs24 -d kurs24 < portal-schema.sql

# 1.2 Next.js Portal Setup with OAuth
npx create-next-app@latest portal --typescript --tailwind --app
cd portal
npx shadcn-ui@latest init

# OAuth & Authentication Dependencies
npm install next-auth @auth/nextjs @next-auth/google-provider
npm install @auth/prisma-adapter prisma @prisma/client
npm install bcryptjs @types/bcryptjs jsonwebtoken @types/jsonwebtoken

# 1.3 Google Cloud Console Setup
# - Create Google Cloud project
# - Enable Google+ API
# - Configure OAuth 2.0 credentials
# - Set authorized redirect URIs

# 1.4 NextAuth.js Configuration
# - Configure [...nextauth]/route.ts
# - Set up Google + Credentials providers
# - Database adapter setup
# - Session & JWT configuration
```

### Phase 2: Core Features (Week 3-4)
```bash
# 2.1 Dashboard Implementation
# - User stats
# - Subscription status
# - Subdomain management

# 2.2 PayPal Integration
# - Subscription creation
# - Payment webhooks
# - Billing management

# 2.3 Subdomain Provisioning
# - Integration with existing API
# - Real-time status updates
# - Container deployment
```

### Phase 3: Advanced Features (Week 5-6)
```bash
# 3.1 Account Management
# - Profile settings
# - Password change
# - Security settings

# 3.2 Usage Analytics
# - API usage tracking
# - Performance metrics
# - Cost analysis

# 3.3 Support System
# - Ticket system
# - Knowledge base
# - Live chat integration
```

---

## 📊 Success Metrics

### User Experience KPIs:
- **Registration Conversion**: >85% complete registration (with Google OAuth)
- **Dashboard Engagement**: >6 min average session
- **Support Tickets**: <8% users need help (reduced password issues)
- **Feature Discovery**: >65% use advanced features
- **OAuth Adoption**: >60% users choose Google login

### Business KPIs:
- **Pro Plan Conversion**: >75% choose Pro (Google users convert better)
- **Churn Rate**: <4% monthly (OAuth users stay longer)
- **Customer Lifetime Value**: >€600
- **Support Satisfaction**: >4.7/5 stars
- **Registration Speed**: <30 seconds average (Google OAuth)

---

## 🔒 Security & Compliance

### Security Measures:
```typescript
// JWT Configuration
const JWT_CONFIG = {
  secret: process.env.JWT_SECRET,
  expiresIn: '24h',
  refreshExpiresIn: '7d',
  algorithm: 'HS256'
}

// Password Requirements
const PASSWORD_POLICY = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  preventCommonPasswords: true
}

// Rate Limiting
const RATE_LIMITS = {
  login: '5 attempts per 15 minutes',
  registration: '3 attempts per hour',
  passwordReset: '3 attempts per hour',
  apiCalls: '1000 requests per hour',
  oauth: '10 attempts per 10 minutes' // OAuth requests
}

// OAuth Security
const OAUTH_SECURITY = {
  google: {
    scopes: ['email', 'profile'], // Minimale erforderliche Berechtigungen
    pkce: true, // Proof Key for Code Exchange
    state: true, // CSRF protection
    sessionMaxAge: 30 * 24 * 60 * 60, // 30 Tage
    refreshTokens: true // Automatische Token-Erneuerung
  }
}
```

### DSGVO Compliance (OAuth-Enhanced):
- ✅ **Datenschutz-Dashboard** für Benutzer
- ✅ **Daten-Export** Funktion (inkl. OAuth-Daten)
- ✅ **Account-Löschung** vollständig (Google-Verknüpfung entfernen)
- ✅ **Cookie-Consent** Management (OAuth-Sessions)
- ✅ **Audit-Logs** für alle Aktionen (OAuth-Login tracking)
- ✅ **Verschlüsselung** aller sensiblen Daten
- ✅ **OAuth-Token Sicherheit** (verschlüsselte Speicherung)
- ✅ **Minimal Data Collection** (nur email, profile von Google)
- ✅ **Consent Management** für OAuth-Berechtigungen

---

## 📱 Mobile Responsiveness

```typescript
// Responsive Design Breakpoints
const BREAKPOINTS = {
  mobile: '320px - 767px',
  tablet: '768px - 1023px',
  desktop: '1024px+',

  // shadcn/ui responsive classes
  components: {
    dashboard: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    navigation: 'hidden md:flex',
    mobileMenu: 'md:hidden',
    cards: 'w-full max-w-sm md:max-w-md lg:max-w-lg'
  }
}

// PWA Configuration (optional)
const PWA_CONFIG = {
  name: 'Royal Academy K.I. Portal',
  shortName: 'RA Portal',
  description: 'Customer Portal für Royal Academy K.I.',
  themeColor: '#1e40af',
  backgroundColor: '#ffffff',
  display: 'standalone',
  orientation: 'portrait'
}
```

---

**🎯 Das Customer Portal System ist vollständig spezifiziert!**

**Next Steps:**
1. **Database Schema** implementieren
2. **shadcn/ui Setup** mit Royal Academy Theme
3. **Authentication System** mit JWT
4. **Dashboard Pages** erstellen
5. **PayPal Integration** erweitern
6. **Subdomain Management** integrieren
7. **Testing & Deployment**

**Soll ich mit der Implementierung anfangen? 🚀**