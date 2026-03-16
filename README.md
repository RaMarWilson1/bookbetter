# BookBetter

A modern SaaS booking platform for independent service professionals — barbers, tattoo artists, massage therapists, nail techs, and more.

**Live:** [bookbetter.vercel.app](https://bookbetter.vercel.app)  
**Domain:** [thebookbetter.com](https://thebookbetter.com) *(pending configuration)*

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **Database:** Vercel Postgres + Drizzle ORM
- **Auth:** NextAuth v5 (Google OAuth + email/password credentials)
- **Deployment:** Vercel

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- A Vercel account (for Postgres)
- A Google Cloud project (for OAuth)

### 1. Clone the repo

```bash
git clone https://github.com/ramarwilson1/bookbetter.git
cd bookbetter
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the project root:

```env
# Database (Vercel Postgres)
DATABASE_URL=postgres://...
POSTGRES_URL=postgres://...

# Auth
NEXTAUTH_SECRET=         # Generate with: npx auth secret
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 4. Set up Google OAuth

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://bookbetter.vercel.app`
4. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://bookbetter.vercel.app/api/auth/callback/google`
5. Copy Client ID and Secret to `.env.local`

### 5. Push the database schema

```bash
npm run db:push
```

This creates all 14 tables in your Vercel Postgres database.

### 6. Run the dev server

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── [...nextauth]/route.ts     # NextAuth handler
│   │   │   └── register/route.ts          # Email/password registration
│   │   ├── dashboard/
│   │   │   ├── appointments/[id]/route.ts # Status updates
│   │   │   ├── availability/             # CRUD for time slots
│   │   │   ├── reviews/[id]/route.ts     # Respond to reviews
│   │   │   ├── services/                 # CRUD for services
│   │   │   └── settings/                 # Profile & business updates
│   │   └── onboarding/route.ts           # Business setup
│   ├── auth/
│   │   ├── layout.tsx                    # Split-screen auth layout
│   │   ├── sign-in/page.tsx
│   │   ├── sign-up/page.tsx
│   │   ├── error/page.tsx
│   │   └── _components/oauth-buttons.tsx
│   ├── dashboard/
│   │   ├── layout.tsx                    # Auth guard + shell wrapper
│   │   ├── page.tsx                      # Overview
│   │   ├── _components/
│   │   │   ├── dashboard-shell.tsx       # Sidebar + mobile nav
│   │   │   └── overview-content.tsx
│   │   ├── appointments/                 # Filter, view, update status
│   │   ├── availability/                 # Weekly schedule + time off
│   │   ├── clients/                      # Client list + search
│   │   ├── reviews/                      # View + respond
│   │   ├── services/                     # Add, edit, delete services
│   │   └── settings/                     # Profile + business settings
│   ├── onboarding/
│   │   ├── layout.tsx                    # Checks if already onboarded
│   │   ├── page.tsx
│   │   └── _components/onboarding-form.tsx
│   ├── layout.tsx                        # Root layout + SessionProvider
│   ├── providers.tsx                     # Client-side providers
│   └── page.tsx                          # Homepage
├── db/
│   ├── index.ts                          # Drizzle client
│   └── schema.ts                         # 14-table schema
├── lib/
│   ├── auth.ts                           # NextAuth v5 config
│   └── auth-utils.ts                     # Server-side auth helpers
├── proxy.ts                              # Route protection (middleware)
└── types/
    └── next-auth.d.ts                    # Session type extensions
```

---

## Database Schema

14 tables managed with Drizzle ORM:

**Auth:** users, accounts, sessions, verification_tokens  
**Business:** tenants, staff_accounts, categories  
**Booking:** services, bookings, availability_templates, availability_exceptions  
**Payments:** payment_intents  
**Engagement:** reviews, notifications

### Key relationships

- A **user** can be a client, pro, or staff member
- A **tenant** (business) is created during onboarding and linked to a user via **staff_accounts**
- **Services** belong to a tenant and are booked by clients
- **Availability templates** define weekly hours; **exceptions** handle time off

### Database commands

```bash
npm run db:push       # Push schema to database
npm run db:studio     # Open Drizzle Studio (visual DB browser)
npm run db:generate   # Generate migration files
```

---

## Auth Flow

1. **Sign up** → Choose role (pro or client) → Register via email/password or Google OAuth
2. **Pro users** → Redirected to `/onboarding` → 4-step business setup
3. **Onboarding** → Creates tenant + staff account → Updates user role to `pro` → Redirects to dashboard
4. **Dashboard access** → Protected by proxy (middleware) → Requires `pro` or `staff` role

JWT tokens include `id` and `role`, updated via `session.update()` after onboarding.

---

## Features Built

### Authentication
- Google OAuth + email/password with bcrypt hashing
- Role-based access control (client, pro, staff)
- Protected routes via Next.js proxy (middleware)

### Onboarding (4 steps)
- Business name + auto-generated booking URL
- Business category selection (12 types)
- Location & contact info (optional)
- First service setup (optional)

### Professional Dashboard
- **Overview** — Stats, today's schedule, quick actions
- **Services** — Full CRUD with pricing, duration, deposits, buffer time
- **Availability** — Weekly schedule editor, time-off management
- **Appointments** — Filterable list, status updates (confirm/complete/cancel)
- **Clients** — Searchable client list from booking history
- **Reviews** — Star ratings, respond to reviews inline
- **Settings** — Profile, business info, booking link, sign out

### Responsive Design
- Desktop: Fixed sidebar navigation
- Mobile: Hamburger menu with slide-out drawer

---

## Deployment

The app is deployed on Vercel with automatic deployments from the `main` branch.

### Environment variables on Vercel

Set these in your Vercel project settings → Environment Variables:

```
DATABASE_URL
POSTGRES_URL
NEXTAUTH_SECRET
NEXTAUTH_URL=https://bookbetter.vercel.app
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
```

### Custom domain

To configure `thebookbetter.com`:

1. Go to Vercel → Project Settings → Domains
2. Add `thebookbetter.com`
3. Update DNS records at your registrar as Vercel instructs
4. Update `NEXTAUTH_URL` to `https://thebookbetter.com`
5. Add the new domain to Google OAuth authorized origins and redirect URIs

---

## What's Next

- [ ] Client-facing booking page (`/book/[slug]`)
- [ ] Stripe payment integration (deposits + full payments)
- [ ] Email notifications (Resend)
- [ ] SMS notifications (Twilio)
- [ ] White-label branding (Business tier)
- [ ] Custom domain configuration (thebookbetter.com)
- [ ] Admin analytics & reporting
- [ ] Apple OAuth

---

## Scripts

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:push      # Push schema changes
npm run db:studio    # Open Drizzle Studio
```

---

## License

Proprietary — All rights reserved.