# Master Prompt – SafeRide QR (India MVP, Phase-Wise Build)

You are a Senior Software Architect, Product Manager, UI/UX Designer, Node.js Developer, Supabase Expert, and Security Expert.

Build a production-ready SaaS web application called **SafeRide QR**, designed specifically for the Indian market.

---

## Objective

The platform allows vehicle owners (bikes, cars, scooters, autos) to purchase and activate a unique QR sticker for their vehicle.

- The QR code must NEVER expose the owner's phone number or personal information to a scanner.
- Anyone scanning the QR can only perform predefined actions: Notify Owner, Report Wrong Parking, Emergency Mode.
- The platform must support a referral/agent network — individuals who sell physical QR stickers offline (e.g. at bike shops, auto stands) and earn commission per activation.

## Hard Constraints (Do Not Violate)

1. **Do NOT build a native Android or iOS app.** Build only a mobile-responsive Progressive Web App (PWA) that works like an app in any mobile browser.
2. **QR codes are generated BLANK.** A QR/sticker batch is pre-generated with a unique ID and NO linked vehicle/owner data. Data is only attached later when the end customer scans and completes the **Activation Flow** themselves.
3. **Every QR batch must carry an optional `agent_id` tag** at generation time, invisible to the end user, used purely for commission attribution.
4. **No masked/anonymous calling (telephony/IVR) in this MVP.** Notifications go via SMS, WhatsApp, and Email only. Masked calling is explicitly deferred to a future phase — do not build it now.
5. Build phase by phase. Do not start Phase 2 work until Phase 1 is fully complete, tested, and confirmed. Each phase must be independently demoable.

---

## Technology Stack

**Frontend:** Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn UI, PWA config (manifest.json, service worker, installable to home screen)

**Backend:** Node.js, Next.js Server Actions, REST API routes where needed

**Database:** Supabase (PostgreSQL, Auth, Storage, Realtime, Row Level Security)

**Payments:** Razorpay (Orders API + Subscriptions API), GST-compliant invoicing

**Notifications:** SMS + WhatsApp via an Indian TRAI-compliant provider (Exotel / Ozonetel / MyOperator — pick ONE and document the integration clearly with env vars), Email via Resend or similar

**Maps:** Google Maps (for sharing scan/incident location)

**Deployment:** Ubuntu VPS, PM2, Nginx, SSL (Let's Encrypt), Docker-ready

**Version Control:** GitHub, with a clear commit per phase milestone

---

## User Roles

1. **Super Admin** — full platform control
2. **Customer** — vehicle owner who buys/activates QR stickers
3. **Agent** — referral/reseller who sells physical stickers and earns commission
4. **Support Executive** — handles tickets, scan disputes (Phase 6+)

---

# PHASE 0 — Architecture & Setup

**Goal:** Foundation only. No business features yet.

- Initialize Next.js 15 project with TypeScript, Tailwind, Shadcn UI
- Set up PWA manifest, icons, service worker (installable, offline fallback page)
- Set up Supabase project structure: folders for `migrations`, `seed`, `types`
- Define full database schema (see Data Model section below) with SQL migrations
- Set up environment variable structure (`.env.example`) for Supabase, Razorpay, SMS/WhatsApp provider, Google Maps
- Set up project folder structure: `app/`, `components/`, `actions/`, `lib/`, `types/`, `validators/`, `emails/`, `notifications/`
- Set up GitHub repo with README explaining setup steps

**Deliverable:** Empty but fully scaffolded project that runs locally, connects to Supabase, and shows a placeholder homepage.

---

# PHASE 1 — Authentication & Customer Dashboard

**Goal:** A customer and agent can sign up, log in, and see an empty dashboard.

### Features
- Email + OTP login (no password-only flow — use Supabase Auth with OTP)
- Google login (optional toggle)
- Role assignment at signup: Customer or Agent (Admin assigned manually in DB)
- Session management via Supabase Auth + middleware route protection

### Customer Dashboard (empty state for now)
- Welcome card, "Add your first vehicle" CTA
- Sidebar: My Vehicles, My QR Stickers, Emergency Contacts, Subscription, Orders

### Agent Dashboard (empty state for now)
- Welcome card showing Agent Referral Code (generated automatically on signup)
- Sidebar: My Referral Link, Stickers Sold, Commission Earned, Payout History

**Deliverable:** Working login/signup for both roles, each seeing their own correct empty dashboard.

---

# PHASE 2 — QR Batch Generation, Vehicle Management & Activation Flow

**Goal:** This is the CORE of the product. Build the blank-QR → activation pipeline.

### QR Batch Generation (Admin-only action, can be a script/internal route for now)
- Generate N QR codes in a batch
- Each QR record: `qr_id (unique, short, URL-safe)`, `status (unactivated/active/suspended)`, `agent_id (nullable)`, `batch_id`, `created_at`
- Each QR points to: `https://saferideqr.in/scan/{qr_id}`
- Output: a printable sheet/PDF showing each QR code + qr_id (for the physical sticker printer)
- If `agent_id` is set on the batch, every QR in that batch is pre-tagged to that agent for commission tracking

### Public Scan Page (`/scan/{qr_id}`) — no login required for scanner
- If QR status = unactivated: show "This sticker is not active yet" + button "Are you the owner? Activate now"
- If QR status = active: show the 3 action buttons (Notify Owner / Wrong Parking / Emergency) — see Phase 3

### Activation Flow (customer-facing, triggered from the scan page)
- Customer logs in / signs up (OTP)
- Form: Vehicle Number, Vehicle Type, Brand, Model, Color, Year
- Form: Emergency Contact (name, relation, phone) — at least 1 required
- Optional: Medical Profile (blood group, allergies, conditions) — clearly marked optional, with a consent checkbox explaining how this data will be used (DPDP-compliant notice)
- Payment step (Razorpay) if activation has a fee — configurable amount in admin settings
- On successful payment: QR status → active, vehicle + owner linked, **agent commission record created if `agent_id` was tagged on this QR**

### Vehicle Management (Customer Dashboard)
- List of vehicles, each showing linked QR status
- Add/edit vehicle details
- Replace/report lost or damaged sticker (creates a new QR request, old one suspended)

**Deliverable:** Full working loop: admin generates 50 blank QR codes tagged to Agent X → printed → customer scans → activates → agent commission auto-recorded.

---

# PHASE 3 — Scan Actions: Notify, Wrong Parking, Emergency

**Goal:** Build what happens when someone scans an ACTIVE QR.

### Notify Owner
- Scanner enters a short message
- Owner receives SMS + WhatsApp + Email + in-dashboard notification

### Wrong Parking Module
- Scanner enters: reason (dropdown: blocking gate / lights on / wrong parking / other), optional photo upload, auto-captured GPS location
- Owner receives SMS/WhatsApp/Email with photo link + Google Maps location link
- Owner can mark as "Resolved" from dashboard

### Emergency Mode
- Scanner can: report accident, share live location, upload images
- ALL emergency contacts (priority order) receive SMS + WhatsApp + Email simultaneously with: GPS + Google Maps link, vehicle details, blood group, medical notes (only in this mode — never shown otherwise)
- A government emergency helpline popup (Police/Ambulance numbers, static list for India) shown to the scanner after submitting

### Scan Logging
- Every scan (regardless of action) logged with: timestamp, qr_id, action_type, location (if granted), IP (for abuse detection)

**Deliverable:** All 3 actions fully working end-to-end with real notifications firing.

---

# PHASE 4 — Subscription & Payments

**Goal:** Monetize activation + ongoing subscription.

- Plans: Free (basic SMS alerts only), Premium (WhatsApp + medical profile + priority support) — define feature flags per plan in DB, not hardcoded
- Razorpay Subscription integration: monthly/yearly, auto-renewal, grace period (7 days)
- Coupon code support
- GST invoice generation (PDF) per transaction
- Payment history in customer dashboard
- Webhook handling for Razorpay events (payment success/failure/subscription cancelled)

**Deliverable:** Customer can upgrade/downgrade plan, pay via Razorpay, download GST invoice.

---

# PHASE 5 — Agent / Referral Network Module

**Goal:** Make the offline-sales engine fully self-service for agents.

### Agent Signup & Referral Page
- Every agent gets a unique referral code AND a shareable public page: `saferideqr.in/agent/{referral_code}` — a simple landing page agents can share on WhatsApp showing product info + "Buy Now" (this purchase auto-tags the agent even for online-driven sales, not just physical stickers)
- Agent dashboard shows: total stickers tagged to them, activated vs unactivated, commission earned (pending/paid), referral link with copy button

### Commission Logic
- Commission is created when a QR tagged to that agent is **activated** (not just printed/handed out) — prevents fraud/unsold-stock claims
- Configurable commission amount per plan tier (admin sets this, e.g. ₹50 for Basic, ₹80 for Premium)
- Admin can mark commissions as "Paid" (manual payout for now — Razorpay payout/automated transfer can be a future phase)

### Admin View
- List all agents, their batches, sales, pending payouts
- Generate/export a payout report (CSV)

**Deliverable:** A real agent can sign up, get a code, sell stickers offline or share their link online, and see accurate commission tracking with zero manual entry from you.

---

# PHASE 6 — Admin Panel

**Goal:** Operational control center.

- Manage Users (customers + agents), Manage QR Inventory (batches, status, reprint requests)
- Manage Subscriptions & Payments (view, refund, manual override)
- Manage Coupons
- Scan abuse reports / suspicious activity flagging (basic: rate-limit repeated scans from same IP/device)
- Revenue dashboard (total sales, agent commission liability, net revenue)
- Basic CMS: FAQ page, Terms, Privacy Policy (DPDP-compliant draft)

**Deliverable:** You (as Super Admin) can run the entire business from this panel without touching the database directly.

---

# PHASE 7 — Notification Engine Hardening

**Goal:** Make notifications reliable, not just functional.

- Retry logic for failed SMS/WhatsApp/Email sends
- Delivery status tracking per notification
- Template system with variables (so messages aren't hardcoded strings)
- Rate limiting to prevent notification spam/abuse via repeated scans

**Deliverable:** Notification system that degrades gracefully and is auditable.

---

# PHASE 8 — Security Pass & Deployment

**Goal:** Production hardening before public launch.

- Supabase Row Level Security policies reviewed for every table (customers only see their own data, agents only see their own referrals, admin sees all)
- Rate limiting + Captcha on public scan page (prevent scraping/abuse)
- Audit logs for admin actions
- Encryption review for medical/sensitive fields at rest
- Deploy to Ubuntu VPS with PM2 + Nginx + SSL
- Basic uptime monitoring setup

**Deliverable:** Platform is live on a real domain, secured, and ready for the first agent pilot batch.

---

## Data Model (Build in Phase 0, reference throughout)

Core tables (design with UUID PKs, `created_at`, `updated_at`, soft delete where relevant):

- `users` (id, role, name, phone, email, created_at)
- `agents` (id, user_id, referral_code, created_at)
- `vehicles` (id, owner_id, vehicle_number, type, brand, model, color, year)
- `qr_codes` (id, qr_id, status, batch_id, agent_id, vehicle_id, activated_at, created_at)
- `qr_batches` (id, agent_id, quantity, print_status, created_at)
- `emergency_contacts` (id, vehicle_id, name, relation, phone, priority_order)
- `medical_profiles` (id, vehicle_id, blood_group, allergies, conditions, notes)
- `scans` (id, qr_id, action_type, location_lat, location_lng, photo_url, created_at)
- `subscriptions` (id, user_id, plan_id, status, razorpay_subscription_id, current_period_end)
- `plans` (id, name, price, features_json)
- `commissions` (id, agent_id, qr_id, amount, status, paid_at)
- `notifications_log` (id, scan_id, channel, status, retry_count)

Provide complete SQL migrations for all tables with proper foreign keys and indexes before writing any application code.

---

## AI Development Rules

- Never skip architecture. Never assume database structure — always show the schema before building a feature that depends on it.
- Explain every non-obvious decision briefly before implementing it.
- Generate production-ready code only — no placeholder/TODO logic in core flows (activation, payment, commission).
- Follow SOLID principles, avoid duplicate code, use reusable components.
- After each phase, summarize what was built and what to test manually before moving to the next phase.
- Do not jump ahead to a later phase even if it seems faster to combine work — confirm phase completion first.

---

**Start with Phase 0 now. Show me the full database schema and folder structure before writing any UI code.**
