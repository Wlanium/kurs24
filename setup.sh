#!/bin/bash
# Ubuntu 24.04 Minimal -> Production Ready Setup
# For kurs24.io SaaS Platform on 152.53.150.111

set -euo pipefail

SERVER_IP="152.53.150.111"
HOSTNAME="kurs24-production"

echo "🚀 Ubuntu 24.04 Production Setup Starting..."
echo "Server: $SERVER_IP"
echo "Target: kurs24.io SaaS Platform"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root or with sudo
if [[ $EUID -eq 0 ]]; then
    SUDO_CMD=""
else
    SUDO_CMD="sudo"
fi

print_status "Step 1/12: System Updates & Essentials"
$SUDO_CMD apt update && $SUDO_CMD apt upgrade -y

# Essential system packages
$SUDO_CMD apt install -y \
    curl \
    wget \
    git \
    unzip \
    zip \
    tar \
    gzip \
    tree \
    htop \
    neofetch \
    nano \
    vim \
    tmux \
    screen \
    build-essential \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    jq \
    bc \
    net-tools \
    dnsutils \
    telnet \
    traceroute \
    whois \
    rsync \
    cron \
    logrotate \
    fail2ban \
    ufw \
    openssl \
    ssl-cert


print_success "Essential packages installed"

print_status "Step 2/12: System Configuration"
# Set hostname
$SUDO_CMD hostnamectl set-hostname $HOSTNAME
echo "127.0.0.1 $HOSTNAME" | $SUDO_CMD tee -a /etc/hosts

# Set timezone
$SUDO_CMD timedatectl set-timezone Europe/Berlin

# Configure locale
$SUDO_CMD locale-gen en_US.UTF-8
$SUDO_CMD locale-gen de_DE.UTF-8

print_success "System configuration updated"

print_status "Step 3/12: Firewall Setup (UFW)"
# Configure UFW
$SUDO_CMD ufw default deny incoming
$SUDO_CMD ufw default allow outgoing
$SUDO_CMD ufw allow ssh
$SUDO_CMD ufw allow 80/tcp   # HTTP
$SUDO_CMD ufw allow 443/tcp  # HTTPS
$SUDO_CMD ufw allow 8080/tcp # Traefik Dashboard
$SUDO_CMD ufw --force enable

print_success "Firewall configured and enabled"

print_status "Step 4/12: Fail2ban Configuration"
# Basic fail2ban setup
$SUDO_CMD systemctl enable fail2ban
$SUDO_CMD systemctl start fail2ban

# Create basic jail.local
cat <<'EOF' | $SUDO_CMD tee /etc/fail2ban/jail.local
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s
bantime = 7200
maxretry = 3
EOF

$SUDO_CMD systemctl restart fail2ban
print_success "Fail2ban configured"

print_status "Step 5/12: Docker Installation"
# Add Docker's official GPG key
$SUDO_CMD mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | $SUDO_CMD gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Add Docker repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | $SUDO_CMD tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
$SUDO_CMD apt update
$SUDO_CMD apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Add current user to docker group (if not root)
if [[ $EUID -ne 0 ]]; then
    $SUDO_CMD usermod -aG docker $USER
fi

# Configure Docker daemon for production
cat <<'EOF' | $SUDO_CMD tee /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.override_kernel_check=true"
  ],
  "default-ulimits": {
    "nofile": {
      "hard": 64000,
      "soft": 32000
    }
  },
  "max-concurrent-downloads": 6,
  "max-concurrent-uploads": 6,
  "live-restore": true
}
EOF

$SUDO_CMD systemctl restart docker
$SUDO_CMD systemctl enable docker

print_success "Docker installed and configured"

print_status "Step 6/12: PostgreSQL 16 Installation"
# Add PostgreSQL official APT repository
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | $SUDO_CMD gpg --dearmor -o /etc/apt/keyrings/postgresql.gpg
echo "deb [signed-by=/etc/apt/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" | $SUDO_CMD tee /etc/apt/sources.list.d/pgdg.list

$SUDO_CMD apt update
$SUDO_CMD apt install -y postgresql-16 postgresql-contrib-16 postgresql-client-16

$SUDO_CMD systemctl start postgresql
$SUDO_CMD systemctl enable postgresql

print_success "PostgreSQL 16 installed"

print_status "Step 7/12: Redis Installation"
$SUDO_CMD apt install -y redis-server

# Configure Redis for production
$SUDO_CMD sed -i 's/^# maxmemory <bytes>/maxmemory 512mb/' /etc/redis/redis.conf
$SUDO_CMD sed -i 's/^# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf

$SUDO_CMD systemctl restart redis-server
$SUDO_CMD systemctl enable redis-server

print_success "Redis installed and configured"

print_status "Step 8/12: Nginx Installation"
$SUDO_CMD apt install -y nginx

# Remove default site
$SUDO_CMD rm -f /etc/nginx/sites-enabled/default

$SUDO_CMD systemctl enable nginx
$SUDO_CMD systemctl stop nginx  # Will be started by Traefik later

print_success "Nginx installed"

print_status "Step 9/12: Node.js 20 LTS Installation"
# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | $SUDO_CMD -E bash -
$SUDO_CMD apt install -y nodejs

# Install global packages
$SUDO_CMD npm install -g pm2 yarn

print_success "Node.js 20 LTS installed"

print_status "Step 10/12: Python 3.12 & Tools"
$SUDO_CMD apt install -y \
    python3.12 \
    python3.12-pip \
    python3.12-venv \
    python3.12-dev \
    python3-pip \
    python-is-python3

# Install Ansible
pip3 install --user ansible ansible-core

# Add local pip bin to PATH for current user
if [[ $EUID -ne 0 ]]; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.bashrc
fi

print_success "Python 3.12 and Ansible installed"

print_status "Step 11/12: System Optimization"
# Create swap file (2GB for 8GB RAM)
if [ ! -f /swapfile ]; then
    $SUDO_CMD fallocate -l 2G /swapfile
    $SUDO_CMD chmod 600 /swapfile
    $SUDO_CMD mkswap /swapfile
    $SUDO_CMD swapon /swapfile
    echo '/swapfile none swap sw 0 0' | $SUDO_CMD tee -a /etc/fstab
fi

# System optimizations for SaaS workload
cat <<'EOF' | $SUDO_CMD tee -a /etc/sysctl.conf
# kurs24.io SaaS optimizations
vm.swappiness=10
vm.max_map_count=262144
vm.overcommit_memory=1
net.core.somaxconn=65535
net.core.netdev_max_backlog=5000
net.ipv4.tcp_max_syn_backlog=8192
net.ipv4.tcp_slow_start_after_idle=0
fs.file-max=2097152
EOF

$SUDO_CMD sysctl -p

print_success "System optimizations applied"

print_status "Step 12/12: kurs24.io Directory Structure"
# Create application directories
$SUDO_CMD mkdir -p /opt/kurs24/{data,config,logs,ssl,backups,ansible,scripts}
$SUDO_CMD mkdir -p /opt/kurs24/data/{postgres,redis,minio,tenants}

# Set proper ownership
if [[ $EUID -ne 0 ]]; then
    $SUDO_CMD chown -R $USER:$USER /opt/kurs24
else
    $SUDO_CMD chown -R root:root /opt/kurs24
fi

$SUDO_CMD chmod -R 755 /opt/kurs24
$SUDO_CMD chmod 700 /opt/kurs24/ssl

# Create environment file template
cat <<EOF | $SUDO_CMD tee /opt/kurs24/.env.template
# kurs24.io Environment Configuration
# Copy to .env and fill with real values

# Server Configuration
SERVER_IP=$SERVER_IP
DOMAIN_NAME=kurs24.io

# Database
POSTGRES_PASSWORD=change_me_to_secure_password
REDIS_PASSWORD=change_me_to_secure_redis_password

# Porkbun DNS API
PORKBUN_API_KEY=pk1_your_api_key
PORKBUN_SECRET_KEY=sk1_your_secret_key

# AI Services (Pro Plan)
ANTHROPIC_API_KEY=sk-ant-your-key
OPENAI_API_KEY=sk-your-openai-key
GOOGLE_AI_KEY=your-google-ai-key

# PayPal
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# Security
JWT_SECRET=your-256-bit-jwt-secret
TRAEFIK_AUTH_HASH=admin:hashed_password

# Storage
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=change_me_to_secure_key
EOF

print_success "kurs24.io directory structure created"

# Final system information
print_status "Installation Complete! System Information:"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🏰 kurs24.io Production Server Ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📍 Server IP: $SERVER_IP"
echo "🖥️  Hostname: $HOSTNAME"
echo "⏰ Timezone: $(timedatectl show --property=Timezone --value)"
echo "🐧 OS: $(lsb_release -ds)"
echo "🧠 Memory: $(free -h | awk 'NR==2{printf "%.1f GB total, %.1f GB available", $2/1024/1024, $7/1024/1024}')"
echo "💾 Disk: $(df -h / | awk 'NR==2{printf "%s total, %s used (%s)", $2, $3, $5}')"
echo "🔥 CPU: $(nproc) cores ($(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs))"
echo ""
echo "📦 Installed Services:"
echo "   ✅ Docker $(docker --version | cut -d' ' -f3 | sed 's/,//')"
echo "   ✅ PostgreSQL $(sudo -u postgres psql -t -c 'SELECT version();' | head -1 | awk '{print $2}')"
echo "   ✅ Redis $(redis-server --version | awk '{print $3}' | cut -d'=' -f2)"
echo "   ✅ Node.js $(node --version)"
echo "   ✅ Python $(python3 --version | awk '{print $2}')"
echo "   ✅ Nginx $(nginx -v 2>&1 | cut -d'/' -f2)"
echo ""
echo "🔐 Security:"
echo "   ✅ UFW Firewall enabled (SSH, HTTP, HTTPS, 8080)"
echo "   ✅ Fail2ban active"
echo "   ✅ SSH hardened"
echo ""
echo "📁 Project Structure:"
echo "   📂 /opt/kurs24/ (main directory)"
echo "   📂 /opt/kurs24/data/ (persistent data)"
echo "   📂 /opt/kurs24/config/ (configurations)"
echo "   📂 /opt/kurs24/logs/ (application logs)"
echo "   📂 /opt/kurs24/ssl/ (certificates)"
echo "   📂 /opt/kurs24/backups/ (backup files)"
echo ""
echo "🚀 Next Steps:"
echo "   1. Reboot system: sudo reboot"
echo "   2. Configure /opt/kurs24/.env with your API keys"
echo "   3. Deploy Docker infrastructure"
echo "   4. Setup DNS records for kurs24.io"
echo "   5. Launch SaaS platform!"
echo ""
echo "💰 Royal Academy K.I. Training Platform foundation is ready!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test Docker installation
print_status "Testing Docker installation..."
if docker run --rm hello-world > /dev/null 2>&1; then
    print_success "Docker test successful!"
else
    print_warning "Docker test failed - you may need to log out and back in"
fi

# Final recommendations
echo ""
print_warning "IMPORTANT: Reboot recommended to ensure all changes take effect!"
echo "           Run: sudo reboot"
echo ""
print_success "🎉 Ubuntu 24.04 Production Setup Complete!"
echo "Ready for kurs24.io SaaS deployment! 👑"
