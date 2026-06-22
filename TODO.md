# Club Nanny - To-Do List

> Last updated: 2026-05-19

## Pending Tasks

### High Priority

- [ ] **Activate Google Analytics 4**
  - Code is ready - just needs Measurement ID in `.env`
  - Steps:
    1. Go to: https://analytics.google.com
    2. Create a new GA4 property for "Club Nanny"
    3. Admin > Data Streams > Add stream > Web
    4. Enter `clubnanny.com` as the URL
    5. Copy the Measurement ID (starts with `G-`)
    6. Add to `.env`: `VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`
    7. Rebuild and deploy
  - What's already tracking:
    - All page views (automatic on route change)
    - Contact form submissions
    - Family application submissions
    - Nanny application submissions
  - Optional: Add more events using `trackEvent()` from `src/lib/analytics.ts`

- [ ] **Setup Mailgun sending domain (mg.clubnanny.com)**
  - New domain: `mg.clubnanny.com`
  - From email: `noreply@mg.clubnanny.com`

  **Step 1: Add domain in Mailgun**
  1. Go to: https://app.mailgun.com/app/sending/domains
  2. Click "Add New Domain"
  3. Enter: `mg.clubnanny.com`
  4. Select region (US or EU)

  **Step 2: Add DNS records** (in your domain registrar)
  Mailgun will show you the exact records. Typically:
  - TXT record: `mg.clubnanny.com` → SPF value
  - TXT record: `mailo._domainkey.mg.clubnanny.com` → DKIM value
  - CNAME: `email.mg.clubnanny.com` → `mailgun.org` (for tracking)

  **Step 3: Verify in Mailgun**
  - Click "Verify DNS Settings" in Mailgun
  - Wait for green checkmarks (can take a few minutes)

  **Step 4: Update backend/.env on server**
  ```
  MAILGUN_DOMAIN=mg.clubnanny.com
  FROM_EMAIL=Club Nanny <noreply@mg.clubnanny.com>
  ```

  **Step 5: Deploy**
  ```bash
  cd /var/www/club-nanny/backend
  # Edit .env with new values
  pm2 restart club-nanny-api
  ```

  **Step 6: Test**
  - Submit a contact form on the site
  - Check if emails arrive

- [ ] **Google Search Console**
  - Go to: https://search.google.com/search-console
  - Verify site ownership
  - Submit sitemap: https://clubnanny.com/sitemap.xml
  - Important for SEO indexing

- [ ] **Google Business Profile**
  - Go to: https://business.google.com
  - Create listing for "Club Nanny - Auburn, AL"
  - Add address, phone, hours
  - Important for local search ("Nanny services Auburn Alabama")

### After Changes - Deploy

```bash
cd /var/www/club-nanny
git pull
npm install && npm run build
cd backend && npm install && cd ..
pm2 restart all
```

---

## Completed Today (2026-05-19)

- [x] **Auth rate limiting** - Login (5/15min), Register (5/hr), Password reset (3/hr)
- [x] **JWT expiration reduced** - Changed from 7 days to 24 hours
- [x] **Error message sanitization** - 40+ error responses no longer leak internal details
- [x] **Secure storage implemented** - AES-256 encrypted localStorage (`src/lib/auth.ts`)
- [x] **AuthContext updated** - Now uses secureStorage instead of plain localStorage
- [x] **CORS hardened** - Dev URLs only included in development mode
- [x] **SECURITY.md updated** - Now accurately reflects what's implemented

---

## Completed (2026-05-18)

- [x] SEO - Added Auburn, Alabama keywords and LocalBusiness schema
- [x] Security audit - Full codebase scan
- [x] JWT secret rotated (64-byte random)
- [x] npm vulnerabilities fixed (backend: 0, frontend: 2 dev-only)
- [x] Admin scripts secured (removed hardcoded passwords)
- [x] Git history verified clean (no secrets exposed)
- [x] Folder structure organized (_design/, docs/)
- [x] Removed loop-backend folder
- [x] Committed and pushed all changes

---

## Security Status

| Feature | Status |
|---------|--------|
| JWT Auth | 24hr expiration |
| Rate Limiting | Login, Register, Password Reset, Forms |
| Input Sanitization | All routes |
| Secure Storage | AES-256 encrypted |
| Error Handling | Generic messages in production |
| CORS | Production-only origins |
| Password Hashing | bcrypt 12 rounds |

---

## APIs Status

| API | Status | Needs Rotation |
|-----|--------|----------------|
| Stripe | Safe (never leaked) | No |
| Mailgun | Safe (never leaked) | Optional |
| MongoDB | Safe (private network) | No |
| JWT Secret | Rotated (64-byte) | Done |

---

## Quick Links

- Mailgun: https://app.mailgun.com/app/account/security/api_keys
- Stripe: https://dashboard.stripe.com/apikeys
- Google Search Console: https://search.google.com/search-console
- Google Business: https://business.google.com
- Server: `ssh` to your server, `cd /var/www/club-nanny`
## PWA TODO

- [ ] Add NotificationPermission component to user profile/settings page
  - Component ready at: src/components/NotificationPermission.tsx
  - Has 3 variants: 'card', 'inline', 'compact'
  - Usage: <NotificationPermission variant="inline" />

