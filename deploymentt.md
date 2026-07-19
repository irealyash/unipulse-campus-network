# UniPulse Deployment Guide

Backend → **Railway** · Frontend → **Vercel** · Custom domain (e.g. `unipulse.live`)

> Full guide lives in [`deployment.md`](./deployment.md) (same content).

This guide covers what to change before launch, every env var, and the free-tier limits you must watch (MongoDB Atlas, Cloudinary, Giphy, Resend, Railway, Vercel).

---

## Architecture (production)

```
Browser (https://unipulse.live)          Vercel (static React SPA)
        │
        ├── REST  →  https://YOUR-API.up.railway.app/api/...
        └── Socket.io →  same Railway host (/socket.io)
                                    │
                    Railway (Node + Express + Socket.io)
                                    │
              ┌─────────────────────┼─────────────────────┐
              ▼                     ▼                     ▼
        MongoDB Atlas          Cloudinary              Resend
        (database)          (images/videos)         (OTP emails)
                                                    Giphy (browser → api.giphy.com)
```

Locally, Vite proxies `/api` and `/socket.io` to `localhost:5000`.  
In production there is **no proxy** — the frontend must call the Railway URL via `VITE_API_URL`.

---

## Pre-flight checklist (do these before deploy)

1. **Never commit `.env` files** — secrets belong only in Railway / Vercel dashboards.
2. Rotate any secrets that were ever committed or shared (JWT, Mongo password, Cloudinary, Resend, Giphy).
3. Confirm signup is **UBC-only** (`@student.ubc.ca`, or emails listed in `MODERATOR_EMAILS`).
4. Verify your **Resend domain** (`unipulse.live` or whatever you use) is verified.
5. In MongoDB Atlas → Network Access, allow Railway (or temporarily `0.0.0.0/0` with a strong DB password).
6. Decide your public URLs:
   - Frontend: `https://unipulse.live` (and optionally `https://www.unipulse.live`)
   - Backend: `https://YOUR-SERVICE.up.railway.app` (or a subdomain like `https://api.unipulse.live`)

---

## Environment variables you MUST set

### Backend (Railway → Variables)

| Variable | Required | Example / notes |
|---|---|---|
| `MONGO_URI` | Yes | Atlas SRV string, include DB name: `...mongodb.net/unipulse?retryWrites=true&w=majority` |
| `JWT_SECRET` | Yes | Long random string (new for production) |
| `JWT_EXPIRES_IN` | No | Default `30d` |
| `OTP_SECRET` | Yes | Different long random string |
| `OTP_TTL_MINUTES` | No | Default `10` |
| `CLIENT_URL` | Yes | Comma-separated frontend origins, e.g. `https://unipulse.live,https://www.unipulse.live` |
| `ALLOWED_EMAIL_DOMAIN` | Recommended | Default `@student.ubc.ca` — only this domain can sign up |
| `CLOUDINARY_CLOUD_NAME` | Yes | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | Yes | |
| `CLOUDINARY_API_SECRET` | Yes | |
| `RESEND_API_KEY` | Yes | Without this, OTPs only log to the server console |
| `MAIL_FROM` | Yes | Must match a verified Resend domain: `UniPulse <no-reply@unipulse.live>` |
| `MODERATOR_EMAILS` | Recommended | Admin emails (comma-separated); these may bypass the UBC domain rule at signup |
| `SEED_DEFAULT_COMMUNITIES` | First boot only | Set `true` once to seed default rooms, then remove/unset |
| `PORT` | No | Railway injects this automatically — do not hardcode |

**Signup rule:** only emails ending in `ALLOWED_EMAIL_DOMAIN` (default `@student.ubc.ca`) can register, unless listed in `MODERATOR_EMAILS`.

### Frontend (Vercel → Environment Variables)

| Variable | Required | Example / notes |
|---|---|---|
| `VITE_API_URL` | **Yes in prod** | Railway public URL, **no trailing slash**, e.g. `https://unipulse-api.up.railway.app` |
| `VITE_GIPHY_API_KEY` | Yes | Your Giphy developer key |

> Vite bakes `VITE_*` into the build at **build time**. After changing them, trigger a **redeploy**.

---

## Step-by-step: Railway (backend)

1. Create a new Railway project → **Deploy from GitHub** (or CLI).
2. Set **Root Directory** to `backend` (important — monorepo).
3. Build/start: Railway should run `npm install` then `npm start` (`node server.js`).  
   `backend/railway.json` is included as a hint.
4. Add all backend env vars listed above.
5. Deploy and open the public URL. Test:  
   `GET https://YOUR-API.up.railway.app/api/health`  
   Expect: `{ "success": true, "status": "ok", ... }`
6. (Optional) Attach custom domain `api.unipulse.live` in Railway → Domains, then put that URL in `VITE_API_URL`.

### Railway notes
- Use the **Hobby** plan (or trial credits) for a public URL and always-on service.
- Free/ephemeral hobby limits change — check [Railway pricing](https://railway.app/pricing).
- Sleeping services (if any) will cause the frontend to hang / timeout on first request.
- Socket.io needs long-lived WebSocket connections — ensure no proxy strips `Upgrade` headers (Railway’s default HTTPS proxy is fine).

---

## Step-by-step: Vercel (frontend)

1. Import the GitHub repo into Vercel.
2. Set **Root Directory** to `frontend`.
3. Framework preset: **Vite**.
4. Build command: `npm run build` · Output: `dist`.
5. Add env vars:
   - `VITE_API_URL` = your Railway URL
   - `VITE_GIPHY_API_KEY` = your key
6. Deploy.
7. Custom domain: Vercel → Project → Domains → add `unipulse.live` (+ `www` if you want).
8. Point DNS (at your registrar) as Vercel instructs (usually A/CNAME records).
9. After DNS is live, set Railway `CLIENT_URL` to your real frontend origins and redeploy backend.

`frontend/vercel.json` rewrites all routes to `index.html` so React Router deep links work (`/c/...`, `/login`, etc.).

---

## What code was prepared for production

| Change | Why |
|---|---|
| `frontend/src/lib/api.js` uses `VITE_API_URL` | Browser must call Railway directly (no Vite proxy in prod) |
| `frontend/src/lib/socket.js` uses same origin | Live chat Socket.io must hit Railway |
| `backend/server.js` CORS accepts comma-separated `CLIENT_URL` | Apex + `www` both work |
| `frontend/vercel.json` | SPA routing on Vercel |
| `backend/railway.json` | Clear start command for Railway |
| Sanitized `backend/.env.example` / `frontend/.env.example` | No real secrets in examples |
| UBC-only signup | `@student.ubc.ca` required (`ALLOWED_EMAIL_DOMAIN`); moderators may bypass |

---

## Third-party limits (watch these)

Limits change — always confirm on the provider’s pricing page. Numbers below are typical free-tier ceilings as of mid-2026.

### 1) MongoDB Atlas (Free / M0)

| Limit | Typical free tier |
|---|---|
| Storage | **512 MB** total (documents + indexes) |
| Connections | **~500** concurrent per node |
| Ops | Soft throttle around **~100 ops/sec** |
| Transfer | Roughly **10 GB in / 10 GB out** per period (then throttled) |
| Backups | **No** automated backups on M0 |
| Clusters | Usually **1 M0 per project** |

**What this means for UniPulse**
- Messages, posts, media metadata, and OTPs all grow the DB. Media **files** live on Cloudinary (URLs only in Mongo) — good.
- Chat history is the biggest growth risk. Plan cleanup or upgrade before you hit 512 MB.
- Prefer **one long-lived Railway process** (not serverless) so you don’t burn the 500 connection limit.
- Atlas Network Access: allow Railway IPs or `0.0.0.0/0` with a strong password.
- Create a dedicated DB user with least privilege (not your Atlas org owner).

**Upgrade when:** storage > ~400 MB, frequent throttling, or you need backups → Flex / M10+.

---

### 2) Cloudinary (Free)

| Limit | Typical free tier |
|---|---|
| Credits | **~25 credits / month** |
| Storage | **~25 GB** |
| Bandwidth | **~25 GB / month** |
| Transformations | Count against credits |

**What this means**
- Every image/video upload (chat, posts, events, avatars) uses storage + bandwidth when viewed.
- Videos cost more than images. Prefer compressed images; avoid huge uploads.
- UniPulse uploads via `POST /api/uploads/media` (multer → Cloudinary). Keep multer size limits sensible.

**Upgrade when:** users upload lots of photos/videos or bandwidth spikes after launch.

---

### 3) Giphy API

| Limit | Typical free / public key |
|---|---|
| Rate limit | Often on the order of **tens–low hundreds of requests/hour** (plan-dependent) |
| Key type | Use a **production** key from [developers.giphy.com](https://developers.giphy.com) |

**What this means**
- GIF search/trending are called **from the browser** (`VITE_GIPHY_API_KEY`).
- Each open of the GIF picker + search burns quota for **every user**.
- Do **not** commit a personal key; set it only in Vercel.
- If you hit 429s, GIF picker fails gracefully — chat text still works.

**Upgrade / tips:** cache trending results client-side briefly; debounce search; get a production key with higher limits if chat is heavy.

---

### 4) Resend (email)

| Limit | Typical free tier |
|---|---|
| Daily | **~100 emails / day** |
| Monthly | **~3,000 emails / month** |
| Domain | Must verify sending domain |

**What this means**
- Every signup OTP + password reset uses 1 email (resends burn more).
- Without `RESEND_API_KEY`, codes only print in Railway logs — users cannot verify in production.
- `MAIL_FROM` must use your **verified** domain (e.g. `no-reply@unipulse.live`).

**Upgrade when:** signup volume exceeds free daily cap.

---

### 5) Railway (backend host)

| Concern | Notes |
|---|---|
| Cost | Usage-based / Hobby plan — watch monthly spend |
| Sleep | Avoid plans that sleep idle services (hurts Socket.io + first load) |
| Resources | Memory spikes possible with many Socket.io rooms |
| Logs | Check deploy logs for Mongo / Resend / Cloudinary errors |

---

### 6) Vercel (frontend host)

| Concern | Typical Hobby |
|---|---|
| Bandwidth | Generous but capped (check current Hobby limits) |
| Builds | Limited build minutes / month |
| Env | Remember `VITE_*` need rebuild after change |
| SPA | `vercel.json` rewrite is required for client routes |

---

## Security checklist for launch

- [ ] New `JWT_SECRET` and `OTP_SECRET` (not the local/dev values)
- [ ] Mongo user password rotated; URI only in Railway
- [ ] Cloudinary / Resend / Giphy keys only in dashboards
- [ ] `CLIENT_URL` locked to your real domain(s) — not `*`
- [ ] HTTPS everywhere (Vercel + Railway provide this)
- [ ] Moderator emails set via `MODERATOR_EMAILS`
- [ ] Test signup → OTP email → verify → login → chat → upload image → GIF picker
- [ ] Test Socket.io on production (open two browsers in same community chat)

---

## Smoke-test script after deploy

1. `GET {RAILWAY}/api/health` → 200 OK  
2. Open `{VERCEL_OR_DOMAIN}/signup` → register with a **`@student.ubc.ca`** inbox  
3. Receive OTP via Resend → verify  
4. Complete or skip onboarding → land on `/c` (empty state is OK)  
5. Add a community → open chat → send text + image + GIF  
6. Hard refresh — session restores (JWT in localStorage)  
7. Open site on phone (custom domain + HTTPS)

---

## Common production failures

| Symptom | Likely cause |
|---|---|
| Frontend loads but all API calls fail / CORS error | `CLIENT_URL` missing your Vercel domain, or typo |
| API calls go to `unipulse.live/api/...` and 404 | `VITE_API_URL` not set / not rebuilt |
| Chat never connects | Socket pointing at wrong host; check `VITE_API_URL` |
| Signup succeeds but no email | `RESEND_API_KEY` / domain not verified / `MAIL_FROM` wrong |
| Uploads fail | Cloudinary env vars missing or quota exhausted |
| GIFs empty | `VITE_GIPHY_API_KEY` missing or rate-limited |
| Mongo connection error on Railway | Atlas Network Access blocking Railway IPs |
| Stuck “Loading communities…” | Backend down or `VITE_API_URL` wrong |

---

## Suggested launch order

1. Atlas DB ready + Network Access open  
2. Deploy backend on Railway + set env vars + confirm `/api/health`  
3. Deploy frontend on Vercel with `VITE_API_URL` pointing at Railway  
4. Attach custom domain on Vercel  
5. Update Railway `CLIENT_URL` to the custom domain(s) → redeploy backend  
6. End-to-end smoke test  
7. Announce 🚀  

---

*See also: [`deployment.md`](./deployment.md)*
