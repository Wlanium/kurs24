#!/bin/bash

# 🚀 Tenant Deployment Script für kurs24.io
# Deployt einen neuen Kunden von MASTER Template

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
BASE_DIR="/home/tba/kurs24-platform"
MASTER_DIR="${BASE_DIR}/master-template"
TENANTS_DIR="${BASE_DIR}/tenants"
CADDY_DYNAMIC_DIR="${BASE_DIR}/infrastructure/caddy/dynamic_subdomains"

# Arguments
TENANT_SUBDOMAIN=$1
TENANT_PLAN=${2:-basis}
TENANT_EMAIL=$3
TENANT_COLOR=${4:-classic-royal}

# Validation
if [ -z "$TENANT_SUBDOMAIN" ]; then
    echo -e "${RED}Error: Tenant subdomain required!${NC}"
    echo "Usage: $0 <subdomain> [plan] [email] [color]"
    echo "Example: $0 neue-akademie pro admin@akademie.de ocean-blue"
    exit 1
fi

echo -e "${GREEN}🏰 Royal Academy Tenant Deployment${NC}"
echo "======================================"
echo "Subdomain: ${TENANT_SUBDOMAIN}.kurs24.io"
echo "Plan: $TENANT_PLAN"
echo "Email: $TENANT_EMAIL"
echo "Color: $TENANT_COLOR"
echo ""

# Step 1: Create tenant directory
TENANT_DIR="${TENANTS_DIR}/${TENANT_SUBDOMAIN}"
echo -e "${YELLOW}📁 Creating tenant directory...${NC}"

if [ -d "$TENANT_DIR" ]; then
    echo -e "${RED}Error: Tenant directory already exists!${NC}"
    exit 1
fi

mkdir -p "$TENANT_DIR"

# Step 2: Copy MASTER template
echo -e "${YELLOW}📋 Copying MASTER template...${NC}"
cp -r ${MASTER_DIR}/* ${TENANT_DIR}/

# Step 3: Configure tenant environment
echo -e "${YELLOW}⚙️ Configuring tenant environment...${NC}"
cat > ${TENANT_DIR}/.env << EOF
# Tenant Configuration
TENANT_ID=${TENANT_SUBDOMAIN}
TENANT_PLAN=${TENANT_PLAN}
TENANT_EMAIL=${TENANT_EMAIL}
TENANT_COLOR_SCHEME=${TENANT_COLOR}
TENANT_DOMAIN=${TENANT_SUBDOMAIN}.kurs24.io

# Database (isolated per tenant)
DATABASE_URL=postgresql://tenant_${TENANT_SUBDOMAIN}:password@postgres:5432/tenant_${TENANT_SUBDOMAIN}

# API Configuration
API_PORT=$((8000 + $(echo ${TENANT_SUBDOMAIN} | cksum | cut -d' ' -f1) % 1000))
APP_PORT=$((3000 + $(echo ${TENANT_SUBDOMAIN} | cksum | cut -d' ' -f1) % 1000))

# Features based on plan
ENABLE_AI_FEATURES=$([ "$TENANT_PLAN" = "pro" ] && echo "true" || echo "false")
ENABLE_ADVANCED_ANALYTICS=$([ "$TENANT_PLAN" = "pro" ] && echo "true" || echo "false")
MAX_STUDENTS=$([ "$TENANT_PLAN" = "pro" ] && echo "unlimited" || echo "50")
MAX_COURSES=$([ "$TENANT_PLAN" = "pro" ] && echo "unlimited" || echo "10")

# Branding
ACADEMY_NAME="${TENANT_SUBDOMAIN//-/ }"
ACADEMY_LOGO="/assets/logo-royal-academy.png"
EOF

# Step 4: Create Docker Compose for tenant
echo -e "${YELLOW}🐳 Creating Docker configuration...${NC}"
cat > ${TENANT_DIR}/docker-compose.yml << EOF
version: '3.8'

services:
  # Tenant Application
  ${TENANT_SUBDOMAIN}-app:
    image: kurs24/tenant-app:latest
    container_name: tenant-${TENANT_SUBDOMAIN}-app
    restart: unless-stopped
    env_file:
      - .env
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_TENANT_ID=${TENANT_SUBDOMAIN}
    networks:
      - caddy-network
      - backend-network
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    labels:
      - "traefik.enable=false"
      - "tenant=${TENANT_SUBDOMAIN}"
      - "plan=${TENANT_PLAN}"

  # Tenant-specific database (optional, für data isolation)
  ${TENANT_SUBDOMAIN}-db:
    image: postgres:16-alpine
    container_name: tenant-${TENANT_SUBDOMAIN}-db
    restart: unless-stopped
    environment:
      POSTGRES_USER: tenant_${TENANT_SUBDOMAIN}
      POSTGRES_PASSWORD: $(openssl rand -hex 16)
      POSTGRES_DB: tenant_${TENANT_SUBDOMAIN}
    volumes:
      - ./postgres_data:/var/lib/postgresql/data
    networks:
      - backend-network

networks:
  caddy-network:
    external: true
  backend-network:
    external: true

volumes:
  postgres_data:
    name: tenant_${TENANT_SUBDOMAIN}_postgres
EOF

# Step 5: Create Caddy configuration
echo -e "${YELLOW}🔒 Configuring Caddy for SSL...${NC}"
cat > ${CADDY_DYNAMIC_DIR}/${TENANT_SUBDOMAIN}.caddyfile << EOF
# Auto-generated Caddy config for ${TENANT_SUBDOMAIN}
${TENANT_SUBDOMAIN}.kurs24.io {
    # Automatic SSL via Let's Encrypt
    tls {
        issuer acme
    }

    # Headers
    header {
        X-Tenant-ID "${TENANT_SUBDOMAIN}"
        X-Frame-Options "SAMEORIGIN"
        X-Content-Type-Options "nosniff"
        X-XSS-Protection "1; mode=block"
    }

    # Reverse proxy to tenant container
    reverse_proxy tenant-${TENANT_SUBDOMAIN}-app:3000 {
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-Proto {scheme}
        header_up X-Tenant-ID "${TENANT_SUBDOMAIN}"
    }

    # Logging
    log {
        output file /var/log/caddy/${TENANT_SUBDOMAIN}.log
        format json
    }
}
EOF

# Step 6: Create DNS record via Porkbun API
echo -e "${YELLOW}🌐 Creating DNS record...${NC}"
if [ -f "/home/tba/kurs24-platform/.env.production" ]; then
    source /home/tba/kurs24-platform/.env.production

    # Porkbun API call
    curl -X POST https://porkbun.com/api/json/v3/dns/create/kurs24.io \
      -H "Content-Type: application/json" \
      -d '{
        "apikey": "'${PORKBUN_API_KEY}'",
        "secretapikey": "'${PORKBUN_SECRET_KEY}'",
        "type": "A",
        "name": "'${TENANT_SUBDOMAIN}'",
        "content": "'${SERVER_IP}'",
        "ttl": "300"
      }' || echo -e "${YELLOW}Warning: DNS creation failed, please create manually${NC}"
fi

# Step 7: Start tenant containers
echo -e "${YELLOW}🚀 Starting tenant containers...${NC}"
cd ${TENANT_DIR}
docker compose up -d

# Step 8: Reload Caddy to pick up new config
echo -e "${YELLOW}🔄 Reloading Caddy...${NC}"
docker exec caddy caddy reload --config /etc/caddy/Caddyfile

# Step 9: Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 10

if curl -s -o /dev/null -w "%{http_code}" https://${TENANT_SUBDOMAIN}.kurs24.io/health | grep -q "200"; then
    echo -e "${GREEN}✅ Deployment successful!${NC}"
    echo ""
    echo "🎉 Tenant deployed successfully!"
    echo "🌐 URL: https://${TENANT_SUBDOMAIN}.kurs24.io"
    echo "📧 Admin: ${TENANT_EMAIL}"
    echo "💼 Plan: ${TENANT_PLAN}"
    echo ""
    echo "Next steps:"
    echo "1. Send welcome email to ${TENANT_EMAIL}"
    echo "2. Monitor logs: docker logs tenant-${TENANT_SUBDOMAIN}-app"
    echo "3. Check metrics: https://admin.kurs24.io"
else
    echo -e "${RED}⚠️ Warning: Health check failed, please check manually${NC}"
    echo "Debug: docker logs tenant-${TENANT_SUBDOMAIN}-app"
fi

# Step 10: Log deployment
echo "[$(date)] Deployed tenant: ${TENANT_SUBDOMAIN} (${TENANT_PLAN})" >> /var/log/kurs24-deployments.log

echo -e "${GREEN}🏰 Royal Academy Tenant Deployment Complete!${NC}"