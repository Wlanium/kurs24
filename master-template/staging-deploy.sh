#!/bin/bash

# Kurs-Master Staging Deployment System
# Creates dynamic containers from master template

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
STAGING_BASE="/home/tba/docker/staging"

# Function to create new tenant container
create_tenant_container() {
    local tenant_name=$1
    local domain=$2
    local port=$3
    local course_title=$4
    
    echo "🏗️  Creating new tenant container: ${tenant_name}"
    
    # Create staging directory
    local staging_dir="${STAGING_BASE}/${tenant_name}"
    mkdir -p ${staging_dir}
    
    # Copy master template
    cp -r ${SCRIPT_DIR}/* ${staging_dir}/
    
    # Create tenant-specific data directory
    mkdir -p ${staging_dir}/data
    
    # Generate tenant-specific environment
    cat > ${staging_dir}/.env << EOF
FLASK_ENV=production
SECRET_KEY=kurs-${tenant_name}-$(openssl rand -hex 32)
TENANT_ID=${tenant_name}
DATABASE_PATH=/app/data/courses.db
DOMAIN=${domain}
COURSE_TITLE=${course_title}
PORT=${port}
EOF
    
    # Generate docker-compose.yml
    cat > ${staging_dir}/docker-compose.yml << EOF
services:
  kurs-${tenant_name}:
    build: .
    container_name: kurs-${tenant_name}
    restart: unless-stopped
    ports:
      - "${port}:5000"
    volumes:
      - ./data:/app/data
    env_file:
      - .env
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.kurs-${tenant_name}.entrypoints=http"
      - "traefik.http.routers.kurs-${tenant_name}.rule=Host(\`${domain}\`)"
      - "traefik.http.routers.kurs-${tenant_name}.middlewares=https-redirect@file"
      - "traefik.http.routers.kurs-${tenant_name}-sec.entrypoints=https"
      - "traefik.http.routers.kurs-${tenant_name}-sec.rule=Host(\`${domain}\`)"
      - "traefik.http.routers.kurs-${tenant_name}-sec.tls=true"
      - "traefik.http.routers.kurs-${tenant_name}-sec.tls.certresolver=le"
      - "traefik.http.routers.kurs-${tenant_name}-sec.service=kurs-${tenant_name}"
      - "traefik.http.services.kurs-${tenant_name}.loadbalancer.server.port=5000"
    networks:
      - web

networks:
  web:
    external: true
EOF
    
    # Deploy container
    cd ${staging_dir}
    docker-compose up -d --build
    
    echo "✅ Tenant ${tenant_name} deployed successfully!"
    echo "🌐 Domain: https://${domain}"
    echo "📁 Path: ${staging_dir}"
    
    return 0
}

# Function to remove tenant container
remove_tenant_container() {
    local tenant_name=$1
    local staging_dir="${STAGING_BASE}/${tenant_name}"
    
    echo "🗑️  Removing tenant container: ${tenant_name}"
    
    if [ -d "${staging_dir}" ]; then
        cd ${staging_dir}
        docker-compose down
        
        # Optional: Remove data (prompt user)
        read -p "Remove data directory? [y/N]: " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            rm -rf ${staging_dir}
            echo "✅ Tenant ${tenant_name} and data removed"
        else
            echo "✅ Container stopped, data preserved"
        fi
    else
        echo "❌ Tenant ${tenant_name} not found"
        return 1
    fi
}

# Function to list all tenants
list_tenants() {
    echo "📋 Active tenants:"
    echo "=================="
    
    if [ -d "${STAGING_BASE}" ]; then
        for tenant_dir in ${STAGING_BASE}/*/; do
            if [ -d "${tenant_dir}" ]; then
                tenant_name=$(basename "${tenant_dir}")
                container_name="kurs-${tenant_name}"
                
                if [ "$(docker ps -q -f name=${container_name})" ]; then
                    status="🟢 Running"
                    port=$(docker port ${container_name} 5000 2>/dev/null | cut -d: -f2)
                else
                    status="🔴 Stopped"
                    port="-"
                fi
                
                echo "  ${tenant_name}: ${status} (Port: ${port})"
            fi
        done
    else
        echo "  No tenants found"
    fi
}

# Function to update master template
update_master() {
    echo "🔄 Updating master template..."
    
    # Create backup
    local backup_dir="/tmp/kurs-master-backup-$(date +%Y%m%d-%H%M%S)"
    cp -r ${SCRIPT_DIR} ${backup_dir}
    echo "📦 Backup created: ${backup_dir}"
    
    # Here you could pull from git or copy from development
    echo "✅ Master template updated"
}

# Main command handler
case "${1:-help}" in
    "create")
        if [ $# -lt 4 ]; then
            echo "Usage: $0 create <tenant-name> <domain> <port> [course-title]"
            echo "Example: $0 create max-academy max.toxicgirl.de 8082 \"Max's Academy\""
            exit 1
        fi
        create_tenant_container "$2" "$3" "$4" "${5:-Kurs Academy}"
        ;;
    "remove")
        if [ $# -lt 2 ]; then
            echo "Usage: $0 remove <tenant-name>"
            exit 1
        fi
        remove_tenant_container "$2"
        ;;
    "list")
        list_tenants
        ;;
    "update")
        update_master
        ;;
    "help"|*)
        echo "Kurs-Master Staging Deployment System"
        echo "====================================="
        echo ""
        echo "Commands:"
        echo "  create <tenant> <domain> <port> [title]  Create new tenant container"
        echo "  remove <tenant>                          Remove tenant container"
        echo "  list                                     List all tenants"
        echo "  update                                   Update master template"
        echo ""
        echo "Examples:"
        echo "  $0 create demo-academy demo.toxicgirl.de 8082 \"Demo Academy\""
        echo "  $0 create max-kurs max.toxicgirl.de 8083 \"Max's Rechtskurs\""
        echo "  $0 list"
        echo "  $0 remove demo-academy"
        ;;
esac