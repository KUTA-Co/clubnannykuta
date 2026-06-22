# Club Nanny Clone Deployment

Goal: run a parallel Club Nanny clone on our own GitHub/Vercel/domain without touching the current live `clubnanny.com` deployment.

## Recommended Fast Setup

Use these services:

- GitHub: source repo and push-to-deploy.
- Vercel: React/Vite frontend.
- Render or Railway: Express backend API.
- MongoDB Atlas: clone/staging database.
- Stripe: test keys first, live keys later if/when the clone is production-ready.
- GoDaddy: DNS for the temporary/staging domain.
- Mailgun: optional at first. Without `MAILGUN_API_KEY`, emails are skipped and the API does not crash.

This is faster and safer than converting the Express backend to Vercel serverless functions.

## Frontend on Vercel

Create a Vercel project from GitHub:

- Root directory: repo root
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Frontend environment variables:

```env
VITE_API_URL=https://your-backend-host.com
VITE_VAPID_PUBLIC_KEY=your-vapid-public-key
VITE_GA4_MEASUREMENT_ID=
VITE_ENCRYPTION_KEY=generate-a-random-string
```

`VITE_API_URL` must point to the backend API URL. If this is wrong, login, applications, payments, and sitting dashboards will fail.

## Backend on Render or Railway

Create a Node/Express web service from GitHub:

- Root directory: `backend`
- Build command: `npm install`
- Start command: `npm start`

Backend environment variables:

```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=generate-a-long-random-secret

FRONTEND_URL=https://your-frontend-domain.com
ALLOWED_ORIGINS=https://your-frontend-domain.com

STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

MAILGUN_API_KEY=
MAILGUN_DOMAIN=
FROM_EMAIL=Club Nanny <noreply@your-domain.com>
SUPPORT_EMAIL=your-support-email@example.com
ADMIN_EMAILS=your-admin-email@example.com

VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your-support-email@example.com
```

Do not set `PORT` unless the host asks for it. Render/Railway usually inject the correct port automatically, and the backend already uses `process.env.PORT`.

## Stripe

Start with Stripe test mode:

- `STRIPE_SECRET_KEY`: test secret key from Stripe.
- `STRIPE_PUBLISHABLE_KEY`: test publishable key from Stripe.
- `STRIPE_WEBHOOK_SECRET`: webhook signing secret for the deployed backend endpoint.

Webhook endpoint:

```text
https://your-backend-host.com/api/stripe/webhook
```

Events to send:

```text
checkout.session.completed
```

After changing the Stripe webhook, restart/redeploy the backend.

## MongoDB

For a safe first clone, create a new MongoDB Atlas database instead of using the current live database.

If you need a blank admin account:

```bash
cd backend
npm run create-admin -- your@email.com "a-long-secure-password"
```

If you need exact live data, we need one of these:

- current live `MONGODB_URI`, or
- a database export/dump from the current host/MongoDB Atlas.

## GoDaddy DNS

First add the domain/subdomain inside the hosting dashboard, then add the DNS records GoDaddy shows/needs.

Recommended:

- Frontend: `app.your-domain.com` or `staging.your-domain.com` on Vercel.
- Backend: keep the host URL at first, or use `api.your-domain.com` once the backend is stable.

Vercel will show whether the frontend domain needs an `A` record or `CNAME`. Render/Railway will show the backend `CNAME` target if using `api.your-domain.com`.

## Smoke Test Checklist

- `/api/health` returns healthy from the backend.
- Frontend loads on the staging domain.
- User registration/login works.
- Admin login works.
- Family application opens Stripe test Checkout.
- Nanny application opens Stripe test Checkout.
- Stripe test payment returns to the correct staging frontend URL.
- Stripe webhook marks the payment/application/booking correctly.
- Sitting family registration and sitter registration work.
- Booking payment flow works with Stripe test card `4242 4242 4242 4242`.
- PWA install popup and Download App instructions show correctly on Edge/Chrome/Firefox/mobile.

## What We Still Need From Accounts

Required:

- GitHub repo access.
- Vercel account/project access.
- Backend host account: Render, Railway, or VPS.
- MongoDB Atlas connection string.
- Stripe test keys and webhook secret.
- GoDaddy DNS access.

Optional for first staging pass:

- Mailgun sending domain/API key.
- GA4 measurement ID.
- Live Stripe keys.
