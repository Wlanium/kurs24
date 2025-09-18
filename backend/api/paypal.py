"""PayPal integration for kurs24.io"""
import os
import base64
import httpx
from typing import Dict, Any

class PayPalClient:
    def __init__(self):
        self.client_id = os.getenv("PAYPAL_CLIENT_ID")
        self.client_secret = os.getenv("PAYPAL_CLIENT_SECRET")
        self.mode = os.getenv("PAYPAL_MODE", "sandbox")

        # Set base URL based on mode
        if self.mode == "sandbox":
            self.base_url = "https://api-m.sandbox.paypal.com"
        else:
            self.base_url = "https://api-m.paypal.com"

    async def get_access_token(self) -> str:
        """Get PayPal OAuth2 access token"""
        auth_string = f"{self.client_id}:{self.client_secret}"
        auth_bytes = auth_string.encode('ascii')
        auth_b64 = base64.b64encode(auth_bytes).decode('ascii')

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/oauth2/token",
                headers={
                    "Authorization": f"Basic {auth_b64}",
                    "Content-Type": "application/x-www-form-urlencoded"
                },
                data="grant_type=client_credentials"
            )

            if response.status_code == 200:
                return response.json()["access_token"]
            else:
                raise Exception(f"Failed to get PayPal access token: {response.text}")

    async def create_order(self, plan: str, price: float, subdomain: str, email: str) -> Dict[str, Any]:
        """Create a PayPal order"""
        access_token = await self.get_access_token()

        order_data = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "reference_id": f"kurs24_{subdomain}",
                "description": f"Royal Academy {plan.upper()} Plan - {subdomain}.kurs24.io",
                "amount": {
                    "currency_code": "EUR",
                    "value": str(price)
                }
            }],
            "application_context": {
                "brand_name": "Royal Academy K.I. Training",
                "landing_page": "BILLING",
                "user_action": "PAY_NOW",
                "return_url": "https://b6t.de/success",
                "cancel_url": "https://b6t.de/cancel"
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v2/checkout/orders",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=order_data
            )

            if response.status_code == 201:
                return response.json()
            else:
                raise Exception(f"Failed to create PayPal order: {response.text}")

    async def capture_order(self, order_id: str) -> Dict[str, Any]:
        """Capture a PayPal order payment"""
        access_token = await self.get_access_token()

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v2/checkout/orders/{order_id}/capture",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                }
            )

            if response.status_code == 201:
                return response.json()
            else:
                raise Exception(f"Failed to capture PayPal payment: {response.text}")

    async def create_subscription(self, plan_id: str, subscriber: Dict) -> Dict[str, Any]:
        """Create a subscription for recurring payments"""
        access_token = await self.get_access_token()

        subscription_data = {
            "plan_id": plan_id,
            "subscriber": subscriber,
            "application_context": {
                "brand_name": "Royal Academy",
                "return_url": "https://b6t.de/success",
                "cancel_url": "https://b6t.de/cancel"
            }
        }

        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/v1/billing/subscriptions",
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Content-Type": "application/json"
                },
                json=subscription_data
            )

            if response.status_code == 201:
                return response.json()
            else:
                raise Exception(f"Failed to create subscription: {response.text}")

# Export client instance
paypal_client = PayPalClient()