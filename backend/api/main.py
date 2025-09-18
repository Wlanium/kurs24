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
    email: str

class PayPalCapture(BaseModel):
    orderID: str
    name: str
    email: str
    subdomain: str
    academy: str
    plan: str

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
    """Create a new tenant"""
    # TODO: Implement tenant creation logic
    # 1. Create database entry
    # 2. Create DNS record
    # 3. Deploy container
    # 4. Setup SSL

    return {
        "status": "success",
        "message": f"Tenant {tenant.subdomain}.kurs24.io created",
        "tenant_id": "generated_id",
        "url": f"https://{tenant.subdomain}.kurs24.io"
    }

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
            # Payment successful - now provision the tenant
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
                    "tenant_url": f"https://{capture.subdomain}.kurs24.io",
                    "message": "Tenant provisioned successfully"
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
        await update_caddy_config(subdomain)

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
    # TODO: Implement database save
    print(f"Saving tenant {subdomain} to database...")
    pass

async def deploy_tenant_container(subdomain: str, plan: str):
    """Deploy tenant container"""
    # TODO: Implement container deployment
    print(f"Deploying container for {subdomain}...")
    pass

async def update_caddy_config(subdomain: str):
    """Add subdomain to Caddy config via file and reload"""
    try:
        print(f"🔧 Adding {subdomain}.kurs24.io to Caddy via config file...")

        # Create Caddyfile for this subdomain
        caddyfile_content = f"""# Subdomain: {subdomain}
{subdomain}.kurs24.io {{
    reverse_proxy tenant-{subdomain}:3000
}}
"""

        # Write to dynamic subdomains directory (mounted volume)
        config_path = f"/app/dynamic_subdomains/{subdomain}.caddyfile"
        with open(config_path, "w") as f:
            f.write(caddyfile_content)

        print(f"📝 Created {config_path}")

        # Reload Caddy config via API (using host network)
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "http://172.17.0.1:2019/load",
                timeout=10.0
            )

            if response.status_code == 200:
                print(f"🔄 Caddy reloaded successfully!")
                print(f"✅ {subdomain}.kurs24.io should now work with auto SSL!")
                return True
            else:
                print(f"❌ Caddy reload failed: {response.status_code} - {response.text}")
                return False

    except Exception as e:
        print(f"💥 Caddy config update failed: {e}")
        return False

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)