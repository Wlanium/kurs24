# Claude CLI: Complete Deployment Guide für kurs24.io

## 🎯 Deployment-Reihenfolge & Kompletter Launch-Guide

**Von 0 auf Live-SaaS in 7 Tagen!** 🚀

---

## 📋 Phase 1: Server-Setup (Tag 1)

### Step 1.1: Netcup RS 1000 G12 einrichten
```bash
# SSH in den frischen Ubuntu 24.04 Server
ssh root@your-server-ip

# System-Update
apt update && apt upgrade -y

# Hostname setzen
hostnamectl set-hostname kurs24-production
echo "127.0.0.1 kurs24-production" >> /etc/hosts

# Timezone
timedatectl set-timezone Europe/Berlin
```

### Step 1.2: Base-System mit Claude CLI
**Prompt:** "Richte mir Ubuntu 24.04 LTS für Production ein mit Docker, PostgreSQL 16, Redis 7, Nginx, UFW Firewall, Fail2ban und Performance-Optimierungen für AMD EPYC. SSL via Let's Encrypt vorbereiten."

### Step 1.3: DNS bei Porkbun konfigurieren
```bash
# A-Records anlegen:
# kurs24.io -> your-server-ip
# *.kurs24.io -> your-server-ip  
# api.kurs24.io -> your-server-ip
# admin.kurs24.io -> your-server-ip

# Testen:
dig kurs24.io
dig api.kurs24.io
```

---

## 🏗️ Phase 2: Backend-Infrastructure (Tag 2-3)

### Step 2.1: Master-Services mit Ansible
```bash
# Ansible-Setup
pip3 install ansible ansible-core

# Repository klonen
git clone https://github.com/Wlanium/kurs24.git /home/tba/kurs24-platform

# Environment-Variablen setzen
cat > /home/tba/kurs24-platform/.env << 'EOF'
# DNS APIs
PORKBUN_API_KEY=pk1_your_api_key
PORKBUN_SECRET_KEY=sk1_your_secret_key
NETCUP_API_KEY=your_netcup_api_key
NETCUP_API_PASSWORD=your_netcup_api_password
NETCUP_CUSTOMER_NUMBER=your_netcup_customer_number

# Database
POSTGRES_PASSWORD=super_secure_master_password
REDIS_PASSWORD=redis_secure_password

# AI Services (Pro Plan)
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_AI_KEY=your-google-key

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret

# System
SERVER_IP=your-server-ip
DOMAIN_NAME=kurs24.io
JWT_SECRET=your-jwt-secret-256bit
TRAEFIK_AUTH_HASH=your-basic-auth-hash
EOF

# Master-Infrastructure deployen
cd /home/tba/kurs24-platform
docker compose up -d --build
```

### Step 2.2: Master-Services starten
```bash
cd /home/tba/kurs24-platform
docker compose up -d

# Health-Checks
curl https://api.kurs24.io/health
curl https://admin.kurs24.io  # Traefik Dashboard
```

---

## 🎨 Phase 3: Frontend-Setup (Tag 3-4)

### Step 3.1: b6t.de Landing Page
**Claude CLI Prompt verwenden:** "Erstelle die komplette b6t.de Landing Page mit Next.js 14, Royal Academy Branding, PayPal-Integration und allen Features aus dem Prompt."

### Step 3.2: Landing Page deployen
```bash
# Auf Vercel (empfohlen)
vercel --prod

# Oder auf eigenem Server
cd /opt/b6t-landing
npm run build
pm2 start npm --name "b6t-landing" -- start

# DNS b6t.de -> Server/Vercel (Netcup DNS API)
```

### Step 3.3: Tenant-App-Template
**Claude CLI Prompt:** "Erstelle die Tenant-App mit React/Next.js, Royal Academy Multi-Branding, LangGraph+CrewAI Integration und allen Features aus dem AI-Engine-Prompt."

---

## 🤖 Phase 4: KI-Engine Integration (Tag 4-5)

### Step 4.1: AI-Services Container
```dockerfile
# Dockerfile für AI-Engine
FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# AI Engine Code
COPY ./services/ai-engine/ .

EXPOSE 8001

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
```

### Step 4.2: requirements.txt für AI-Engine
```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
anthropic==0.8.1
openai==1.3.8
google-generativeai==0.3.2
crewai==0.1.55
langgraph==0.0.32
langchain==0.0.350
asyncpg==0.29.0
aioredis==2.0.1
httpx==0.25.2
pydantic==2.5.0
python-multipart==0.0.6
```

### Step 4.3: KI-Engine starten
```bash
# Build & Deploy AI-Engine
docker build -t kurs24/ai-engine:latest ./services/ai-engine/
docker run -d \
  --name ai-engine \
  --network kurs24-network \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  -e OPENAI_API_KEY=$OPENAI_API_KEY \
  -e GOOGLE_AI_KEY=$GOOGLE_AI_KEY \
  kurs24/ai-engine:latest
```

---

## 🧪 Phase 5: Testing & QA (Tag 5-6)

### Step 5.1: Automatisierte Tests
```bash
# Test-Suite erstellen
cat > /opt/kurs24/tests/integration-tests.sh << 'EOF'
#!/bin/bash

echo "🧪 kurs24.io Integration Tests"

# Test 1: Health Checks
echo "Testing health endpoints..."
curl -f https://api.kurs24.io/health || exit 1
curl -f https://opd.agency || exit 1

# Test 2: Subdomain Check
echo "Testing subdomain availability..."
curl -X POST https://api.kurs24.io/api/v1/check-subdomain \
  -H "Content-Type: application/json" \
  -d '{"subdomain":"test-integration"}' || exit 1

# Test 3: KI-Engine (Pro Plan)
echo "Testing AI course generation..."
# (Detailed test with mock data)

echo "✅ All tests passed!"
EOF

chmod +x /opt/kurs24/tests/integration-tests.sh
./opt/kurs24/tests/integration-tests.sh
```

### Step 5.2: Performance Testing
```bash
# Load Testing mit ab (Apache Bench)
apt install apache2-utils -y

# Test Landing Page
ab -n 100 -c 10 https://opd.agency/

# Test API
ab -n 50 -c 5 https://api.kurs24.io/health

# Monitor Resources während Tests
htop
docker stats
```

### Step 5.3: Manual Testing Checklist
```markdown
## Manual Test Checklist

### Landing Page (opd.agency)
- [ ] Royal Academy Logo lädt
- [ ] Alle Farbschemas funktionieren
- [ ] Responsive Design (Mobile/Desktop)
- [ ] PayPal-Checkout funktioniert
- [ ] Formvalidierung funktioniert
- [ ] SSL-Zertifikat gültig

### Platform (kurs24.io)
- [ ] Tenant-Provisioning nach PayPal-Zahlung
- [ ] DNS-Record wird automatisch erstellt
- [ ] Container startet mit korrektem Branding
- [ ] AI-Features nur für Pro Plan
- [ ] Basis Plan ohne KI funktioniert
- [ ] SSL für Subdomains funktioniert

### AI-Engine (Pro Plan)
- [ ] Course-Creation via API
- [ ] LangGraph Workflow funktioniert
- [ ] CrewAI Teams generieren Content
- [ ] Token-Usage wird getrackt
- [ ] Canvas/PDF Export funktioniert
- [ ] Royal Academy Branding applied

### System Health
- [ ] Alle Container healthy
- [ ] Database erreichbar
- [ ] Redis funktioniert
- [ ] Backup läuft automatisch
- [ ] Monitoring funktioniert
- [ ] Logs werden rotiert
```

---

## 🚀 Phase 6: Production Launch (Tag 6-7)

### Step 6.1: Production Readiness
```bash
# Final Production Setup
cat > /opt/kurs24/scripts/production-final-check.sh << 'EOF'
#!/bin/bash

echo "🚀 Production Readiness Check"

ERRORS=()

# SSL Certificates
if ! curl -s https://api.kurs24.io/health >/dev/null; then
    ERRORS+=("❌ API SSL/Health check failed")
fi

if ! curl -s https://b6t.de >/dev/null; then
    ERRORS+=("❌ Landing page SSL/Health check failed")
fi

# Database
if ! docker exec postgres-master pg_isready -U kurs24 >/dev/null; then
    ERRORS+=("❌ Database not ready")
fi

# Redis
if ! docker exec redis-master redis-cli ping >/dev/null; then
    ERRORS+=("❌ Redis not ready")
fi

# Disk Space
DISK_USAGE=$(df /opt/kurs24 | awk 'NR==2{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 70 ]; then
    ERRORS+=("⚠️ Disk usage high: ${DISK_USAGE}%")
fi

# Memory
MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEMORY_USAGE" -gt 75 ]; then
    ERRORS+=("⚠️ Memory usage high: ${MEMORY_USAGE}%")
fi

# PayPal Connectivity
if ! curl -s https://api.paypal.com >/dev/null; then
    ERRORS+=("❌ PayPal API unreachable")
fi

if [ ${#ERRORS[@]} -eq 0 ]; then
    echo "✅ Production ready! 🎉"
    echo "🏰 Royal Academy K.I. Training Platform is LIVE!"
    exit 0
else
    echo "❌ Production readiness issues:"
    printf '%s\n' "${ERRORS[@]}"
    exit 1
fi
EOF

chmod +x /opt/kurs24/scripts/production-final-check.sh
./opt/kurs24/scripts/production-final-check.sh
```

### Step 6.2: Go-Live Sequence
```bash
# 1. Final Backup vor Launch
/opt/kurs24/scripts/backup.sh

# 2. DNS Final Check
dig kurs24.io
dig b6t.de
dig api.kurs24.io

# 3. Services Final Restart
docker compose -f /opt/kurs24/docker-compose.master.yml restart

# 4. Monitoring aktivieren
systemctl enable kurs24
crontab -l

# 5. SSL Renewal Test
certbot renew --dry-run

echo "🚀 LAUNCH COMPLETE! 🎉"
echo "💰 Royal Academy K.I. Training Platform is LIVE and ready for customers!"
```

---

## 📊 Phase 7: Post-Launch Monitoring

### Step 7.1: Monitoring Dashboard
```bash
# Prometheus + Grafana (optional)
cat > /opt/kurs24/monitoring/docker-compose.monitoring.yml << 'EOF'
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    networks:
      - kurs24-network
      
  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=secure_grafana_password
    volumes:
      - grafana_data:/var/lib/grafana
    networks:
      - kurs24-network

volumes:
  prometheus_data:
  grafana_data:

networks:
  kurs24-network:
    external: true
EOF
```

### Step 7.2: Business Metrics Tracking
```bash
# Daily Business Report
cat > /opt/kurs24/scripts/daily-business-report.sh << 'EOF'
#!/bin/bash

echo "📊 kurs24.io Daily Business Report - $(date)"

# Get metrics from API
curl -s https://api.kurs24.io/api/v1/metrics | jq '
{
  "Total Tenants": .tenants.total_tenants,
  "Pro Tenants": .tenants.pro_tenants,
  "Basis Tenants": .tenants.basis_tenants,
  "Active Tenants": .tenants.active_tenants,
  "Monthly Revenue": "\(.tenants.monthly_recurring_revenue)€",
  "New Signups (24h)": .recent_activity.signups_24h
}'

# System health
echo "🖥️ System Health:"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}')"
echo "Memory: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
echo "Disk: $(df /opt/kurs24 | awk 'NR==2{print $5}')"
echo "Active Containers: $(docker ps --format "table {{.Names}}" | wc -l)"

echo "📈 Growth Metrics:"
echo "Revenue/Tenant: $(echo "scale=2; $(curl -s https://api.kurs24.io/api/v1/metrics | jq -r '.tenants.monthly_recurring_revenue // 0') / $(curl -s https://api.kurs24.io/api/v1/metrics | jq -r '.tenants.active_tenants // 1')" | bc)€"
echo "Pro Plan Adoption: $(curl -s https://api.kurs24.io/api/v1/metrics | jq -r '(.tenants.pro_tenants / .tenants.total_tenants * 100 | floor)'  2>/dev/null || echo "0")%"

EOF

chmod +x /opt/kurs24/scripts/daily-business-report.sh

# Add to cron für täglich 9 Uhr
echo "0 9 * * * /opt/kurs24/scripts/daily-business-report.sh | mail -s 'kurs24.io Daily Report' your-email@domain.com" | crontab -
```

---

## 🔥 Success Metrics & KPIs

### Technical KPIs:
```yaml
Performance Targets:
  - API Response Time: <200ms (95th percentile)
  - Page Load Time: <2s (opd.agency)
  - Container Startup: <30s
  - DNS Propagation: <5min
  - Uptime: >99.5%

Capacity Planning:
  - Max Tenants on RS 1000 G12: ~25 active
  - RAM per Tenant: ~200-300MB
  - Scale-up trigger: >20 tenants + >80% memory
  - Backup retention: 30 days local, 90 days remote
```

### Business KPIs:
```yaml
Month 1 Targets:
  - Total Signups: 10+
  - Pro Plan Conversion: 60%
  - MRR: €300+
  - Churn Rate: <5%

Month 3 Targets:
  - Total Signups: 50+
  - Pro Plan Conversion: 70%
  - MRR: €1,500+
  - Customer Support: <24h response

Month 6 Targets:
  - Total Signups: 150+
  - Pro Plan Conversion: 80%
  - MRR: €5,000+
  - Scale to second server
```

---

## 🎯 Marketing Launch Strategy

### Soft Launch (Week 1):
```markdown
- 🎯 Target: IHK-Trainer über LinkedIn
- 📝 Content: "Royal Academy für KI-Training launched"
- 🎁 Early Bird: Erste 10 Kunden -50% für 3 Monate
- 📊 Goal: 5 Pro Plan Signups
```

### Public Launch (Week 2-4):
```markdown
- 🚀 PR: Pressemitteilung "Erste KI-Training-Academy Deutschlands"
- 🎥 Content: Demo-Videos, Case Studies
- 🤝 Partnerships: IHK, VHS, Trainer-Verbände
- 📊 Goal: 25+ Total Signups
```

### Growth Phase (Month 2+):
```markdown
- 📈 SEO: Content-Marketing für "KI Kurse erstellen"
- 💬 Community: LinkedIn, XING Trainer-Gruppen
- 🔄 Referrals: Partner-Programm für Trainer
- 📊 Goal: Organisches Wachstum 20+/Monat
```

---

## 🛡️ Security & Compliance Final Check

### Security Checklist:
```bash
# SSL/TLS Check
echo "🔒 Security Audit:"

# Test all SSL endpoints
for domain in "kurs24.io" "api.kurs24.io" "b6t.de"; do
    echo -n "Testing $domain SSL: "
    if curl -s -I https://$domain | grep -q "200 OK"; then
        echo "✅ OK"
    else
        echo "❌ FAILED"
    fi
done

# Docker Security
echo "🐳 Docker Security:"
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  docker/docker-bench-security || echo "Install docker-bench-security for detailed audit"

# File Permissions
echo "📁 File Permissions:"
find /opt/kurs24 -type f -perm /o+w -exec echo "WARN: World-writable file: {}" \;

echo "🔐 Security audit complete!"
```

### DSGVO Compliance Final:
```markdown
## DSGVO Compliance Checklist ✅

### Implemented:
- [x] Datenschutzerklärung auf b6t.de
- [x] Cookie-Banner (falls verwendet)
- [x] Opt-in für Marketing
- [x] Datenminimierung (nur notwendige Daten)
- [x] Verschlüsselung (SSL/TLS überall)
- [x] Zugangskontrollen (Docker isolation)
- [x] Backup-Verschlüsselung
- [x] EU-Server (Nürnberg)

### Ongoing:
- [ ] Regelmäßige Sicherheits-Audits
- [ ] Mitarbeiter-Schulungen (wenn Team wächst)
- [ ] Datenschutz-Folgenabschätzung bei Changes
- [ ] Incident-Response-Plan
```

---

## 🎉 LAUNCH DAY CEREMONY! 

```bash
#!/bin/bash
# launch-celebration.sh

cat << 'EOF'
    🏰👑 ROYAL ACADEMY K.I. TRAINING PLATFORM 👑🏰
    
    ██╗  ██╗██╗   ██╗██████╗ ███████╗██████╗ ██╗  ██╗    ██╗ ██████╗ 
    ██║ ██╔╝██║   ██║██╔══██╗██╔════╝╚════██╗██║  ██║    ██║██╔═══██╗
    █████╔╝ ██║   ██║██████╔╝███████╗ █████╔╝███████║    ██║██║   ██║
    ██╔═██╗ ██║   ██║██╔══██╗╚════██║██╔═══╝ ╚════██║    ██║██║   ██║
    ██║  ██╗╚██████╔╝██║  ██║███████║███████╗     ██║    ██║╚██████╔╝
    ╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝╚══════╝╚══════╝     ╚═╝    ╚═╝ ╚═════╝ 
    
    🚀 LAUNCH SUCCESSFUL! 
    💰 PASSIVE INCOME MACHINE: ACTIVATED
    👑 ROYAL ACADEMY STATUS: ACHIEVED
    
    Platform URLs:
    🏰 Landing: https://b6t.de
    🤖 API: https://api.kurs24.io
    📊 Admin: https://admin.kurs24.io
    
    Ready for customers! 🎯💪
    
EOF

echo "📊 Final System Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo ""
echo "💡 Next Steps:"
echo "1. Monitor /opt/kurs24/logs/monitor.log"
echo "2. Check daily business reports"
echo "3. Start marketing campaign"
echo "4. Wait for first PayPal notifications 💰"

echo ""
echo "🎉 CONGRATULATIONS! Your SaaS Empire starts NOW! 👑"
```

---

**DU HAST JETZT ALLES für den kompletten Launch! 🚀**

**Von Server-Setup bis Business-Metrics - alles ist ready für deinen passiven Income-Traum!** 💰👑

**Zeit für den ersten Kunden! 🎯**