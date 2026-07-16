# 🩺 MediBook — Doctor Appointment Booking Platform

A full-stack healthcare booking app: patients find doctors, book appointments against real-time availability and pay a deposit, while doctors manage their schedule and bookings from a dedicated dashboard.

![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Prisma](https://img.shields.io/badge/Prisma-7-2D3748) ![Tailwind](https://img.shields.io/badge/Tailwind-v4-38BDF8)

---

## ✨ Features

- 🔎 **Doctor discovery** — browse & filter doctors by specialty and city
- 📅 **Real-time availability** — bookable slots computed from each doctor's weekly schedule
- 🔒 **Double-booking prevention** — enforced at the database level, not just the UI
- 💳 **Deposit payments** — mock payment flow, structured for a drop-in Stripe/Razorpay replacement (`src/lib/payments.ts`)
- 🧑‍⚕️ **Two portals** — patient dashboard (appointments, history) and doctor dashboard (schedule, bookings)
- 🔐 **Role-based auth** — JWT sessions with Patient / Doctor roles, enforced in middleware

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) · React 19 · TypeScript 5 |
| UI | Tailwind CSS v4 · shadcn/ui |
| Database | Prisma 7 ORM · PostgreSQL (Neon) via `@prisma/adapter-pg` |
| Auth | Custom JWT (`jose`) + `bcryptjs` — route protection in `src/proxy.ts` |
| Forms | React Hook Form + Zod validation |

## 📋 Prerequisites

| Tool | Version | Why |
|---|---|---|
| **Node.js** | **20.19+, 22.12+, or 24+** | Prisma 7 refuses to install on older versions (e.g. 20.18 fails) |
| **pnpm** | 9+ | Package manager used by this repo |

> 💡 Using **nvm**? The repo has a `.nvmrc`, so just run `nvm use` inside the project folder (run `nvm install 24` first if needed).

## 🚀 Setup (step by step)

**1. Clone and enter the project**

```bash
git clone <repo-url>
cd mediabook
```

**2. Use the right Node version**

```bash
nvm use          # reads .nvmrc → Node 24
node -v          # verify: should print v24.x (or 20.19+/22.12+)
```

**3. Install dependencies**

```bash
pnpm install
```

**4. Create your environment file**

```bash
cp .env.example .env
```

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | Your Neon PostgreSQL connection string (pooled `-pooler` host for Vercel) |
| `AUTH_SECRET` | ✅ | JWT signing secret — generate one with `openssl rand -base64 32` |

**5. Create the database and load demo data**

```bash
pnpm db:migrate   # creates the tables in your Neon database
pnpm db:seed      # loads 8 users, 6 doctor profiles, availability slots & appointments
```

**6. Start the dev server**

```bash
pnpm dev
```

Open **http://localhost:3000** 🎉

## 🔑 Demo accounts

All seeded accounts share the password **`Demo@1234`**:

| Role | Email |
|---|---|
| Patient | `patient@medibook.dev` |
| Patient | `patient2@medibook.dev` |
| Doctor | `dr.kapoor@medibook.dev` |
| Doctor | `dr.verma@medibook.dev` · `dr.nair@medibook.dev` · `dr.singh@medibook.dev` · `dr.rao@medibook.dev` · `dr.patel@medibook.dev` |

## 📜 Available scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the development server |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm db:migrate` | Apply database migrations |
| `pnpm db:seed` | Seed demo data |
| `pnpm db:generate` | Regenerate the Prisma client (into `src/generated/prisma`) |
| `pnpm db:reset` | ⚠️ Drop, recreate, and re-migrate the database |

## 🗂 Project structure

```
mediabook/
├── prisma/
│   ├── schema.prisma      # User, DoctorProfile, AvailabilitySlot,
│   │                      # Appointment, Payment
│   └── seed.ts            # Demo data
├── src/
│   ├── app/
│   │   ├── doctors/       # Public: doctor list + profile pages ([id])
│   │   ├── booking/       # Patient: booking & payment flow ([appointmentId])
│   │   ├── dashboard/     # Patient dashboard
│   │   ├── doctor/        # Doctor portal: schedule & bookings
│   │   ├── login/ · register/
│   │   ├── layout.tsx     # Root layout: fonts, SEO metadata
│   │   ├── manifest.ts    # PWA manifest · robots.ts / sitemap.ts for SEO
│   │   └── icon.svg       # Favicon (+ favicon.ico, apple-icon.png)
│   ├── components/        # UI (shadcn) + layout components
│   ├── lib/
│   │   ├── actions/       # Server actions: doctors, booking, doctor-dashboard
│   │   ├── payments.ts    # Mock payment processor (swap in Stripe/Razorpay here)
│   │   ├── auth.ts        # Password hashing, JWT
│   │   ├── session.ts     # Session helpers
│   │   └── db.ts          # Prisma client
│   └── proxy.ts           # Route protection (Next 16 middleware)
└── .env.example           # Environment variable reference
```

**Access rules** (enforced in `src/proxy.ts`): home and `/doctors` are public · `/dashboard` and `/booking` require login · `/doctor` requires the Doctor role.

## 🌐 SEO

- Open Graph + Twitter card metadata in `layout.tsx` (link previews on WhatsApp/LinkedIn/X)
- `robots.ts` — private areas (`/dashboard`, `/booking`, `/doctor`) excluded from indexing
- `sitemap.ts` — **dynamic**: every doctor's public profile page is listed automatically
- Full favicon set: SVG + multi-size `.ico` + apple-touch + Android/PWA icons via `manifest.ts`

## 🔧 Troubleshooting

**`Prisma only supports Node.js versions 20.19+, 22.12+, 24.0+` during `pnpm install`**
Your Node is too old. Run `nvm use` (or `nvm install 24 && nvm use 24`) and reinstall.

**Login/session issues after changing `AUTH_SECRET`**
Old session cookies become invalid — just log in again.

**`Error: @prisma/client did not initialize yet`**
Run `pnpm db:generate`, then restart the dev server.

## ☁️ Deployment

Deploys cleanly to **Vercel**:

1. Set `DATABASE_URL` to your Neon **pooled** connection string (the `-pooler` host)
2. Set env vars: `DATABASE_URL` and `AUTH_SECRET`
3. Replace the mock payment processor in `src/lib/payments.ts` with a real provider before accepting actual payments
4. Update the placeholder domain (`medibook.example.com`) in `src/app/layout.tsx`, `robots.ts`, and `sitemap.ts`, then submit the sitemap in [Google Search Console](https://search.google.com/search-console)

---

Built by **Rohit Malviya** — full-stack developer.
