# SafeRide QR — Deployment Guide

This is a step-by-step checklist for deploying SafeRide QR to a production Ubuntu VPS, per the project spec's Phase 8 target (PM2 + Nginx + SSL). This document is a guide only — it was not executed as part of development; you'll run these steps yourself against your own server and domain.

## Prerequisites

- An Ubuntu 22.04+ VPS with root/sudo access
- A domain name pointed at the VPS's IP (A record)
- A Supabase project (already set up — see `supabase/migrations/` for schema)
- All third-party API keys ready: Razorpay, Exotel, Resend, Google Maps (only needed once those integrations are enabled — see "Known gaps" below)

## 1. Apply database migrations

Run every file in `supabase/migrations/` **in order** via the Supabase Dashboard → SQL Editor (or `supabase db push` if using the CLI):

```
001_initial_schema.sql
002_row_level_security.sql
003_settings.sql
004_notification_body.sql
005_security.sql
```

`005_security.sql` changes `ss_medical_profiles` and `ss_agents.bank_account_number` from `TEXT` to `BYTEA` (encrypted). If you have existing production data in those columns from before this migration, **back it up first** — the migration as written assumes no real data exists yet and does not attempt to encrypt in place.

## 2. Environment variables

Copy `.env.example` to `.env.local` (or your production env file) and fill in every value. Pay special attention to:

- `ENCRYPTION_KEY` — generate once with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`. **Never change this after real data has been encrypted** — existing rows become permanently undecryptable. Store it in a password manager, not just the server.
- `SUPABASE_SERVICE_ROLE_KEY` — server-only, never expose to the browser or commit to git.
- Razorpay, Exotel, Resend keys are only required once those integrations are wired up for real (see "Known gaps" below) — the app runs without them in its current deferred-payment/deferred-notification state.

## 3. Server setup (Ubuntu VPS)

```bash
# Node.js (use the version this project was built against — check package.json "engines" or .nvmrc if present, otherwise latest LTS)
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt install -y nodejs

# PM2 (process manager, keeps the app running and restarts on crash)
sudo npm install -g pm2

# Nginx (reverse proxy)
sudo apt install -y nginx

# Certbot (for free SSL via Let's Encrypt)
sudo apt install -y certbot python3-certbot-nginx
```

Clone the repo onto the server, install dependencies, and build:

```bash
git clone <your-repo-url> saferideqr
cd saferideqr
npm install
npm run build
```

## 4. PM2 process

Create `ecosystem.config.js` in the project root:

```js
module.exports = {
  apps: [
    {
      name: "saferideqr",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
```

Start and persist across reboots:

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # follow the printed instructions to enable boot-time startup
```

## 5. Nginx reverse proxy

Create `/etc/nginx/sites-available/saferideqr`:

```nginx
server {
    listen 80;
    server_name saferideqr.in www.saferideqr.in;  # replace with your domain

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

The `X-Forwarded-For` header matters — the app's scan-abuse rate limiting (`src/actions/scan.ts`) reads the caller's IP from this header, so it must be passed through correctly for rate limiting to work behind the proxy.

```bash
sudo ln -s /etc/nginx/sites-available/saferideqr /etc/nginx/sites-enabled/
sudo nginx -t   # test config
sudo systemctl reload nginx
```

## 6. SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d saferideqr.in -d www.saferideqr.in
```

Certbot auto-configures Nginx for HTTPS and sets up auto-renewal. Verify renewal works:

```bash
sudo certbot renew --dry-run
```

## 7. Uptime monitoring

No server-side work needed — use a free external service:

- [UptimeRobot](https://uptimerobot.com) (free tier: 50 monitors, 5-minute checks) — point it at `https://yourdomain.in` and optionally a health-check route if you add one.
- Set up email/SMS alerts for downtime.

## 8. Known gaps to address before public launch

These were deliberately deferred during development and need real setup before going fully live:

- **Razorpay payments** — Phase 4 (Subscription & Payments) was never wired up. Activation and subscriptions currently work without a payment step. Wire in real Razorpay Orders/Subscriptions API before charging real customers.
- **Real SMS/WhatsApp/Email sending** — notifications are logged to `ss_notifications_log` with `status: 'queued'` but never actually sent (see `src/actions/scan.ts`). The message content is already rendered via templates (`src/lib/notification-templates.ts`) and ready to hand to `src/notifications/sms.ts` / `whatsapp.ts` / `email.ts` — those provider modules exist and are functional, they're just not called yet.
- **CAPTCHA on public scan pages** — intentionally skipped in Phase 8 because it requires a real reCAPTCHA or hCaptcha account. Sign up for one, add `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` / `RECAPTCHA_SECRET_KEY` (or hCaptcha equivalents) to your env, and add the widget to `src/app/scan/[qr_id]/notify/`, `wrong-parking/`, and `emergency/` forms plus server-side verification in `src/actions/scan.ts`.
- **GST invoicing** — deferred alongside Razorpay; `GST_PERCENTAGE`/`GSTIN` env vars exist but no invoice generation code does yet.

## 9. Post-deploy smoke test

After deployment, manually verify:

1. `https://yourdomain.in` loads over HTTPS with a valid certificate.
2. Sign up a new account, log in, log out.
3. As admin, generate a QR batch, activate one as a customer, confirm the vehicle appears in the dashboard.
4. Trigger one scan action (e.g. Notify Owner) and confirm a row appears in `ss_scans` + `ss_notifications_log` in Supabase.
5. Confirm rate limiting works: submit the same scan action 6 times rapidly, confirm the 6th is rejected.
