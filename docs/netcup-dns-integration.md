# Netcup DNS API Integration für b6t.de

## 🔧 API Credentials Setup

### Netcup CCP (Customer Control Panel):
1. Login: https://www.customercontrolpanel.de/
2. Gehe zu: **DNS API** → **API-Key erstellen**
3. Notiere dir:
   ```bash
   NETCUP_CUSTOMER_NUMBER=97285
   NETCUP_API_KEY=ODk0NzhSOEg2am1hYjlBRTNvNW04a0kyMXIyMTM2NFFTZnZCcj
   NETCUP_API_PASSWORD=UlZIRJlmzZoka3dOrMS/ffH7hUYibMowSlX4mFNoZX3Cd0RhxU
   ```

## 🐍 Python Netcup DNS Client

### Installation:
```bash
pip3 install --user --break-system-packages requests
```

### Netcup DNS Manager Script:
```python
#!/usr/bin/env python3
# /opt/kurs24/scripts/netcup-dns.py

import requests
import json
import sys

class NetcupDNS:
    def __init__(self, customer_number, api_key, api_password):
        self.customer_number = customer_number
        self.api_key = api_key
        self.api_password = api_password
        self.session_id = None
        self.base_url = "https://ccp.netcup.net/run/webservice/servers/endpoint.php"

    def login(self):
        """Login and get session ID"""
        payload = {
            "action": "login",
            "param": {
                "customernumber": self.customer_number,
                "apikey": self.api_key,
                "apipassword": self.api_password
            }
        }

        response = requests.post(self.base_url, json=payload)
        result = response.json()

        if result['status'] == 'success':
            self.session_id = result['responsedata']['apisessionid']
            print(f"✅ Netcup login successful")
            return True
        else:
            print(f"❌ Login failed: {result.get('longmessage', 'Unknown error')}")
            return False

    def logout(self):
        """Logout and invalidate session"""
        if not self.session_id:
            return

        payload = {
            "action": "logout",
            "param": {
                "customernumber": self.customer_number,
                "apikey": self.api_key,
                "apisessionid": self.session_id
            }
        }

        requests.post(self.base_url, json=payload)
        self.session_id = None
        print("🔓 Netcup logout")

    def info_dns_zone(self, domain):
        """Get DNS zone info"""
        payload = {
            "action": "infoDnsZone",
            "param": {
                "customernumber": self.customer_number,
                "apikey": self.api_key,
                "apisessionid": self.session_id,
                "domainname": domain
            }
        }

        response = requests.post(self.base_url, json=payload)
        return response.json()

    def info_dns_records(self, domain):
        """Get all DNS records for domain"""
        payload = {
            "action": "infoDnsRecords",
            "param": {
                "customernumber": self.customer_number,
                "apikey": self.api_key,
                "apisessionid": self.session_id,
                "domainname": domain
            }
        }

        response = requests.post(self.base_url, json=payload)
        return response.json()

    def update_dns_records(self, domain, records):
        """Update DNS records"""
        payload = {
            "action": "updateDnsRecords",
            "param": {
                "customernumber": self.customer_number,
                "apikey": self.api_key,
                "apisessionid": self.session_id,
                "domainname": domain,
                "dnsrecordset": {
                    "dnsrecords": records
                }
            }
        }

        response = requests.post(self.base_url, json=payload)
        return response.json()

    def add_a_record(self, domain, hostname, ip, ttl=3600):
        """Add A record for hostname.domain -> IP"""
        # Get existing records
        current_records = self.info_dns_records(domain)

        if current_records['status'] != 'success':
            print(f"❌ Failed to get current records: {current_records.get('longmessage')}")
            return False

        records = current_records['responsedata']['dnsrecords']

        # Add new A record
        new_record = {
            "hostname": hostname,
            "type": "A",
            "priority": "",
            "destination": ip,
            "deleterecord": False,
            "state": "yes"
        }

        # Check if record already exists
        existing = None
        for i, record in enumerate(records):
            if record['hostname'] == hostname and record['type'] == 'A':
                existing = i
                break

        if existing is not None:
            records[existing] = new_record
            print(f"🔄 Updating existing A record: {hostname}.{domain} -> {ip}")
        else:
            records.append(new_record)
            print(f"➕ Adding new A record: {hostname}.{domain} -> {ip}")

        # Update records
        result = self.update_dns_records(domain, records)

        if result['status'] == 'success':
            print(f"✅ DNS record updated successfully")
            return True
        else:
            print(f"❌ Failed to update DNS: {result.get('longmessage')}")
            return False

def main():
    import os

    # Get credentials from environment
    customer_number = os.getenv('NETCUP_CUSTOMER_NUMBER')
    api_key = os.getenv('NETCUP_API_KEY')
    api_password = os.getenv('NETCUP_API_PASSWORD')

    if not all([customer_number, api_key, api_password]):
        print("❌ Missing Netcup credentials in environment variables")
        print("Set: NETCUP_CUSTOMER_NUMBER, NETCUP_API_KEY, NETCUP_API_PASSWORD")
        sys.exit(1)

    dns = NetcupDNS(customer_number, api_key, api_password)

    if len(sys.argv) < 2:
        print("Usage: python3 netcup-dns.py <command> [args]")
        print("Commands:")
        print("  list b6t.de                    - List all DNS records")
        print("  add b6t.de www 1.2.3.4         - Add A record")
        print("  add b6t.de @ 1.2.3.4           - Add root A record")
        sys.exit(1)

    command = sys.argv[1]

    if not dns.login():
        sys.exit(1)

    try:
        if command == "list":
            domain = sys.argv[2]
            records = dns.info_dns_records(domain)
            if records['status'] == 'success':
                print(f"📋 DNS Records for {domain}:")
                for record in records['responsedata']['dnsrecords']:
                    print(f"  {record['hostname']}.{domain} {record['type']} -> {record['destination']}")
            else:
                print(f"❌ Failed: {records.get('longmessage')}")

        elif command == "add":
            domain = sys.argv[2]
            hostname = sys.argv[3]
            ip = sys.argv[4]
            dns.add_a_record(domain, hostname, ip)

        else:
            print(f"❌ Unknown command: {command}")

    finally:
        dns.logout()

if __name__ == "__main__":
    main()
```

## 🚀 Usage Examples

### Environment Setup:
```bash
# Add to /opt/kurs24/.env
export NETCUP_CUSTOMER_NUMBER=123456
export NETCUP_API_KEY=abcdef123456
export NETCUP_API_PASSWORD=your_api_password

# Load environment
source /opt/kurs24/.env
```

### DNS Management:
```bash
# Make script executable
chmod +x /opt/kurs24/scripts/netcup-dns.py

# List all DNS records for b6t.de
python3 /opt/kurs24/scripts/netcup-dns.py list b6t.de

# Add root domain A record
python3 /opt/kurs24/scripts/netcup-dns.py add b6t.de @ 152.53.150.111

# Add www subdomain
python3 /opt/kurs24/scripts/netcup-dns.py add b6t.de www 152.53.150.111

# Add wildcard (for tenant subdomains) - manual in CCP erforderlich
# *.b6t.de -> 152.53.150.111
```

## 🔧 Integration in kurs24.io Platform

### Tenant Provisioning mit Netcup:
```python
# In your tenant creation API
def create_tenant_subdomain(tenant_name, server_ip):
    dns = NetcupDNS(
        os.getenv('NETCUP_CUSTOMER_NUMBER'),
        os.getenv('NETCUP_API_KEY'),
        os.getenv('NETCUP_API_PASSWORD')
    )

    if dns.login():
        # Create subdomain for tenant
        success = dns.add_a_record("kurs24.io", tenant_name, server_ip)
        dns.logout()
        return success

    return False
```

## 📋 Setup Checklist

### Sofort setup:
```bash
# 1. Netcup API Credentials holen
# 2. Environment variables setzen
echo "NETCUP_CUSTOMER_NUMBER=your_number" >> /opt/kurs24/.env
echo "NETCUP_API_KEY=your_key" >> /opt/kurs24/.env
echo "NETCUP_API_PASSWORD=your_password" >> /opt/kurs24/.env

# 3. Script erstellen
cp netcup-dns.py /opt/kurs24/scripts/
chmod +x /opt/kurs24/scripts/netcup-dns.py

# 4. Test DNS API
source /opt/kurs24/.env
python3 /opt/kurs24/scripts/netcup-dns.py list b6t.de

# 5. Root domain setzen
python3 /opt/kurs24/scripts/netcup-dns.py add b6t.de @ 152.53.150.111
python3 /opt/kurs24/scripts/netcup-dns.py add b6t.de www 152.53.150.111
```

### Production Integration:
- ✅ Automatisches Subdomain-Management für Tenants
- ✅ SSL via Let's Encrypt für alle Subdomains
- ✅ Wildcard DNS für unbegrenzte Tenant-Subdomains
- ✅ API Integration in Platform-Backend

**Jetzt hast du beide DNS Provider ready: Porkbun für kurs24.io + Netcup für b6t.de!** 🚀