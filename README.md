# MAT SMS

Lightweight SMS automation that uses **your own SIM** (via an Android phone) to send messages programmatically. Built for small teams that want to use their daily SIM allowance instead of paying per-SMS to a provider.

```
[Dashboard / API clients] ──► [Node backend] ──► [Android phone w/ SIM] ──► SMS
```

The phone runs the open-source [SMS Gateway for Android](https://sms-gate.app) app. The backend in this repo handles auth, daily-quota tracking, history, and (Phase 2+) bulk + scheduled sends + Gemini-generated templates.

---

## What's in Phase 1 (this scaffold)

- Email/password login + register (multi-user, one shared SIM)
- Dashboard: send one SMS, view recent history, see today's usage
- REST endpoint: `POST /api/send` for programmatic sends
- Hard daily cap (default 100) shared across the whole team
- SQLite storage in `data/mat.db` (zero setup)

## What's next

- **Phase 2:** contacts, CSV bulk upload, scheduled sends, message templates with `{name}` variables
- **Phase 3:** Gemini-generated SMS drafts from natural-language prompts

---

## Setup

### 1. Install the SMS Gateway for Android on the phone with the SIM

1. Install **SMS Gateway** from the Play Store, or download the APK from <https://sms-gate.app>.
2. Open the app and choose **Cloud Server** mode (recommended — no port forwarding needed).
3. The app generates a **username** and **password**. Copy them.
4. Grant the SMS-send permission when prompted.

> Cloud Server mode means the phone polls `api.sms-gate.app` for outgoing messages. Our backend POSTs there with the same credentials. No VPN, ngrok, or static IP required.

### 2. Install Node.js dependencies

Requires Node.js 18+ (works on Windows out of the box; `better-sqlite3` ships prebuilt binaries).

```powershell
npm install
```

### 3. Configure environment

```powershell
copy .env.example .env
```

Edit `.env`:

```
SESSION_SECRET=<paste any long random string>
SMS_GATEWAY_USERNAME=<from the Android app>
SMS_GATEWAY_PASSWORD=<from the Android app>
DAILY_SMS_LIMIT=100
```

### 4. Run

```powershell
npm start
```

Open <http://localhost:3000>, register your account, send a test SMS to your own number.

---

## API

All endpoints require a session cookie obtained via `POST /login`. (Phase 2 will add API-token auth for scripts.)

### `POST /api/send`

```json
{ "phone": "+919876543210", "body": "Hello from MAT" }
```

Response:

```json
{ "ok": true, "messageId": 12, "gatewayId": "abc-...", "remaining": 99 }
```

Errors:
- `400` — missing `phone` or `body`
- `429` — daily limit reached
- `502` — phone gateway unreachable or rejected the message

### `GET /api/quota`

```json
{ "used": 23, "remaining": 77, "limit": 100 }
```

### `GET /api/messages`

Last 100 messages with status + timestamps.

---

## Deployment (free tier)

For Phase 1 you can run on your own PC. To make it reachable for teammates without your PC being always-on:

- [Render](https://render.com) free web service — connect a GitHub repo, set the env vars from `.env`, build command `npm install`, start command `npm start`.
- [Fly.io](https://fly.io) free tier — `fly launch` works out of the box.
- [Railway](https://railway.app) — similar.

**Important for free tiers:** SQLite data lives in `data/mat.db`. On Render free, the disk is ephemeral and resets on redeploy — fine for testing, but Phase 2 will switch to Postgres (also free on Render) for persistence.

---

## Operational notes

- **Carrier spam detection.** Sending 100 similar messages in quick bursts will get your SIM flagged by your carrier. The Android Gateway app has a per-minute rate limit setting — set it to ~6/minute or lower. Phase 2 will add server-side pacing.
- **Indian DLT rules.** If you're in India, commercial bulk SMS technically requires DLT registration. Personal messages to your own contacts are fine in practice. Marketing blasts to strangers can get the SIM blocked.
- **Status accuracy.** Right now we mark a message `sent` when the gateway accepts it for delivery, not when the carrier confirms delivery. Phase 2 will subscribe to the gateway's delivery webhooks for accurate `delivered` / `failed` tracking.

---

## Project layout

```
src/
  server.js     Express app, routes
  db.js         SQLite init + schema
  auth.js       register / login / session middleware
  gateway.js    SMS Gateway for Android (cloud) client
  quota.js      Daily-limit accounting
  views.js     HTML for login/register/dashboard
data/
  mat.db        SQLite database (gitignored)
```
