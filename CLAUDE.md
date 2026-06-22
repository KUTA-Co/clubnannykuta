# Club Nanny

Faith-centered childcare partnership platform connecting families with trusted nannies for summer placements (8-12 weeks).

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix), React Router 6, React Hook Form + Zod, TanStack Query |
| Backend | Node.js + Express, **MongoDB + Mongoose** (ES modules) |
| Auth | JWT + bcryptjs, role-based (family/nanny/sitter/admin) |
| Email | Mailgun (domain: noreply.clubnanny.com) |
| Security | Helmet, rate limiting, CORS, CSRF, AES-256 encryption for localStorage |

## Project Structure

```
src/                    Frontend source (React SPA)
  pages/                44 page components
  components/           Reusable UI components
    ui/                 60+ shadcn/ui components
    ui/effects/         Custom visual effects (gradient, blur, glass)
  lib/                  Utilities (api, auth, validation, csrf, openai)
  hooks/                Custom React hooks
  types/                TypeScript type definitions
backend/                Backend API server
  src/
    server.js           Express server entry point (trust proxy enabled)
    config/database.js  MongoDB / Mongoose connection
    models/             Mongoose models (see Database section)
    controllers/        Business logic
    routes/             API route handlers
    middleware/          Auth + validation middleware
    services/           email, push, notification, matching, stripe, pdf (load dotenv independently)
    scripts/            One-off scripts (createAdmin, seed/migration helpers)
public/                 Static assets, PWA manifest, service worker
ecosystem.config.cjs    PM2 process config (frontend + backend)
nginx.conf              Nginx reverse proxy config
```

## Key Commands

```bash
# Frontend
npm run dev             # Vite dev server (port 8080)
npm run build           # Production build -> dist/
npm run serve           # Serve built files (port 3001)

# Backend
cd backend
npm run dev             # Express dev server with nodemon
npm start               # Production server

# Production (on server)
pm2 start ecosystem.config.cjs
pm2 restart all
pm2 logs club-nanny-api --lines 20
```

## Deployment

- **Server path**: `/var/www/club-nanny`
- **Domain**: www.clubnanny.com
- **SSL**: Certbot (auto-managed in nginx)
- **Frontend**: PM2 `club-nanny-frontend` — serves `dist/` on port 3001
- **Backend**: PM2 `club-nanny-api` — Express on port 3000
- **Nginx**: reverse proxy, routes `/api/*` to backend (port 3000), everything else to frontend (port 3001)
- **Frontend API calls**: use same-origin (empty string fallback), nginx proxies to backend — no CORS needed in production
- **Local dev**: set `VITE_API_URL=http://localhost:5001` in `.env` to hit backend directly

### Deploy steps

```bash
cd /var/www/club-nanny
git pull
npm install && npm run build       # frontend
cd backend && npm install && cd ..  # backend deps
pm2 restart all
sudo nginx -t && sudo systemctl reload nginx  # only if nginx.conf changed
```

### Backend Environment Variables (`backend/.env`)

```
PORT=5001                      # 3000 in production behind nginx
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/clubnanny
JWT_SECRET=<openssl rand -base64 48>
MAILGUN_API_KEY=<Mailgun private API key — blank = emails skipped (logged, no crash)>
MAILGUN_DOMAIN=noreply.clubnanny.com
FROM_EMAIL=Club Nanny <noreply@noreply.clubnanny.com>
STRIPE_SECRET_KEY=sk_test_...  # required for registration checkout
STRIPE_WEBHOOK_SECRET=whsec_...
# Web push (generate: npx web-push generate-vapid-keys)
VAPID_PUBLIC_KEY=...
VAPID_PRIVATE_KEY=...
VAPID_SUBJECT=mailto:support@clubnanny.com
```

Frontend `.env` needs `VITE_API_URL=http://localhost:5001` (dev) and `VITE_VAPID_PUBLIC_KEY=<same as backend public key>`.

## API Routes

(mounted in `backend/src/server.js`)
- `/api/auth/*` — register / login / me / password reset (family/nanny/sitter/admin)
- `/api/forms/*` — contact, family/nanny applications (rate-limited 10/hr)
- `/api/admin/*` — nanny-program admin (applications, payments, contacts)
- `/api/stripe/*` — Stripe checkout + webhook (raw body)
- `/api/push/*` — web-push subscribe/unsubscribe/vapid-public-key
- `/api/sitting/auth/*` — Club Sitting register/login (pay-first)
- `/api/sitter/*` — sitter profile, availability, jobs, bookings, reviews
- `/api/sitting/family/*` — family profile, requests, bookings, reviews
- `/api/admin/sitting/*` — Club Sitting admin (approve sitters, bookings, stats)
- `/api/health` — health check

## Email Service

Mailgun sends two emails per form submission:
- **Admin notification** to Leigh@clubnanny.com + thinuspretorius3@gmail.com
- **User confirmation** to the submitter

Three form types: contact, family application, nanny application. Templates include branded HTML and a "copy to spreadsheet" row for admin emails.

Note: `emailService.js` loads `dotenv` independently since ES module imports run before `server.js` can call `dotenv.config()`.

## Database

**MongoDB (Mongoose).** Connection in `backend/src/config/database.js` via `MONGODB_URI`. Schemaless — there are **no SQL migrations**. New schema fields apply to existing docs as Mongoose defaults on read; new indexes are auto-created on startup.

Collections (Mongoose models in `backend/src/models/`):
- **Nanny program / shared:** `User`, `FamilyApplication`, `NannyApplication`, `Match`, `Payment`, `ContactSubmission`, `PushSubscription`
- **Club Sitting:** `SitterProfile`, `SittingFamilyProfile`, `BookingRequest`, `SitterResponse`, `SitterAvailability`, `Review`

## Club Sitting (sitter side) — current state

Two-sided babysitting marketplace, separate from the nanny placement program. Flow: family posts a `BookingRequest` → sitters respond (`SitterResponse`) → family confirms one → booking is `confirmed` → `completed` → family reviews.

**Routes:** `/api/sitting/auth/*` (register/login, pay-first via Stripe), `/api/sitter/*` (profile, availability, jobs, bookings, reviews), `/api/sitting/family/*` (profile, requests, bookings, reviews), `/api/admin/sitting/*` (approve/suspend sitters, bookings, stats). Frontend under `/sitting/*` with `/login` and role-guarded dashboards (`SittingProtectedRoute`).

**Built & working** (see `CLUB_SITTING_TESTING.md` for the full QA checklist):
- Sign-in page (`/login`) + route protection for both dashboards
- Booking lifecycle: post → respond/withdraw → confirm → complete → cancel
- **Notifications** (email + push) on new job / response / confirm / cancel via `services/notificationService.js` (fire-and-forget; degrades gracefully if Mailgun/VAPID unset)
- **Completion**: auto (lazy on bookings GET, past-dated → completed) + manual buttons (family & sitter)
- **Sitter cancellation**: reopens the request and notifies the family
- **Reviews & ratings**: `Review` model + family review UI; sitter `averageRating`/`reviewCount` denormalized, shown on sitter cards & dashboard
- **Calendar view**: `components/sitting/BookingCalendar.tsx` with List/Calendar toggle on both Bookings pages
- Sitter Dashboard wired to real API (was hardcoded test data)
- **Availability** page wired to the real API (was a non-functional stub)
- **Admin sitter-approval UI**: `pages/admin/SittingSitters.tsx` + `SittingSitterDetail.tsx` (approve/reject/suspend/activate) under `/admin/sitters`, "Club Sitting" sidebar item
- **Sitter job-detail page**: `pages/sitting/sitter/JobDetail.tsx` at `/sitting/sitter/jobs/:id` (respond/withdraw)
- **In-app notifications**: `Notification` model + `/api/notifications/*` + `components/NotificationBell.tsx` in both dashboards (3rd channel alongside email + push)
- **Profile photo upload**: base64, client-resized (`lib/imageResize.ts`) via the existing `POST /api/sitter/profile/photo`
- **Booking auto-expiry**: `expired` status + lazy `expirePastOpenRequests()` sweep on jobs/requests GET
- **Login redirect** uses `check-profile` to route by actual sitting profile; registration `complete/*` is now idempotent
- **Booking-level payment (Stage 1)**: family pays the sitter per booking via Stripe Checkout. `BookingRequest.payment` subdoc; amount = `matchingService.computeBookingAmount()` (hours × the sitter's rate by child-count); `stripeService.createBookingPaymentSession()` (metadata `paymentType: 'booking_payment'`); `POST /api/sitting/family/bookings/:id/pay` returns a Checkout url; the `/api/stripe/webhook` `handleBookingPaymentSuccess()` marks it `paid` (idempotent) and fires `notificationService.notifyBookingPaid()`. "Pay Sitter"/"Paid" UI on family Bookings, read-only badge on sitter Bookings, paid totals on admin `SittingSitterDetail`. Platform fee is `BOOKING_PLATFORM_FEE_PERCENT = 0` (pass-through; sitter paid out off-platform). Refunds are manual (Stripe dashboard).

**Remaining gaps (not yet built):**
- **Stage 2 booking payment**: Stripe Connect sitter onboarding + automated payouts/escrow, and auto-refund on cancellation (currently manual). Needs payout/refund policy.
- Membership is a one-time first-month charge — no recurring renewal yet (admin manages manually)
- Push only reaches users who clicked "Enable" (or pre-granted); requires VAPID keys configured

### Handoff — how to test (for the next person)

Full tickable checklist: **`CLUB_SITTING_TESTING.md`** (sections 1–15). Quick path:

1. **Run:** `cd backend && npm run dev` (port 5001) + `npm run dev` (frontend 8080). `.env` files already exist; for live data point `MONGODB_URI` at the real DB. ⚠️ **Never run data-clearing DB commands — this is the live/production DB.**
2. **Prereqs:** need an `active` sitter + `active` family in the **same city/state**. New sitters start `pending_approval`.
3. **Unblock first:** log in as **admin** → sidebar "Club Sitting" (`/admin/sitters`) → approve a pending sitter so they go `active` (this gate blocks the whole flow).
4. **Run the flow:** family posts a request → sitter's bell + email/push fire → sitter responds → family confirms → family pays the sitter ("Pay Sitter" → Stripe Checkout, test card `4242…`) → mark complete → family leaves a review (sitter rating updates).
5. **Also verify:** availability persists, job-detail page, profile photo upload, calendar view, sitter cancel (reopens request), auto-expiry (past-dated open request → `expired`), login redirects by role. Booking payment needs `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET` (use `stripe listen --forward-to localhost:5001/api/stripe/webhook` locally).

Email needs `MAILGUN_API_KEY`; push needs VAPID keys (backend + `VITE_VAPID_PUBLIC_KEY`). Without them, those channels are skipped/logged — **in-app notifications still work**, and nothing crashes.

### What's left on the sitter side
Everything in the booking flow is built and wired to the real API (sign-in, profile, photo, availability, jobs, job detail, booking lifecycle, calendar, completion, cancellation, reviews, **booking payment Stage 1**, in-app/email/push notifications, admin approval). Only **Stage 2 booking payment** (Stripe Connect payouts/escrow + auto-refund) and **recurring membership renewal** remain — see "Remaining gaps" above.

## Design System

- **Colors**: Cream background (#FAF9F6), sage green accent (#8BA99E), black primary
- **Fonts**: Cormorant Garamond (headings), Satoshi (body/UI)
- **Approach**: Mobile-first, Tailwind utility classes, HSL color tokens
