# SafeRide QR

Smart QR sticker platform for Indian vehicle owners. Protect your bike, car, or scooter — get instant alerts without exposing your phone number.

## Tech Stack

- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS, Shadcn UI, PWA
- **Backend**: Next.js Server Actions + Route Handlers
- **Database**: Supabase (PostgreSQL + Auth + Storage + RLS)
- **Payments**: Razorpay (Orders + Subscriptions)
- **Notifications**: Exotel (SMS + WhatsApp), Resend (Email)
- **Maps**: Google Maps API

## Getting Started

### 1. Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account (test mode OK for development)
- An [Exotel](https://exotel.com) account for SMS/WhatsApp
- A [Resend](https://resend.com) account for email

### 2. Clone & Install

```bash
git clone https://github.com/your-org/saferideqr.git
cd saferideqr
npm install
```

### 3. Environment Variables

```bash
cp .env.example .env.local
# Edit .env.local and fill in your credentials
```

### 4. Database Setup

Run the migrations in order inside the **Supabase SQL Editor**:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_row_level_security.sql
```

Then seed the default plans:

```
supabase/seed/001_seed_plans.sql
```

### 5. Run Locally

```bash
npm run dev
# Open http://localhost:3000
```

## Project Structure

```
src/
├── app/                  # Next.js App Router pages
│   ├── (auth)/           # Auth routes: login, signup, OTP
│   ├── dashboard/        # Customer dashboard
│   ├── agent/            # Agent dashboard
│   ├── admin/            # Super Admin panel
│   ├── scan/[qr_id]/     # Public QR scan page
│   └── api/              # Route handlers (webhooks etc.)
├── actions/              # Server Actions (form submissions, DB writes)
├── components/
│   ├── ui/               # Shadcn UI primitives
│   ├── layout/           # Sidebar, Nav, Shell
│   └── shared/           # Reusable feature components
├── emails/               # Email HTML templates
├── lib/
│   └── supabase/         # Supabase client (browser / server / admin)
├── notifications/        # SMS, WhatsApp, Email send functions
├── types/                # TypeScript types mirroring DB schema
└── validators/           # Zod schemas for all user inputs

supabase/
├── migrations/           # SQL migration files (run in order)
├── seed/                 # Seed data for dev/staging
└── types/                # Generated Supabase TypeScript types
```

## Build Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 0 | ✅ Complete | Architecture, schema, scaffolding |
| 1 | 🔲 Next | Auth (OTP login), Customer + Agent dashboards |
| 2 | 🔲 | QR batch generation, vehicle management, activation flow |
| 3 | 🔲 | Scan actions: Notify, Wrong Parking, Emergency |
| 4 | 🔲 | Subscription & payments (Razorpay) |
| 5 | 🔲 | Agent / referral network |
| 6 | 🔲 | Admin panel |
| 7 | 🔲 | Notification engine hardening |
| 8 | 🔲 | Security pass & VPS deployment |

## Deployment (Phase 8)

Target: Ubuntu VPS with PM2 + Nginx + SSL (Let's Encrypt)

```bash
npm run build
pm2 start npm --name saferideqr -- start
```

Nginx config and PM2 ecosystem file will be added in Phase 8.
