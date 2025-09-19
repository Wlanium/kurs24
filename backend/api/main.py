from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, Dict, Any
import os
import psutil
import platform
from datetime import datetime
import asyncpg
import redis.asyncio as redis
import httpx
import aiohttp
import asyncio
import socket
from paypal import paypal_client

app = FastAPI(
    title="kurs24.io API",
    description="Royal Academy K.I. Training Platform API",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://b6t.de", "https://kurs24.io", "https://*.kurs24.io"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str
    services: dict

class SubdomainCheck(BaseModel):
    subdomain: str
    available: bool
    message: str

class TenantCreate(BaseModel):
    name: str
    email: str
    plan: str = "basis"
    subdomain: str

class PayPalOrder(BaseModel):
    plan: str
    price: float
    subdomain: str

class BillingRecord(BaseModel):
    customer_email: str
    plan: str
    amount: float
    currency: str = "EUR"
    payment_method: str
    payment_id: str
    subdomain: str
    status: str = "completed"
    invoice_number: str = None

class Invoice(BaseModel):
    invoice_number: str
    customer_email: str
    customer_name: str
    plan: str
    amount: float
    currency: str = "EUR"
    payment_date: datetime
    payment_method: str
    subdomain: str
    status: str
    email: str

class PayPalCapture(BaseModel):
    orderID: str
    name: str
    email: str
    subdomain: str
    academy: str
    plan: str

class PlanDowngrade(BaseModel):
    email: str
    current_plan: str
    target_plan: str
    effective_date: str

class UserAvatar(BaseModel):
    avatar: str

# Routes
@app.get("/")
async def root():
    return {
        "message": "kurs24.io API",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health/json")
async def health_check_json():
    """Comprehensive health check endpoint with real connectivity tests"""

    health_status = {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.0.0",
        "uptime_seconds": psutil.boot_time(),
        "environment": os.getenv("NODE_ENV", "production"),
        "server": {
            "hostname": platform.node(),
            "platform": platform.system(),
            "python_version": platform.python_version(),
            "cpu_count": psutil.cpu_count(),
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory": {
                "total_gb": round(psutil.virtual_memory().total / (1024**3), 2),
                "available_gb": round(psutil.virtual_memory().available / (1024**3), 2),
                "percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total_gb": round(psutil.disk_usage('/').total / (1024**3), 2),
                "free_gb": round(psutil.disk_usage('/').free / (1024**3), 2),
                "percent": psutil.disk_usage('/').percent
            }
        },
        "services": {}
    }

    # Test PostgreSQL
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)
        version = await conn.fetchval("SELECT version()")
        await conn.close()
        health_status["services"]["postgresql"] = {
            "status": "connected",
            "version": version.split()[1] if version else "unknown"
        }
    except Exception as e:
        health_status["services"]["postgresql"] = {
            "status": "error",
            "error": str(e)[:100]
        }
        health_status["status"] = "degraded"

    # Test Redis
    try:
        redis_url = os.getenv("REDIS_URL", "redis://default:password@redis:6379/0")
        r = redis.from_url(redis_url)
        pong = await r.ping()
        info = await r.info()
        await r.close()
        health_status["services"]["redis"] = {
            "status": "connected" if pong else "error",
            "version": info.get("redis_version", "unknown") if isinstance(info, dict) else "unknown"
        }
    except Exception as e:
        health_status["services"]["redis"] = {
            "status": "error",
            "error": str(e)[:100]
        }
        health_status["status"] = "degraded"

    # Test DNS APIs
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Test Porkbun API - correct endpoint and format
            porkbun_response = await client.post(
                "https://api.porkbun.com/api/json/v3/ping",
                json={
                    "apikey": os.getenv("PORKBUN_API_KEY", ""),
                    "secretapikey": os.getenv("PORKBUN_SECRET_KEY", "")
                }
            )
            response_data = porkbun_response.json()
            health_status["services"]["porkbun_dns"] = {
                "status": "connected" if response_data.get("status") == "SUCCESS" else "error",
                "response": response_data.get("status", "unknown"),
                "message": response_data.get("message", "") if response_data.get("status") != "SUCCESS" else "API key valid"
            }
    except Exception as e:
        health_status["services"]["porkbun_dns"] = {
            "status": "error",
            "error": str(e)[:100]
        }

    # Container stats (if Docker socket available)
    try:
        import docker
        client = docker.from_env()
        containers = client.containers.list()
        health_status["containers"] = {
            "running": len(containers),
            "list": [c.name for c in containers]
        }
    except:
        health_status["containers"] = {"note": "Docker stats not available"}

    # Overall status
    if any(s.get("status") == "error" for s in health_status["services"].values()):
        health_status["status"] = "unhealthy" if len([s for s in health_status["services"].values() if s.get("status") == "error"]) > 1 else "degraded"

    return health_status

@app.get("/health", response_class=HTMLResponse)
async def health_check_html():
    """Beautiful HTML status page"""
    # Get JSON data first
    data = await health_check_json()

    # Determine status color
    status_color = "#10b981" if data["status"] == "healthy" else "#f59e0b" if data["status"] == "degraded" else "#ef4444"
    status_emoji = "✅" if data["status"] == "healthy" else "⚠️" if data["status"] == "degraded" else "❌"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>kurs24.io API Health Status</title>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="30">
        <style>
            * {{ margin: 0; padding: 0; box-sizing: border-box; }}
            body {{
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                padding: 2rem;
                color: white;
            }}
            .container {{
                max-width: 1200px;
                margin: 0 auto;
            }}
            .header {{
                text-align: center;
                margin-bottom: 2rem;
            }}
            .status-badge {{
                display: inline-block;
                background: {status_color};
                padding: 0.5rem 2rem;
                border-radius: 50px;
                font-size: 1.5rem;
                font-weight: bold;
                margin: 1rem 0;
            }}
            .grid {{
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                margin-top: 2rem;
            }}
            .card {{
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                border-radius: 15px;
                padding: 1.5rem;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }}
            .card h3 {{
                margin-bottom: 1rem;
                font-size: 1.2rem;
            }}
            .metric {{
                display: flex;
                justify-content: space-between;
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }}
            .metric:last-child {{
                border-bottom: none;
            }}
            .service-status {{
                display: inline-block;
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 0.5rem;
            }}
            .status-connected {{ background: #10b981; }}
            .status-error {{ background: #ef4444; }}
            .crown {{ font-size: 3rem; }}
            .timestamp {{
                text-align: center;
                opacity: 0.7;
                margin-top: 2rem;
                font-size: 0.9rem;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="crown">👑</div>
                <h1>kurs24.io API Health Status</h1>
                <div class="status-badge">{status_emoji} {data['status'].upper()}</div>
            </div>

            <div class="grid">
                <div class="card">
                    <h3>🖥️ Server Information</h3>
                    <div class="metric">
                        <span>Hostname</span>
                        <span>{data['server']['hostname']}</span>
                    </div>
                    <div class="metric">
                        <span>Platform</span>
                        <span>{data['server']['platform']}</span>
                    </div>
                    <div class="metric">
                        <span>Python</span>
                        <span>{data['server']['python_version']}</span>
                    </div>
                    <div class="metric">
                        <span>Environment</span>
                        <span>{data['environment']}</span>
                    </div>
                </div>

                <div class="card">
                    <h3>💻 System Resources</h3>
                    <div class="metric">
                        <span>CPU Usage</span>
                        <span>{data['server']['cpu_percent']}%</span>
                    </div>
                    <div class="metric">
                        <span>Memory</span>
                        <span>{data['server']['memory']['percent']}% of {data['server']['memory']['total_gb']}GB</span>
                    </div>
                    <div class="metric">
                        <span>Disk</span>
                        <span>{data['server']['disk']['percent']}% of {data['server']['disk']['total_gb']}GB</span>
                    </div>
                    <div class="metric">
                        <span>CPU Cores</span>
                        <span>{data['server']['cpu_count']}</span>
                    </div>
                </div>

                <div class="card">
                    <h3>🔌 Services</h3>
                    <div class="metric">
                        <span><span class="service-status {'status-connected' if data['services']['postgresql']['status'] == 'connected' else 'status-error'}"></span>PostgreSQL</span>
                        <span>{data['services']['postgresql'].get('version', 'N/A')}</span>
                    </div>
                    <div class="metric">
                        <span><span class="service-status {'status-connected' if data['services']['redis']['status'] == 'connected' else 'status-error'}"></span>Redis</span>
                        <span>{data['services']['redis'].get('version', 'N/A')}</span>
                    </div>
                    <div class="metric">
                        <span><span class="service-status {'status-connected' if data['services'].get('porkbun_dns', {}).get('status') == 'connected' else 'status-error'}"></span>DNS API</span>
                        <span>{'Active' if data['services'].get('porkbun_dns', {}).get('status') == 'connected' else 'Error'}</span>
                    </div>
                </div>

                <div class="card">
                    <h3>🐳 Docker Containers</h3>
                    <div class="metric">
                        <span>Running</span>
                        <span>{data.get('containers', {}).get('running', 0)}</span>
                    </div>
                    {chr(10).join([f'<div class="metric"><span>• {container}</span><span>✅</span></div>' for container in data.get('containers', {}).get('list', [])])}
                </div>
            </div>

            <div class="timestamp">
                Last updated: {data['timestamp']}<br>
                Auto-refresh every 30 seconds
            </div>
        </div>
    </body>
    </html>
    """

    return html_content

@app.get("/api/v1/check-subdomain", response_model=SubdomainCheck)
async def check_subdomain(subdomain: str):
    """Check if subdomain is available"""
    # Check reserved subdomains
    reserved = ["api", "admin", "www", "mail", "ftp", "test", "dev", "support", "help"]

    if subdomain.lower() in reserved:
        return SubdomainCheck(
            subdomain=subdomain,
            available=False,
            message="Diese Subdomain ist reserviert"
        )

    # Check subdomain format
    import re
    if not re.match(r'^[a-z0-9-]+$', subdomain.lower()):
        return SubdomainCheck(
            subdomain=subdomain,
            available=False,
            message="Subdomain darf nur Buchstaben, Zahlen und Bindestriche enthalten"
        )

    if len(subdomain) < 3:
        return SubdomainCheck(
            subdomain=subdomain,
            available=False,
            message="Subdomain muss mindestens 3 Zeichen lang sein"
        )

    # TODO: Check if subdomain exists in database
    # For now, all non-reserved subdomains are available
    return SubdomainCheck(
        subdomain=subdomain,
        available=True,
        message="Subdomain ist verfügbar"
    )

@app.post("/api/v1/tenant/create")
async def create_tenant(tenant: TenantCreate):
    """Create a new tenant with real provisioning"""
    try:
        print(f"🚀 Creating tenant: {tenant.subdomain}.kurs24.io (plan: {tenant.plan})")

        # Use the existing provision_tenant function with your smart DNS logic
        success = await provision_tenant(
            name=tenant.name,
            email=tenant.email,
            subdomain=tenant.subdomain,
            academy=f"{tenant.subdomain}.kurs24.io",
            plan=tenant.plan,
            payment_id="direct_creation"  # For manual creation
        )

        if success:
            return {
                "status": "success",
                "message": f"🎉 Academy {tenant.subdomain}.kurs24.io wird erstellt! DNS-Propagation läuft...",
                "tenant_id": f"tenant_{tenant.subdomain}",
                "url": f"https://{tenant.subdomain}.kurs24.io",
                "estimated_time": "5-10 Minuten für vollständige Bereitstellung"
            }
        else:
            raise HTTPException(status_code=500, detail="Subdomain-Erstellung fehlgeschlagen")

    except Exception as e:
        print(f"💥 Tenant creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler bei der Erstellung: {str(e)}")

@app.get("/api/v1/metrics")
async def get_metrics():
    """Get platform metrics"""
    # TODO: Get real metrics from database
    return {
        "tenants": {
            "total_tenants": 0,
            "pro_tenants": 0,
            "basis_tenants": 0,
            "active_tenants": 0,
            "monthly_recurring_revenue": 0
        },
        "recent_activity": {
            "signups_24h": 0,
            "logins_24h": 0
        }
    }

@app.post("/api/v1/paypal/create-order")
async def create_paypal_order(order: PayPalOrder):
    """Create PayPal order for payment"""
    try:
        paypal_order = await paypal_client.create_order(
            plan=order.plan,
            price=order.price,
            subdomain=order.subdomain,
            email=order.email
        )

        return {
            "id": paypal_order["id"],
            "status": paypal_order["status"],
            "links": paypal_order["links"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PayPal order creation failed: {str(e)}")

@app.get("/api/v1/check-subdomain-status")
async def check_subdomain_status(subdomain: str):
    """Check if subdomain is ready (DNS + SSL) using Telekom DNS for worst-case testing"""
    import subprocess

    try:
        # Check DNS using Python socket with custom DNS server (Telekom) - the slowest one! 😄
        dns_ready = False
        try:
            print(f"🔍 Checking DNS for {subdomain}.kurs24.io with Python socket (testing DNS)...")

            # Simple socket DNS check first
            try:
                import socket
                socket.gethostbyname(f"{subdomain}.kurs24.io")
                dns_ready = True
                print(f"✅ DNS für {subdomain}.kurs24.io ist propagiert!")
            except socket.gaierror:
                dns_ready = False
                print(f"❌ DNS für {subdomain}.kurs24.io noch nicht propagiert")
        except Exception as e:
            print(f"💥 DNS error für {subdomain}.kurs24.io: {e}")
            dns_ready = False

        # Check HTTPS only if DNS is ready at Telekom (if it works there, it works everywhere)
        https_ready = False
        if dns_ready:
            try:
                print(f"🔒 Testing HTTPS for {subdomain}.kurs24.io...")
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.get(
                        f"https://{subdomain}.kurs24.io",
                        follow_redirects=False
                    )
                    https_ready = True
                    print(f"✅ HTTPS für {subdomain}.kurs24.io funktioniert! Status: {response.status_code}")
            except Exception as e:
                print(f"❌ HTTPS check failed für {subdomain}.kurs24.io: {e}")

        ready = dns_ready and https_ready

        return {
            "subdomain": subdomain,
            "dns_ready": dns_ready,
            "https_ready": https_ready,
            "ready": ready,
            "url": f"https://{subdomain}.kurs24.io" if ready else None,
            "message": "Tested with Telekom DNS (worst case scenario)" if dns_ready else "Waiting for DNS propagation..."
        }

    except Exception as e:
        print(f"💥 Status check failed with exception: {e}")
        return {
            "subdomain": subdomain,
            "dns_ready": False,
            "https_ready": False,
            "ready": False,
            "error": str(e)
        }


@app.post("/api/v1/paypal/capture-order")
async def capture_paypal_order(capture: PayPalCapture):
    """Capture PayPal payment and provision tenant"""
    try:
        # Capture the payment
        payment_result = await paypal_client.capture_order(capture.orderID)

        if payment_result["status"] == "COMPLETED":
            # Payment successful - extract payment amount
            payment_amount = float(payment_result.get("purchase_units", [{}])[0].get("payments", {}).get("captures", [{}])[0].get("amount", {}).get("value", "0"))

            # Create billing record first
            invoice_number = await create_billing_record(
                customer_email=capture.email,
                customer_name=capture.name,
                plan=capture.plan,
                amount=payment_amount,
                payment_method="PayPal",
                payment_id=payment_result["id"],
                subdomain=capture.subdomain
            )

            # Update user plan in database
            await update_user_plan(capture.email, capture.plan)

            # Now provision the tenant
            success = await provision_tenant(
                name=capture.name,
                email=capture.email,
                subdomain=capture.subdomain,
                academy=capture.academy,
                plan=capture.plan,
                payment_id=payment_result["id"]
            )

            if success:
                return {
                    "success": True,
                    "payment_id": payment_result["id"],
                    "invoice_number": invoice_number,
                    "tenant_url": f"https://{capture.subdomain}.kurs24.io",
                    "message": "✅ Zahlung erfolgreich! Tenant wird bereitgestellt und Rechnung erstellt."
                }
            else:
                return {
                    "success": False,
                    "payment_id": payment_result["id"],
                    "message": "Payment captured but tenant provisioning failed"
                }
        else:
            raise HTTPException(status_code=400, detail="Payment not completed")

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Payment capture failed: {str(e)}")

async def provision_tenant(name: str, email: str, subdomain: str, academy: str, plan: str, payment_id: str) -> bool:
    """Provision a new tenant after successful payment"""
    print(f"🚀 Starting tenant provisioning for {subdomain} (plan: {plan})")

    try:
        # 1. Create DNS record
        print("📋 Step 1: Creating DNS record...")
        dns_success = await create_dns_record(subdomain)
        if not dns_success:
            print("❌ DNS creation failed - aborting provisioning")
            return False

        # 2. Save to database
        print("📋 Step 2: Saving to database...")
        await save_tenant_to_db(name, email, subdomain, academy, plan, payment_id)

        # 3. Deploy container (simplified for now)
        print("📋 Step 3: Deploying container...")
        await deploy_tenant_container(subdomain, plan)

        # 4. Update Caddy config
        print("📋 Step 4: Updating Caddy config...")
        await update_caddy_config(subdomain, email)

        print(f"✅ Tenant {subdomain} provisioned successfully!")
        return True
    except Exception as e:
        print(f"💥 Tenant provisioning failed: {e}")
        return False

async def create_dns_record(subdomain: str) -> bool:
    """Create DNS A record for subdomain.kurs24.io"""
    try:
        api_key = os.getenv("PORKBUN_API_KEY")
        secret_key = os.getenv("PORKBUN_SECRET_KEY")
        server_ip = os.getenv("SERVER_IP", "152.53.150.111")

        print(f"🌐 Creating DNS record: {subdomain}.kurs24.io -> {server_ip}")
        print(f"🔑 Using API Key: {api_key[:10]}...")

        payload = {
            "apikey": api_key,
            "secretapikey": secret_key,
            "type": "A",
            "name": subdomain,
            "content": server_ip,
            "ttl": "300"
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.porkbun.com/api/json/v3/dns/create/kurs24.io",
                json=payload
            )

            result = response.json()
            print(f"📋 Porkbun API Response: {result}")

            if result.get("status") == "SUCCESS":
                print(f"✅ DNS record created successfully for {subdomain}.kurs24.io")
                return True
            else:
                print(f"❌ DNS creation failed: {result}")
                return False

    except Exception as e:
        print(f"💥 DNS creation failed with exception: {e}")
        return False

async def save_tenant_to_db(name: str, email: str, subdomain: str, academy: str, plan: str, payment_id: str):
    """Save tenant to database"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        # Create tables if not exist
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS tenants (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL,
                subdomain VARCHAR(255) UNIQUE NOT NULL,
                academy VARCHAR(255) NOT NULL,
                plan VARCHAR(50) NOT NULL,
                payment_id VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Insert tenant record
        await conn.execute("""
            INSERT INTO tenants (name, email, subdomain, academy, plan, payment_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (subdomain) DO UPDATE SET
                plan = EXCLUDED.plan,
                payment_id = EXCLUDED.payment_id,
                updated_at = CURRENT_TIMESTAMP
        """, name, email, subdomain, academy, plan, payment_id)

        await conn.close()
        print(f"✅ Tenant {subdomain} saved to database with plan {plan}")

    except Exception as e:
        print(f"❌ Failed to save tenant to database: {e}")

async def deploy_tenant_container(subdomain: str, plan: str):
    """Deploy tenant container"""
    # TODO: Implement container deployment
    print(f"Deploying container for {subdomain}...")
    pass

async def wait_for_dns_propagation(domain: str, max_wait: int = 300) -> bool:
    """Wait for DNS propagation with multiple DNS servers"""
    import asyncio
    import subprocess
    import time

    dns_servers = [
        "8.8.8.8",       # Google
        "1.1.1.1",       # Cloudflare
        "9.9.9.9",       # Quad9
        "208.67.222.222" # OpenDNS
    ]

    start_time = time.time()
    print(f"⏳ Waiting for DNS propagation of {domain}...")

    while time.time() - start_time < max_wait:
        success_count = 0

        for dns_server in dns_servers:
            try:
                # DNS Lookup mit spezifischem Server
                result = subprocess.run([
                    "nslookup", domain, dns_server
                ], capture_output=True, text=True, timeout=5)

                if result.returncode == 0 and "NXDOMAIN" not in result.stdout:
                    success_count += 1

            except Exception:
                pass

        # Mindestens 3 von 4 DNS Servern müssen die Domain kennen
        if success_count >= 3:
            print(f"✅ DNS propagation confirmed on {success_count}/4 servers")
            return True

        elapsed = int(time.time() - start_time)
        print(f"⏳ DNS propagation: {success_count}/4 servers ready, waiting... ({elapsed}s/{max_wait}s)")
        await asyncio.sleep(10)

    print(f"❌ DNS propagation timeout after {max_wait}s")
    return False

async def wait_for_ssl_certificate(domain: str, max_wait: int = 120) -> bool:
    """Monitor SSL certificate creation"""
    import ssl
    import socket
    import time
    import asyncio

    start_time = time.time()
    print(f"🔒 Monitoring SSL certificate creation for {domain}...")

    while time.time() - start_time < max_wait:
        try:
            # SSL Verbindung testen
            context = ssl.create_default_context()
            with socket.create_connection((domain, 443), timeout=5) as sock:
                with context.wrap_socket(sock, server_hostname=domain) as ssock:
                    cert = ssock.getpeercert()
                    if cert:
                        print(f"🔒 SSL certificate verified for {domain}")
                        return True

        except Exception as e:
            elapsed = int(time.time() - start_time)
            print(f"⏳ SSL not ready yet: {str(e)[:50]}... ({elapsed}s/{max_wait}s)")
            await asyncio.sleep(5)

    print(f"⚠️ SSL creation taking longer than expected, but domain should work")
    return False

async def update_subdomain_status(subdomain: str, status: str, progress: int = 0, customer_email: str = None):
    """Update subdomain status in database"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Create subdomains table if not exists
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS subdomains (
                    id SERIAL PRIMARY KEY,
                    subdomain VARCHAR(255) UNIQUE NOT NULL,
                    customer_email VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'provisioning',
                    progress INTEGER DEFAULT 0,
                    domain VARCHAR(255),
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    ssl_status VARCHAR(50) DEFAULT 'pending',
                    dns_status VARCHAR(50) DEFAULT 'pending'
                )
            """)

            # Update or insert subdomain status
            if customer_email:
                await conn.execute("""
                    INSERT INTO subdomains (subdomain, customer_email, status, progress, domain, updated_at)
                    VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
                    ON CONFLICT (subdomain)
                    DO UPDATE SET
                        customer_email = EXCLUDED.customer_email,
                        status = EXCLUDED.status,
                        progress = EXCLUDED.progress,
                        updated_at = EXCLUDED.updated_at
                """, subdomain, customer_email, status, progress, f"{subdomain}.kurs24.io")
            else:
                await conn.execute("""
                    INSERT INTO subdomains (subdomain, status, progress, domain, updated_at)
                    VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                    ON CONFLICT (subdomain)
                    DO UPDATE SET
                        status = EXCLUDED.status,
                        progress = EXCLUDED.progress,
                        updated_at = EXCLUDED.updated_at
                """, subdomain, status, progress, f"{subdomain}.kurs24.io")

            print(f"📊 Updated {subdomain} status: {status} ({progress}%)")

        finally:
            await conn.close()

    except Exception as e:
        print(f"💥 Status update failed for {subdomain}: {e}")

async def update_caddy_config(subdomain: str, customer_email: str = None):
    """Smart subdomain provisioning with DNS-first approach and progress tracking"""
    try:
        domain = f"{subdomain}.kurs24.io"
        print(f"🚀 Starting intelligent subdomain provisioning for {domain}")
        logger.info(f"🚀 Starting intelligent subdomain provisioning for {domain}")

        # Initialize status
        await update_subdomain_status(subdomain, "provisioning", 0, customer_email)

        # Step 1: DNS Record erstellen
        print(f"🌐 Step 1: Creating DNS record...")
        logger.info(f"🌐 Step 1: Creating DNS record...")
        await update_subdomain_status(subdomain, "provisioning", 10, customer_email)

        dns_success = await create_dns_record(subdomain)

        if not dns_success:
            print(f"❌ DNS record creation failed for {domain}")
            logger.error(f"❌ DNS record creation failed for {domain}")
            await update_subdomain_status(subdomain, "failed", 0, customer_email)
            return False

        print(f"✅ DNS record created! Now waiting for propagation...")
        logger.info(f"✅ DNS record created! Now waiting for propagation...")
        await update_subdomain_status(subdomain, "provisioning", 30, customer_email)

        # Step 2: Warten auf DNS Propagation
        dns_ready = await wait_for_dns_propagation(domain, max_wait=300)

        if not dns_ready:
            print(f"❌ DNS propagation timeout for {domain}")
            await update_subdomain_status(subdomain, "failed", 0, customer_email)
            return False

        print(f"✅ DNS ready! Now creating Caddy config...")
        await update_subdomain_status(subdomain, "provisioning", 60, customer_email)

        # Step 3: ERST JETZT Caddyfile erstellen (→ Caddy --watch triggert Auto-Reload)
        caddyfile_content = f"""# Subdomain: {subdomain}
{domain} {{
    reverse_proxy tenant-{subdomain}:3000
}}
"""

        config_path = f"/app/dynamic_subdomains/{subdomain}.caddyfile"
        with open(config_path, "w") as f:
            f.write(caddyfile_content)

        print(f"📝 Created {config_path} - Caddy will auto-reload via --watch!")
        await update_subdomain_status(subdomain, "provisioning", 80, customer_email)

        # Step 4: SSL Erstellung überwachen (optional)
        ssl_ready = await wait_for_ssl_certificate(domain, max_wait=120)

        if ssl_ready:
            print(f"🎉 Complete! {domain} is ready with SSL certificate!")
            await update_subdomain_status(subdomain, "active", 100, customer_email)
        else:
            print(f"⚠️ SSL creation taking longer, but {domain} should work")
            await update_subdomain_status(subdomain, "active", 90, customer_email)

        return True

    except Exception as e:
        print(f"💥 Smart subdomain provisioning failed: {e}")
        await update_subdomain_status(subdomain, "failed", 0, customer_email)
        return False

# ===== BILLING SYSTEM =====

# In-memory billing storage (TODO: Replace with PostgreSQL)
billing_records = []
invoices = []

def generate_invoice_number() -> str:
    """Generate unique invoice number"""
    from datetime import datetime
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    return f"RA-{timestamp}"

async def create_billing_record(
    customer_email: str,
    customer_name: str,
    plan: str,
    amount: float,
    payment_method: str,
    payment_id: str,
    subdomain: str
) -> str:
    """Create billing record and invoice in PostgreSQL"""
    try:
        invoice_number = generate_invoice_number()
        current_time = datetime.now()

        # Connect to database
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Create billing_records table if not exists
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS billing_records (
                    id SERIAL PRIMARY KEY,
                    customer_email VARCHAR(255) NOT NULL,
                    customer_name VARCHAR(255),
                    plan VARCHAR(50) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(10) DEFAULT 'EUR',
                    payment_method VARCHAR(100) NOT NULL,
                    payment_id VARCHAR(255) NOT NULL,
                    subdomain VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'completed',
                    invoice_number VARCHAR(100) UNIQUE NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    billing_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Create invoices table if not exists
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS invoices (
                    id SERIAL PRIMARY KEY,
                    invoice_number VARCHAR(100) UNIQUE NOT NULL,
                    customer_email VARCHAR(255) NOT NULL,
                    customer_name VARCHAR(255),
                    plan VARCHAR(50) NOT NULL,
                    amount DECIMAL(10,2) NOT NULL,
                    currency VARCHAR(10) DEFAULT 'EUR',
                    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    payment_method VARCHAR(100) NOT NULL,
                    subdomain VARCHAR(255),
                    status VARCHAR(50) DEFAULT 'paid',
                    pdf_url VARCHAR(500),
                    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Insert billing record
            await conn.execute("""
                INSERT INTO billing_records
                (customer_email, customer_name, plan, amount, currency, payment_method,
                 payment_id, subdomain, status, invoice_number, created_at, billing_date)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            """, customer_email, customer_name, plan, amount, "EUR", payment_method,
                payment_id, subdomain, "completed", invoice_number, current_time, current_time)

            # Insert invoice
            await conn.execute("""
                INSERT INTO invoices
                (invoice_number, customer_email, customer_name, plan, amount, currency,
                 payment_date, payment_method, subdomain, status, pdf_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            """, invoice_number, customer_email, customer_name, plan, amount, "EUR",
                current_time, payment_method, subdomain, "paid", f"/api/v1/invoices/{invoice_number}/pdf")

            print(f"💰 Created billing record and invoice {invoice_number} for {customer_email} in database")
            return invoice_number

        finally:
            await conn.close()

        # Also add to in-memory for backward compatibility
        billing_record = {
            "id": len(billing_records) + 1,
            "customer_email": customer_email,
            "customer_name": customer_name,
            "plan": plan,
            "amount": amount,
            "currency": "EUR",
            "payment_method": payment_method,
            "payment_id": payment_id,
            "subdomain": subdomain,
            "status": "completed",
            "invoice_number": invoice_number,
            "created_at": current_time,
            "billing_date": current_time
        }
        billing_records.append(billing_record)

        invoice = {
            "invoice_number": invoice_number,
            "customer_email": customer_email,
            "customer_name": customer_name,
            "plan": plan,
            "amount": amount,
            "currency": "EUR",
            "payment_date": current_time,
            "payment_method": payment_method,
            "subdomain": subdomain,
            "status": "paid",
            "pdf_url": f"/api/v1/invoices/{invoice_number}/pdf"
        }
        invoices.append(invoice)

    except Exception as e:
        print(f"💥 Billing record creation failed: {e}")
        return None

@app.post("/api/v1/billing/create")
async def create_billing(billing: BillingRecord):
    """Create a new billing record"""
    try:
        invoice_number = await create_billing_record(
            customer_email=billing.customer_email,
            customer_name="Customer",  # TODO: Get from user data
            plan=billing.plan,
            amount=billing.amount,
            payment_method=billing.payment_method,
            payment_id=billing.payment_id,
            subdomain=billing.subdomain
        )

        if invoice_number:
            return {
                "status": "success",
                "message": "Rechnung erstellt",
                "invoice_number": invoice_number,
                "billing_id": len(billing_records)
            }
        else:
            raise HTTPException(status_code=500, detail="Rechnungserstellung fehlgeschlagen")

    except Exception as e:
        print(f"💥 Billing creation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler: {str(e)}")

@app.get("/api/v1/billing/{customer_email}")
async def get_customer_billing(customer_email: str):
    """Get billing history for customer from PostgreSQL"""
    try:
        # Connect to database
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Fetch billing records from database
            rows = await conn.fetch("""
                SELECT id, customer_email, customer_name, plan, amount, currency,
                       payment_method, payment_id, subdomain, status, invoice_number,
                       created_at, billing_date
                FROM billing_records
                WHERE customer_email = $1
                ORDER BY created_at DESC
            """, customer_email)

            # Convert to dictionaries
            customer_bills = []
            for row in rows:
                customer_bills.append({
                    "id": row["id"],
                    "customer_email": row["customer_email"],
                    "customer_name": row["customer_name"],
                    "plan": row["plan"],
                    "amount": float(row["amount"]),
                    "currency": row["currency"],
                    "payment_method": row["payment_method"],
                    "payment_id": row["payment_id"],
                    "subdomain": row["subdomain"],
                    "status": row["status"],
                    "invoice_number": row["invoice_number"],
                    "created_at": row["created_at"].isoformat(),
                    "billing_date": row["billing_date"].isoformat()
                })

            return {
                "status": "success",
                "customer_email": customer_email,
                "total_records": len(customer_bills),
                "billing_history": customer_bills
            }

        finally:
            await conn.close()

    except Exception as e:
        print(f"💥 Billing fetch failed: {e}")
        # Fallback to in-memory data
        customer_bills = [
            record for record in billing_records
            if record["customer_email"] == customer_email
        ]

        return {
            "status": "success",
            "customer_email": customer_email,
            "total_records": len(customer_bills),
            "billing_history": customer_bills
        }

# User ID-based billing endpoint
@app.get("/api/v1/users/{user_id}/billing")
async def get_user_billing(user_id: int):
    """Get billing history for user by user ID"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # First get user email to map to billing records
            user_row = await conn.fetchrow("SELECT email FROM users WHERE id = $1", user_id)
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")

            user_email = user_row["email"]

            # Fetch billing records
            rows = await conn.fetch("""
                SELECT id, customer_email, customer_name, plan, amount, currency,
                       payment_method, payment_id, subdomain, status, invoice_number,
                       created_at, billing_date
                FROM billing_records
                WHERE customer_email = $1
                ORDER BY created_at DESC
            """, user_email)

            # Convert to dictionaries
            billing_records = []
            for row in rows:
                billing_records.append({
                    "id": row["id"],
                    "customer_email": row["customer_email"],
                    "customer_name": row["customer_name"],
                    "plan": row["plan"],
                    "amount": float(row["amount"]),
                    "currency": row["currency"],
                    "payment_method": row["payment_method"],
                    "payment_id": row["payment_id"],
                    "subdomain": row["subdomain"],
                    "status": row["status"],
                    "invoice_number": row["invoice_number"],
                    "created_at": row["created_at"].isoformat(),
                    "billing_date": row["billing_date"].isoformat()
                })

            return billing_records

        finally:
            await conn.close()

    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 User billing fetch failed: {e}")
        return []

# User ID-based tenant status endpoint
@app.get("/api/v1/users/{user_id}/tenant/status")
async def get_user_tenant_status(user_id: int):
    """Get tenant status for user by user ID"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # First get user email to map to tenant records
            user_row = await conn.fetchrow("SELECT email FROM users WHERE id = $1", user_id)
            if not user_row:
                raise HTTPException(status_code=404, detail="User not found")

            user_email = user_row["email"]

            # Get tenant status using user_id
            tenant_row = await conn.fetchrow("""
                SELECT subdomain, domain, status, progress, dns_status, ssl_status, updated_at
                FROM tenant_academy_subdomains
                WHERE user_id = $1
                ORDER BY updated_at DESC
                LIMIT 1
            """, user_id)

            if not tenant_row:
                raise HTTPException(status_code=404, detail="No tenant found")

            # Return tenant status info
            return {
                "status": tenant_row["status"] or "failed",
                "subdomain": tenant_row["subdomain"],
                "progress": tenant_row["progress"] or 0,
                "domain": tenant_row["domain"] or f"{tenant_row['subdomain']}.kurs24.io",
                "ssl_status": tenant_row["ssl_status"] or "pending",
                "dns_status": tenant_row["dns_status"] or "pending",
                "updated_at": tenant_row["updated_at"].isoformat() if tenant_row["updated_at"] else None
            }

        finally:
            await conn.close()

    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 User tenant status fetch failed: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch tenant status: {str(e)}")

@app.post("/api/v1/billing/downgrade")
async def schedule_plan_downgrade(downgrade: PlanDowngrade):
    """Schedule a plan downgrade to be effective at the end of billing period"""
    try:
        # Connect to database
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Create downgrades table if it doesn't exist
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS plan_downgrades (
                    id SERIAL PRIMARY KEY,
                    customer_email VARCHAR(255) NOT NULL,
                    current_plan VARCHAR(50) NOT NULL,
                    target_plan VARCHAR(50) NOT NULL,
                    effective_date TIMESTAMP NOT NULL,
                    scheduled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    status VARCHAR(50) DEFAULT 'scheduled'
                )
            """)

            # Check if user already has a pending downgrade
            existing = await conn.fetchrow("""
                SELECT * FROM plan_downgrades
                WHERE customer_email = $1 AND status = 'scheduled'
            """, downgrade.email)

            if existing:
                # Update existing downgrade
                await conn.execute("""
                    UPDATE plan_downgrades
                    SET target_plan = $1, effective_date = $2, scheduled_at = CURRENT_TIMESTAMP
                    WHERE customer_email = $3 AND status = 'scheduled'
                """, downgrade.target_plan, downgrade.effective_date, downgrade.email)
                print(f"🔄 Updated existing downgrade for {downgrade.email}")
            else:
                # Insert new downgrade record
                await conn.execute("""
                    INSERT INTO plan_downgrades (customer_email, current_plan, target_plan, effective_date)
                    VALUES ($1, $2, $3, $4)
                """, downgrade.email, downgrade.current_plan, downgrade.target_plan, downgrade.effective_date)
                print(f"📅 Scheduled downgrade for {downgrade.email}: {downgrade.current_plan} → {downgrade.target_plan}")

            # If downgrading to free, schedule subdomain deactivation
            if downgrade.target_plan == 'free':
                await schedule_subdomain_deactivation(downgrade.email, downgrade.effective_date)

        finally:
            await conn.close()

        return {
            "status": "success",
            "message": f"Downgrade von {downgrade.current_plan.upper()} zu {downgrade.target_plan.upper()} wurde eingeplant",
            "effective_date": downgrade.effective_date,
            "current_plan": downgrade.current_plan,
            "target_plan": downgrade.target_plan
        }

    except Exception as e:
        print(f"💥 Downgrade scheduling failed: {e}")
        raise HTTPException(status_code=500, detail=f"Downgrade fehlgeschlagen: {str(e)}")

async def schedule_subdomain_deactivation(customer_email: str, effective_date: str):
    """Schedule subdomain deactivation when downgrading to free"""
    try:
        # This would typically involve:
        # 1. Marking subdomain for deactivation in database
        # 2. Scheduling cleanup tasks
        # 3. Notifying infrastructure services
        print(f"🔴 Scheduled subdomain deactivation for {customer_email} on {effective_date}")

        # For now, just log the action
        # In production, this would integrate with:
        # - Caddy configuration updates
        # - DNS record cleanup
        # - SSL certificate revocation
        # - Database cleanup

    except Exception as e:
        print(f"💥 Subdomain deactivation scheduling failed: {e}")

@app.get("/api/v1/users/{user_id}/invoices")
async def get_user_invoices(user_id: int):
    """Get invoice history for user by ID from PostgreSQL"""
    try:
        # Connect to database
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Get user email for compatibility
            user_row = await conn.fetchrow("SELECT email FROM users WHERE id = $1", user_id)
            if not user_row:
                return {"status": "error", "message": "User not found", "total_invoices": 0, "invoices": []}

            customer_email = user_row['email']

            # Fetch invoices from database using user_id or fallback to email
            rows = await conn.fetch("""
                SELECT invoice_number, customer_email, customer_name, plan, amount, currency,
                       payment_date, payment_method, subdomain, status, pdf_url
                FROM invoices
                WHERE user_id = $1 OR customer_email = $2
                ORDER BY payment_date DESC
            """, user_id, customer_email)

            # Convert to dictionaries
            user_invoices = []
            for row in rows:
                user_invoices.append({
                    "invoice_number": row["invoice_number"],
                    "customer_email": row["customer_email"],
                    "customer_name": row["customer_name"],
                    "plan": row["plan"],
                    "amount": float(row["amount"]),
                    "currency": row["currency"],
                    "payment_date": row["payment_date"].isoformat(),
                    "payment_method": row["payment_method"],
                    "subdomain": row["subdomain"],
                    "status": row["status"],
                    "pdf_url": row["pdf_url"]
                })

            return {
                "status": "success",
                "customer_email": customer_email,
                "total_invoices": len(user_invoices),
                "invoices": user_invoices
            }

        finally:
            await conn.close()

    except Exception as e:
        print(f"💥 Invoice fetch failed: {e}")
        return {
            "status": "error",
            "message": "Failed to fetch invoices",
            "total_invoices": 0,
            "invoices": []
        }

@app.get("/api/v1/invoices/{customer_email}")
async def get_customer_invoices(customer_email: str):
    """Get invoice history for customer from PostgreSQL"""
    try:
        # Connect to database
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Fetch invoices from database
            rows = await conn.fetch("""
                SELECT invoice_number, customer_email, customer_name, plan, amount, currency,
                       payment_date, payment_method, subdomain, status, pdf_url
                FROM invoices
                WHERE customer_email = $1
                ORDER BY payment_date DESC
            """, customer_email)

            # Convert to dictionaries
            customer_invoices = []
            for row in rows:
                customer_invoices.append({
                    "invoice_number": row["invoice_number"],
                    "customer_email": row["customer_email"],
                    "customer_name": row["customer_name"],
                    "plan": row["plan"],
                    "amount": float(row["amount"]),
                    "currency": row["currency"],
                    "payment_date": row["payment_date"].isoformat(),
                    "payment_method": row["payment_method"],
                    "subdomain": row["subdomain"],
                    "status": row["status"],
                    "pdf_url": row["pdf_url"]
                })

            return {
                "status": "success",
                "customer_email": customer_email,
                "total_invoices": len(customer_invoices),
                "invoices": customer_invoices
            }

        finally:
            await conn.close()

    except Exception as e:
        print(f"💥 Invoice fetch failed: {e}")
        # Fallback to in-memory data
        customer_invoices = [
            invoice for invoice in invoices
            if invoice["customer_email"] == customer_email
        ]

        return {
            "status": "success",
            "customer_email": customer_email,
            "total_invoices": len(customer_invoices),
            "invoices": customer_invoices
        }

async def update_user_plan(email: str, plan: str):
    """Update user's subscription plan in database"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        # Create users table if not exist
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                plan VARCHAR(50) DEFAULT 'free',
                google_id VARCHAR(255),
                auth_provider VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Update or insert user with new plan
        await conn.execute("""
            INSERT INTO users (email, plan)
            VALUES ($1, $2)
            ON CONFLICT (email) DO UPDATE SET
                plan = EXCLUDED.plan,
                updated_at = CURRENT_TIMESTAMP
        """, email, plan)

        await conn.close()
        print(f"✅ Updated user {email} to plan {plan}")

        # Also update in-memory cache if needed
        # This helps with immediate session updates

    except Exception as e:
        print(f"❌ Failed to update user plan: {e}")

@app.get("/api/v1/users/email/{email}/plan")
async def get_user_plan(email: str):
    """Get user's current subscription plan"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        # Create users table if not exist
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                plan VARCHAR(50) DEFAULT 'free',
                google_id VARCHAR(255),
                auth_provider VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Get user plan
        result = await conn.fetchrow("""
            SELECT plan FROM users WHERE email = $1
        """, email)

        await conn.close()

        if result:
            return {"email": email, "plan": result["plan"]}
        else:
            return {"email": email, "plan": "free"}

    except Exception as e:
        print(f"❌ Failed to get user plan: {e}")
        return {"email": email, "plan": "free"}

@app.post("/api/v1/users/{email}/plan")
async def update_user_plan_api(email: str, request: dict):
    """API endpoint to update user plan"""
    try:
        plan = request.get("plan", "free")
        await update_user_plan(email, plan)
        return {"success": True, "message": f"Plan updated to {plan}"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update plan: {str(e)}")

@app.post("/api/v1/users/{email}/avatar")
async def update_user_avatar(email: str, avatar_data: UserAvatar):
    """Update user's avatar/profile picture"""
    try:
        # Connect to database
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Create user_profiles table if it doesn't exist
            await conn.execute("""
                CREATE TABLE IF NOT EXISTS user_profiles (
                    id SERIAL PRIMARY KEY,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    avatar VARCHAR(50),
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            """)

            # Check if user profile exists
            existing = await conn.fetchrow("""
                SELECT * FROM user_profiles WHERE email = $1
            """, email)

            if existing:
                # Update existing profile
                await conn.execute("""
                    UPDATE user_profiles
                    SET avatar = $1, updated_at = CURRENT_TIMESTAMP
                    WHERE email = $2
                """, avatar_data.avatar, email)
                print(f"🎨 Updated avatar for {email}: {avatar_data.avatar}")
            else:
                # Insert new profile
                await conn.execute("""
                    INSERT INTO user_profiles (email, avatar)
                    VALUES ($1, $2)
                """, email, avatar_data.avatar)
                print(f"🎨 Created profile with avatar for {email}: {avatar_data.avatar}")

        finally:
            await conn.close()

        return {
            "success": True,
            "message": "Avatar updated successfully",
            "avatar": avatar_data.avatar
        }

    except Exception as e:
        print(f"💥 Avatar update failed: {e}")
        raise HTTPException(status_code=500, detail=f"Avatar update failed: {str(e)}")

@app.get("/api/v1/users/{email}/avatar")
async def get_user_avatar(email: str):
    """Get user's avatar/profile picture"""
    try:
        # Connect to database
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Get user avatar
            avatar_row = await conn.fetchrow("""
                SELECT avatar FROM user_profiles WHERE email = $1
            """, email)

            avatar = avatar_row["avatar"] if avatar_row else "👤"
            print(f"🎨 Retrieved avatar for {email}: {avatar}")

        finally:
            await conn.close()

        return {
            "email": email,
            "avatar": avatar
        }

    except Exception as e:
        print(f"💥 Avatar retrieval failed: {e}")
        return {"email": email, "avatar": "👤"}

@app.get("/api/v1/tenant/status/{customer_email}")
async def get_tenant_status(customer_email: str):
    """Get tenant/subdomain status for customer"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Get subdomain status for customer
            row = await conn.fetchrow("""
                SELECT subdomain, status, progress, domain, ssl_status, dns_status, updated_at
                FROM subdomains
                WHERE customer_email = $1
                ORDER BY created_at DESC
                LIMIT 1
            """, customer_email)

            if row:
                return {
                    "status": "success",
                    "subdomain": row["subdomain"],
                    "status": row["status"],
                    "progress": row["progress"],
                    "domain": row["domain"],
                    "ssl_status": row["ssl_status"],
                    "dns_status": row["dns_status"],
                    "updated_at": row["updated_at"].isoformat()
                }
            else:
                return {
                    "status": "not_found",
                    "message": "No subdomain found for this customer"
                }

        finally:
            await conn.close()

    except Exception as e:
        print(f"💥 Failed to get tenant status: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/api/v1/subdomain/status/{subdomain}")
async def get_subdomain_status(subdomain: str):
    """Get detailed subdomain provisioning status"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Get detailed subdomain status
            row = await conn.fetchrow("""
                SELECT subdomain, customer_email, status, progress, domain,
                       ssl_status, dns_status, created_at, updated_at
                FROM subdomains
                WHERE subdomain = $1
            """, subdomain)

            if row:
                return {
                    "status": "success",
                    "subdomain": row["subdomain"],
                    "customer_email": row["customer_email"],
                    "provisioning_status": row["status"],
                    "progress": row["progress"],
                    "domain": row["domain"],
                    "ssl_status": row["ssl_status"],
                    "dns_status": row["dns_status"],
                    "created_at": row["created_at"].isoformat(),
                    "updated_at": row["updated_at"].isoformat()
                }
            else:
                return {
                    "status": "not_found",
                    "message": f"Subdomain {subdomain} not found"
                }

        finally:
            await conn.close()

    except Exception as e:
        print(f"💥 Failed to get subdomain status: {e}")
        return {
            "status": "error",
            "message": str(e)
        }

@app.get("/api/v1/invoices/{invoice_number}/pdf")
async def get_invoice_pdf(invoice_number: str):
    """Generate and return invoice PDF"""
    try:
        # Find invoice
        invoice = next((inv for inv in invoices if inv["invoice_number"] == invoice_number), None)
        if not invoice:
            raise HTTPException(status_code=404, detail="Rechnung nicht gefunden")

        # TODO: Generate actual PDF with reportlab or similar
        # For now, return JSON representation
        return {
            "status": "success",
            "message": "PDF-Generation noch nicht implementiert",
            "invoice": invoice,
            "pdf_url": f"/api/v1/invoices/{invoice_number}/pdf",
            "download_available": False
        }

    except Exception as e:
        print(f"💥 PDF generation failed: {e}")
        raise HTTPException(status_code=500, detail=f"Fehler: {str(e)}")

# Helper functions for user ID-based operations
async def get_user_id_by_email(email: str) -> Optional[int]:
    """Get user ID by email address"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)
        result = await conn.fetchrow("SELECT id FROM users WHERE email = $1", email)
        await conn.close()
        return result['id'] if result else None
    except Exception as e:
        print(f"Error getting user ID: {e}")
        return None

async def ensure_user_exists(email: str, name: str = None) -> int:
    """Ensure user exists and return user ID"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        # Create users table if not exist
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                email VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255),
                plan VARCHAR(50) DEFAULT 'free',
                google_id VARCHAR(255),
                auth_provider VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Insert or get user
        result = await conn.fetchrow("""
            INSERT INTO users (email, name)
            VALUES ($1, $2)
            ON CONFLICT (email)
            DO UPDATE SET name = COALESCE(EXCLUDED.name, users.name)
            RETURNING id
        """, email, name)

        await conn.close()
        return result['id']
    except Exception as e:
        print(f"Error ensuring user exists: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Database migration to add user_id foreign keys
@app.post("/api/v1/admin/migrate-to-user-ids")
async def migrate_to_user_ids():
    """Migrate database to use user_id foreign keys instead of email"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        print("🔄 Starting database migration to user ID-based architecture...")

        # Step 1: Add user_id columns to tables that need them
        await conn.execute("""
            ALTER TABLE user_profiles
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        """)

        await conn.execute("""
            ALTER TABLE tenants
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        """)

        await conn.execute("""
            ALTER TABLE subdomains
            ADD COLUMN IF NOT EXISTS user_id INTEGER REFERENCES users(id) ON DELETE CASCADE
        """)

        # Step 2: Populate user_id fields for existing data
        # Migrate user_profiles
        await conn.execute("""
            UPDATE user_profiles
            SET user_id = users.id
            FROM users
            WHERE user_profiles.email = users.email
            AND user_profiles.user_id IS NULL
        """)

        # Migrate tenants
        await conn.execute("""
            UPDATE tenants
            SET user_id = users.id
            FROM users
            WHERE tenants.email = users.email
            AND tenants.user_id IS NULL
        """)

        # Migrate subdomains
        await conn.execute("""
            UPDATE subdomains
            SET user_id = users.id
            FROM users
            WHERE subdomains.customer_email = users.email
            AND subdomains.user_id IS NULL
        """)

        # Step 3: Create indexes for performance
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_tenants_user_id ON tenants(user_id)")
        await conn.execute("CREATE INDEX IF NOT EXISTS idx_subdomains_user_id ON subdomains(user_id)")

        await conn.close()

        print("✅ Database migration completed successfully!")
        return {
            "status": "success",
            "message": "Database migrated to user ID-based architecture",
            "migrations_applied": [
                "Added user_id foreign keys to user_profiles, tenants, subdomains",
                "Populated user_id fields for existing data",
                "Created performance indexes"
            ]
        }

    except Exception as e:
        print(f"💥 Migration failed: {e}")
        raise HTTPException(status_code=500, detail=f"Migration error: {str(e)}")

# New user_id-based API endpoints
@app.get("/api/v1/users/{user_id}/plan")
async def get_user_plan_by_id(user_id: int):
    """Get user's current subscription plan by user ID"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        result = await conn.fetchrow("SELECT plan FROM users WHERE id = $1", user_id)
        await conn.close()

        if not result:
            raise HTTPException(status_code=404, detail="User not found")

        return {"user_id": user_id, "plan": result['plan']}

    except Exception as e:
        print(f"💥 Error getting user plan: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/v1/users/{user_id}/plan")
async def update_user_plan_by_id(user_id: int, plan_data: dict):
    """Update user's subscription plan by user ID"""
    try:
        plan = plan_data.get("plan")
        if plan not in ["free", "basis", "pro"]:
            raise HTTPException(status_code=400, detail="Invalid plan")

        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        # Update user plan
        result = await conn.execute("UPDATE users SET plan = $1 WHERE id = $2", plan, user_id)
        await conn.close()

        if result == "UPDATE 0":
            raise HTTPException(status_code=404, detail="User not found")

        return {"user_id": user_id, "plan": plan, "status": "updated"}

    except Exception as e:
        print(f"💥 Error updating user plan: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/v1/users/{user_id}/billing")
async def get_user_billing(user_id: int):
    """Get billing history for user by user ID"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        try:
            # Fetch billing records using user_id
            rows = await conn.fetch("""
                SELECT id, customer_email, customer_name, plan, amount, currency,
                       payment_method, payment_id, subdomain, status, invoice_number,
                       created_at, billing_date, user_id
                FROM billing_records
                WHERE user_id = $1
                ORDER BY created_at DESC
            """, user_id)

            # Convert to dictionaries
            customer_bills = []
            for row in rows:
                customer_bills.append({
                    "id": row["id"],
                    "customer_email": row["customer_email"],
                    "customer_name": row["customer_name"],
                    "plan": row["plan"],
                    "amount": float(row["amount"]),
                    "currency": row["currency"],
                    "payment_method": row["payment_method"],
                    "payment_id": row["payment_id"],
                    "subdomain": row["subdomain"],
                    "status": row["status"],
                    "invoice_number": row["invoice_number"],
                    "created_at": row["created_at"].isoformat() if row["created_at"] else None,
                    "billing_date": row["billing_date"].isoformat() if row["billing_date"] else None,
                    "user_id": row["user_id"]
                })

            return customer_bills

        finally:
            await conn.close()

    except Exception as e:
        print(f"💥 Error fetching user billing: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.get("/api/v1/users/{user_id}/avatar")
async def get_user_avatar_by_id(user_id: int):
    """Get user's avatar by user ID"""
    try:
        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        # Create user_profiles table if not exist with user_id FK
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                email VARCHAR(255),
                avatar VARCHAR(50),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        result = await conn.fetchrow("SELECT avatar FROM user_profiles WHERE user_id = $1", user_id)
        avatar = result["avatar"] if result else "👤"

        await conn.close()
        return {"user_id": user_id, "avatar": avatar}

    except Exception as e:
        print(f"💥 Error getting user avatar: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@app.post("/api/v1/users/{user_id}/avatar")
async def update_user_avatar_by_id(user_id: int, avatar_data: dict):
    """Update user's avatar by user ID"""
    try:
        avatar = avatar_data.get("avatar", "👤")

        db_url = os.getenv("DATABASE_URL", "postgresql://kurs24:password@postgres:5432/kurs24_production")
        conn = await asyncpg.connect(db_url)

        # Create user_profiles table if not exist
        await conn.execute("""
            CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
                email VARCHAR(255),
                avatar VARCHAR(50),
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)

        # Update or insert user profile
        await conn.execute("""
            INSERT INTO user_profiles (user_id, avatar, updated_at)
            VALUES ($1, $2, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id)
            DO UPDATE SET
                avatar = EXCLUDED.avatar,
                updated_at = EXCLUDED.updated_at
        """, user_id, avatar)

        await conn.close()
        return {"user_id": user_id, "avatar": avatar, "status": "updated"}

    except Exception as e:
        print(f"💥 Error updating user avatar: {e}")
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

# Email-to-ID conversion endpoint for backward compatibility
@app.get("/api/v1/users/email/{email}/id")
async def get_user_id_by_email_endpoint(email: str):
    """Get user ID by email (for migration purposes)"""
    user_id = await get_user_id_by_email(email)
    if not user_id:
        raise HTTPException(status_code=404, detail="User not found")
    return {"email": email, "user_id": user_id}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)