from flask import current_app
from flask_mail import Message
import requests
import os
import logging
import json

def send_verification_email(email, username, verification_code):
    """Send verification code via email"""
    try:
        mail = current_app.mail
        
        subject = "IHK Privatrecht - Bestätigen Sie Ihr Konto"
        
        # HTML Email Template
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Konto-Bestätigung</title>
            <style>
                body {{
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    margin: 0;
                    padding: 0;
                    background-color: #f8fafc;
                }}
                .container {{
                    max-width: 600px;
                    margin: 0 auto;
                    background: white;
                    border-radius: 10px;
                    overflow: hidden;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                .header {{
                    background: linear-gradient(135deg, #2563eb, #1d4ed8);
                    color: white;
                    padding: 30px;
                    text-align: center;
                }}
                .content {{
                    padding: 30px;
                }}
                .code-box {{
                    background: #f3f4f6;
                    border: 2px dashed #d1d5db;
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    margin: 20px 0;
                }}
                .verification-code {{
                    font-size: 2rem;
                    font-weight: bold;
                    color: #2563eb;
                    letter-spacing: 0.2em;
                    font-family: 'Courier New', monospace;
                }}
                .warning {{
                    background: #fef3cd;
                    border: 1px solid #fbbf24;
                    border-radius: 6px;
                    padding: 15px;
                    margin: 20px 0;
                }}
                .footer {{
                    background: #f9fafb;
                    padding: 20px;
                    text-align: center;
                    color: #6b7280;
                    font-size: 0.9rem;
                }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🏛️ IHK Privatrecht</h1>
                    <p>Willkommen bei unserem interaktiven Rechtskurs!</p>
                </div>
                
                <div class="content">
                    <h2>Hallo {username}!</h2>
                    <p>Vielen Dank für Ihre Registrierung bei unserem IHK Privatrecht-Kurs. Um Ihr Konto zu aktivieren, geben Sie bitte den folgenden 6-stelligen Code auf der Webseite ein:</p>
                    
                    <div class="code-box">
                        <div class="verification-code">{verification_code}</div>
                    </div>
                    
                    <div class="warning">
                        <strong>⚠️ Wichtige Hinweise:</strong>
                        <ul>
                            <li>Dieser Code ist nur <strong>15 Minuten</strong> gültig</li>
                            <li>Geben Sie den Code niemals an Dritte weiter</li>
                            <li>Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail</li>
                        </ul>
                    </div>
                    
                    <p>Nach der Bestätigung können Sie sofort mit dem Lernen beginnen und haben Zugang zu:</p>
                    <ul>
                        <li>30 wichtigen Rechtsbegriffen</li>
                        <li>Interaktiven Quiz-Modi</li>
                        <li>Fortschrittsverfolgung</li>
                        <li>24 Sprachen für Übersetzungen</li>
                    </ul>
                    
                    <p>Bei Fragen wenden Sie sich gerne an unser Support-Team.</p>
                    <p>Viel Erfolg beim Lernen!</p>
                </div>
                
                <div class="footer">
                    <p>IHK Privatrecht-Kurs | <a href="https://recht.toxicgirl.de">recht.toxicgirl.de</a></p>
                    <p>Diese E-Mail wurde automatisch generiert. Bitte antworten Sie nicht auf diese E-Mail.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Plain text version
        text_body = f"""
        IHK Privatrecht - Konto-Bestätigung
        
        Hallo {username}!
        
        Vielen Dank für Ihre Registrierung bei unserem IHK Privatrecht-Kurs.
        
        Ihr Bestätigungscode: {verification_code}
        
        Geben Sie diesen 6-stelligen Code auf der Webseite ein, um Ihr Konto zu aktivieren.
        
        WICHTIG: Dieser Code ist nur 15 Minuten gültig.
        
        Falls Sie sich nicht registriert haben, ignorieren Sie diese E-Mail.
        
        Viel Erfolg beim Lernen!
        
        IHK Privatrecht-Kurs
        https://recht.toxicgirl.de
        """
        
        msg = Message(
            subject=subject,
            recipients=[email],
            body=text_body,
            html=html_body
        )
        
        mail.send(msg)
        return True, "E-Mail erfolgreich gesendet"
        
    except Exception as e:
        logging.error(f"Email sending failed: {str(e)}")
        return False, f"E-Mail-Versand fehlgeschlagen: {str(e)}"

def send_verification_sms(phone, username, verification_code):
    """Send verification code via SMS using Twilio"""
    try:
        # Twilio credentials from environment variables for security
        account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        from_phone = os.environ.get('TWILIO_PHONE_NUMBER')
        
        if not all([account_sid, auth_token, from_phone]):
            return False, "SMS-Service nicht konfiguriert. Bitte verwenden Sie eine E-Mail-Adresse zur Registrierung."
        
        client = Client(account_sid, auth_token)
        
        message_body = f"""
🏛️ IHK Privatrecht-Kurs

Hallo {username}!

Ihr Bestätigungscode: {verification_code}

Geben Sie diesen Code auf der Webseite ein (15 Min. gültig).

recht.toxicgirl.de
        """.strip()
        
        message = client.messages.create(
            body=message_body,
            from_=from_phone,
            to=phone
        )
        
        return True, f"SMS gesendet (ID: {message.sid})"
        
    except Exception as e:
        logging.error(f"SMS sending failed: {str(e)}")
        return False, f"SMS-Versand fehlgeschlagen: {str(e)}"

def send_verification_code(contact_type, contact, username, verification_code):
    """Send verification code via email or SMS"""
    if contact_type == 'email':
        return send_verification_email(contact, username, verification_code)
    elif contact_type == 'phone':
        return send_verification_sms(contact, username, verification_code)
    else:
        return False, "Unbekannter Kontakttyp"