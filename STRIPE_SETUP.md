# Stripe Setup — Club Sitting Payments (Go-Live Checklist)

Payments run on **Stripe** (not Paystack/PayFast). The code is complete — going live is **pure
configuration**. The **frontend needs no Stripe key** (we use Stripe Checkout, which redirects to
Stripe's own hosted page), so everything below is on the **backend**.

## What Stripe covers in this app
- **Booking payment** — a family pays the sitter per confirmed booking ("Pay Sitter" button →
  Stripe Checkout → booking marked **Paid**). Amount = hours × the sitter's hourly rate.
- **Membership / application fees** — sitter $45 application + $12/month, family $20/month
  (collected during the pay-first registration flow).

---

## 1. Backend environment variables (`backend/.env` on the production server)

```
# Live keys from the company's Stripe dashboard (Developers → API keys, Live mode)
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx

# Signing secret of the webhook you create in step 2
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# MUST be the real public site — Stripe redirect/success URLs are built from this
FRONTEND_URL=https://www.clubnanny.com
```

> `FRONTEND_URL` is important: after payment, Stripe sends the user back to
> `${FRONTEND_URL}/...` . If it's wrong, the success/return page won't load.

There is **no** `STRIPE_PUBLISHABLE_KEY` needed for the app to work (Checkout redirect flow). It can
stay unset.

## 2. Create the webhook in the Stripe dashboard

The webhook is what tells the app "payment succeeded → mark the booking/registration paid." Without
it, money is taken but the booking won't flip to **Paid**.

1. Stripe Dashboard → **Developers → Webhooks → Add endpoint**.
2. **Endpoint URL:** `https://www.clubnanny.com/api/stripe/webhook`
3. **Events to send:** `checkout.session.completed` and `checkout.session.expired`
4. Save, then click **Reveal** on the **Signing secret** (`whsec_…`) and put it in
   `STRIPE_WEBHOOK_SECRET` (step 1).

(The server already mounts the raw-body parser for `/api/stripe/webhook` before JSON parsing, which
Stripe signature verification requires — no code change needed.)

## 3. Deploy / restart

After editing `backend/.env`, restart the API so it picks up the keys:
```
pm2 restart club-nanny-api
```

---

## Optional: verify the flow in TEST mode first (no real money)

Do this before flipping live keys if you want to see it work end-to-end:

1. Put **test** keys in `backend/.env`: `STRIPE_SECRET_KEY=sk_test_…`
2. Install the Stripe CLI and run it to forward webhooks to your local server:
   ```
   stripe listen --forward-to localhost:5001/api/stripe/webhook
   ```
   It prints a `whsec_…` — put that in `STRIPE_WEBHOOK_SECRET` and restart the backend.
3. In the app: confirm a booking → **Pay Sitter** → pay with test card **`4242 4242 4242 4242`**
   (any future expiry, any CVC, any ZIP).
4. The booking should flip to **Paid** and the sitter gets a "Payment Received" notification.

The company will do the same with their **live** keys + a small real charge to confirm money lands in
their account — that's the final go-live confirmation.

---

## ⚠️ One code task before charging for memberships (not blocking booking payment)

Booking payment works as-is. But **registration is currently in a no-payment test mode**:
`src/pages/sitting/SitterRegistration.tsx` and `FamilyRegistration.tsx` call the
`/api/sitting/auth/register-test/*` endpoints, which **skip Stripe** and auto-activate the account.

To actually **charge the membership/application fees** in production, the registration submit needs
to switch to the **pay-first** flow (all already built on the backend):
`register/*` → Stripe Checkout → `RegistrationComplete` page → `complete/*`. This also re-enables the
**admin approval gate** (sitters become `pending_approval` instead of auto-active).

Note: the registration forms were redesigned with extra fields (faith questions, per-kid rates, date
of birth). When switching, make sure `complete/sitter` + the `RegistrationComplete` payload carry
**all** of those fields so none are dropped. This is a deliberate, separate task (left in test mode
for now so local testing stays frictionless).
