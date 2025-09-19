#!/bin/bash

# Kurs-Master Deployment Script
# Usage: ./deploy.sh [tenant-name] [domain] [port]

set -e

TENANT_NAME=${1:-demo-tenant}
DOMAIN=${2:-kurs.toxicgirl.de}
PORT=${3:-8081}
CONTAINER_NAME="kurs-${TENANT_NAME}"

echo "🚀 Deploying Kurs-Master for tenant: ${TENANT_NAME}"
echo "📍 Domain: ${DOMAIN}"
echo "🔌 Port: ${PORT}"

# Create tenant-specific data directory
DATA_DIR="./data-${TENANT_NAME}"
mkdir -p ${DATA_DIR}

# Copy database if exists, otherwise use fresh migration
if [ ! -f "${DATA_DIR}/courses.db" ]; then
    echo "📊 Creating fresh database for ${TENANT_NAME}..."
    
    # Copy existing data if available
    if [ -f "./data/courses.db" ]; then
        cp ./data/courses.db ${DATA_DIR}/courses.db
        echo "✅ Copied existing database"
    else
        echo "⚠️  No existing database found - will be created on first run"
    fi
fi

# Generate tenant-specific docker-compose
cat > docker-compose-${TENANT_NAME}.yml << EOF
services:
  ${CONTAINER_NAME}:
    build: .
    container_name: ${CONTAINER_NAME}
    restart: unless-stopped
    ports:
      - "${PORT}:5000"
    volumes:
      - ./${DATA_DIR}:/app/data
    environment:
      - FLASK_ENV=production
      - SECRET_KEY=kurs-${TENANT_NAME}-$(openssl rand -hex 32)
      - TENANT_ID=${TENANT_NAME}
      - DATABASE_PATH=/app/data/courses.db
      - DOMAIN=${DOMAIN}
    labels:
      # Traefik Labels
      - "traefik.enable=true"
      - "traefik.http.routers.${CONTAINER_NAME}.entrypoints=http"
      - "traefik.http.routers.${CONTAINER_NAME}.rule=Host(\`${DOMAIN}\`)"
      - "traefik.http.routers.${CONTAINER_NAME}.middlewares=https-redirect@file"
      - "traefik.http.routers.${CONTAINER_NAME}-sec.entrypoints=https"
      - "traefik.http.routers.${CONTAINER_NAME}-sec.rule=Host(\`${DOMAIN}\`)"
      - "traefik.http.routers.${CONTAINER_NAME}-sec.tls=true"
      - "traefik.http.routers.${CONTAINER_NAME}-sec.tls.certresolver=le"
      - "traefik.http.routers.${CONTAINER_NAME}-sec.service=${CONTAINER_NAME}"
      - "traefik.http.services.${CONTAINER_NAME}.loadbalancer.server.port=5000"
    networks:
      - web

networks:
  web:
    external: true
EOF

# Stop existing container if running
if [ "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
    echo "🛑 Stopping existing container: ${CONTAINER_NAME}"
    docker-compose -f docker-compose-${TENANT_NAME}.yml down
fi

# Build and start new container
echo "🔨 Building and starting container..."
docker-compose -f docker-compose-${TENANT_NAME}.yml up -d --build

# Wait for container to be ready
echo "⏳ Waiting for container to be ready..."
sleep 5

# Check if container is running
if [ "$(docker ps -q -f name=${CONTAINER_NAME})" ]; then
    echo "✅ Container ${CONTAINER_NAME} is running successfully!"
    echo "🌐 Available at: https://${DOMAIN}"
    echo "📊 Data directory: ${DATA_DIR}"
    
    # Show container logs
    echo "📋 Recent logs:"
    docker logs --tail 10 ${CONTAINER_NAME}
else
    echo "❌ Container failed to start!"
    echo "📋 Logs:"
    docker logs ${CONTAINER_NAME}
    exit 1
fi

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "Management commands:"
echo "  View logs:    docker logs -f ${CONTAINER_NAME}"
echo "  Stop:         docker-compose -f docker-compose-${TENANT_NAME}.yml down"
echo "  Restart:      docker-compose -f docker-compose-${TENANT_NAME}.yml restart"
echo "  Shell:        docker exec -it ${CONTAINER_NAME} sh"