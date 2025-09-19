#!/bin/bash

# 🚀 Flask Tenant Deployment Script für kurs24.io
# Deployt einen neuen Kunden von MASTER Template (Flask Version)

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

echo -e "${GREEN}🏰 Royal Academy Flask Tenant Deployment${NC}"
echo "=============================================="
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

# Step 3: Generate unique ports and secrets
echo -e "${YELLOW}⚙️ Generating tenant configuration...${NC}"
APP_PORT=$((5000 + $(echo ${TENANT_SUBDOMAIN} | cksum | cut -d' ' -f1) % 1000))
SECRET_KEY=$(openssl rand -hex 32)
API_BASE_URL="https://api.kurs24.io"

# Step 4: Replace template variables in docker-compose.yml
echo -e "${YELLOW}🐳 Configuring Docker setup...${NC}"
# Replace template variables in docker-compose.yml
sed -i "s/{{TENANT_ID}}/${TENANT_SUBDOMAIN}/g" ${TENANT_DIR}/docker-compose.yml
sed -i "s/{{TENANT_PLAN}}/${TENANT_PLAN}/g" ${TENANT_DIR}/docker-compose.yml
sed -i "s/{{TENANT_EMAIL}}/${TENANT_EMAIL}/g" ${TENANT_DIR}/docker-compose.yml
sed -i "s/{{TENANT_COLOR}}/${TENANT_COLOR}/g" ${TENANT_DIR}/docker-compose.yml
sed -i "s/{{SECRET_KEY}}/${SECRET_KEY}/g" ${TENANT_DIR}/docker-compose.yml
sed -i "s/{{APP_PORT}}/${APP_PORT}/g" ${TENANT_DIR}/docker-compose.yml
sed -i "s|{{API_BASE_URL}}|${API_BASE_URL}|g" ${TENANT_DIR}/docker-compose.yml

# Replace template variables in .env.template if it exists
if [ -f "${TENANT_DIR}/.env.template" ]; then
    sed -i "s/{{TENANT_ID}}/${TENANT_SUBDOMAIN}/g" ${TENANT_DIR}/.env.template
    sed -i "s/{{TENANT_PLAN}}/${TENANT_PLAN}/g" ${TENANT_DIR}/.env.template
    sed -i "s/{{TENANT_EMAIL}}/${TENANT_EMAIL}/g" ${TENANT_DIR}/.env.template
    sed -i "s/{{TENANT_COLOR}}/${TENANT_COLOR}/g" ${TENANT_DIR}/.env.template
    sed -i "s/{{SECRET_KEY}}/${SECRET_KEY}/g" ${TENANT_DIR}/.env.template
    sed -i "s|{{API_BASE_URL}}|${API_BASE_URL}|g" ${TENANT_DIR}/.env.template
    mv ${TENANT_DIR}/.env.template ${TENANT_DIR}/.env.processed
fi

# Step 5: Create .env file
echo -e "${YELLOW}📄 Creating environment file...${NC}"
cat > ${TENANT_DIR}/.env << EOF
# Tenant Configuration
TENANT_ID=${TENANT_SUBDOMAIN}
TENANT_PLAN=${TENANT_PLAN}
TENANT_EMAIL=${TENANT_EMAIL}
TENANT_COLOR=${TENANT_COLOR}

# Security
SECRET_KEY=${SECRET_KEY}

# Database
DATABASE_PATH=/app/data/courses.db

# API Configuration
API_BASE_URL=${API_BASE_URL}

# Flask Environment
FLASK_ENV=production

# Features based on plan
ENABLE_AI_FEATURES=$([ "$TENANT_PLAN" = "pro" ] && echo "true" || echo "false")
MAX_STUDENTS=$([ "$TENANT_PLAN" = "pro" ] && echo "unlimited" || echo "50")
MAX_COURSES=$([ "$TENANT_PLAN" = "pro" ] && echo "unlimited" || echo "10")

# Branding
ACADEMY_NAME="${TENANT_SUBDOMAIN//-/ }"
EOF

# Step 6: Create Caddy configuration
echo -e "${YELLOW}🔒 Configuring Caddy for SSL...${NC}"
mkdir -p "${CADDY_DYNAMIC_DIR}"
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
    reverse_proxy tenant-${TENANT_SUBDOMAIN}-app:5000 {
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

# Step 7: Create DNS record via Porkbun API
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

# Step 8: Start tenant containers
echo -e "${YELLOW}🚀 Starting tenant containers...${NC}"
cd ${TENANT_DIR}
docker compose up -d --build

# Step 9: Reload Caddy to pick up new config
echo -e "${YELLOW}🔄 Reloading Caddy...${NC}"
docker exec caddy caddy reload --config /etc/caddy/Caddyfile || echo -e "${YELLOW}Warning: Caddy reload failed${NC}"

# Step 10: Health check
echo -e "${YELLOW}🏥 Running health check...${NC}"
sleep 15

# Check if container is running
if docker ps | grep -q "tenant-${TENANT_SUBDOMAIN}-app"; then
    echo -e "${GREEN}✅ Container started successfully!${NC}"
else
    echo -e "${RED}⚠️ Warning: Container failed to start${NC}"
    echo "Debug: docker logs tenant-${TENANT_SUBDOMAIN}-app"
fi

# Step 11: Display results
echo -e "${GREEN}🎉 Tenant deployed successfully!${NC}"
echo ""
echo "🌐 URL: https://${TENANT_SUBDOMAIN}.kurs24.io (DNS may take a few minutes)"
echo "📧 Admin: ${TENANT_EMAIL}"
echo "💼 Plan: ${TENANT_PLAN}"
echo "🐳 Container: tenant-${TENANT_SUBDOMAIN}-app"
echo "🔧 Port: ${APP_PORT} → 5000"
echo ""
echo "Next steps:"
echo "1. Wait for DNS propagation (2-5 minutes)"
echo "2. Test: curl -I https://${TENANT_SUBDOMAIN}.kurs24.io"
echo "3. Monitor logs: docker logs tenant-${TENANT_SUBDOMAIN}-app"
echo "4. Caddy logs: docker logs caddy"

# Step 12: Log deployment
echo "[$(date)] Deployed Flask tenant: ${TENANT_SUBDOMAIN} (${TENANT_PLAN}) on port ${APP_PORT}" >> /var/log/kurs24-deployments.log

echo -e "${GREEN}🏰 Royal Academy Flask Tenant Deployment Complete!${NC}"