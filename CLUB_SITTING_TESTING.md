# Club Sitting — Sitter Side Test Checklist

This is the QA checklist for the sitter-side work. Hand to a tester who has **logins + a live/seeded MongoDB**. Tick each item; note any error with the page/endpoint and the console output.

> **Stack reminder:** backend is **Node + Express + MongoDB (Mongoose)** — NOT SQL Server. No SQL migrations exist or are needed.

---

## 0. Prerequisites (must be true before testing the flow)

- [ ] Backend running (`cd backend && npm run dev`, port 5001) and frontend running (`npm run dev`, port 8080).
- [ ] `backend/.env` has `MONGODB_URI`, `JWT_SECRET`, and (for push) `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` / `VAPID_SUBJECT`. For email, `MAILGUN_API_KEY` (if blank, emails are **skipped** and logged — not an error).
- [ ] Frontend `.env` has `VITE_API_URL=http://localhost:5001` and `VITE_VAPID_PUBLIC_KEY` matching the backend public key.
- [ ] At least **one sitter** account that is `status: active` AND `membershipStatus: active` (new sitters start `pending_approval` — an admin must approve via `PUT /api/admin/sitting/sitters/:id/approve`, or set it directly in Mongo). **A pending sitter cannot see or respond to jobs by design.**
- [ ] At least **one family** account that is `status: active` / `membershipStatus: active`.
- [ ] **Sitter and family must share the same `city` + `state`** — job matching is city/state based.

---

## 1. Authentication (NEW: sign-in + route protection)

- [ ] Visiting `/sitting/sitter` or `/sitting/family` while **logged out** redirects to `/login`.
- [ ] `/login` page renders (Club Sitting logo, email + password).
- [ ] Wrong password → red "Sign in failed" toast, stays on page.
- [ ] Correct sitter login → redirects to `/sitting/sitter`.
- [ ] Correct family login → redirects to `/sitting/family`.
- [ ] A logged-in **sitter** visiting `/sitting/family` is bounced to `/sitting/sitter` (and vice-versa).
- [ ] After login, refreshing the page keeps you logged in (token persists).
- [ ] "Sign Out" in the dashboard clears the session and returns to `/for-sitters`.

## 2. Notifications (NEW: email + push)

> Push requires VAPID keys set AND the user clicking "Enable" on the in-dashboard banner (or having previously granted permission). Email requires `MAILGUN_API_KEY`. With neither configured, verify via the **backend console logs** instead.

- [ ] On first dashboard load, the "Enable notifications" banner appears (if browser permission is undecided). Clicking **Enable** prompts and registers without error.
- [ ] Family **posts a new request** → each active sitter in that city/state gets a "New Sitting Job" email/push (or backend logs the attempt).
- [ ] Sitter **responds** to a job → the family gets "A Sitter Is Interested" email/push.
- [ ] Family **confirms** a sitter → that sitter gets "You're Booked!" email/push.
- [ ] Family **cancels** a confirmed booking → the confirmed sitter gets a "Booking Cancelled" notification.
- [ ] A failed email/push (e.g. no keys) does **not** break the API response — the action still succeeds.

## 3. Booking lifecycle (core flow)

- [ ] Family creates a request → appears under the sitter's **Available Jobs** (`/sitting/sitter/jobs`).
- [ ] Sitter sees correct date/time/children/location; **respond** works; **withdraw** works.
- [ ] Family **RequestDetail** shows interested sitters; each card now shows the sitter's **rating** (or "No reviews yet").
- [ ] Family **confirms** a sitter → request becomes `confirmed`, contact info unlocks on both sides.
- [ ] Double-booking still blocked: a sitter with an overlapping confirmed booking cannot respond/be confirmed for a conflicting time.

## 4. Completion (NEW: auto + manual)

- [ ] **Manual:** sitter clicks "Mark Complete" on an upcoming confirmed booking → moves to Past tab.
- [ ] **Manual:** family clicks "Mark Complete" on a confirmed booking → moves to Past tab.
- [ ] **Auto:** set a confirmed booking's `date` to yesterday in Mongo, reload either Bookings page → it auto-moves to `completed` (Past tab).
- [ ] A non-confirmed booking cannot be completed (returns a clear error).

## 5. Sitter cancellation (NEW)

- [ ] Sitter clicks "Cancel" on an upcoming confirmed booking → confirm dialog → booking disappears from sitter bookings.
- [ ] The request **reopens** (`status: open`) and reappears in the sitter Jobs list / other sitters can respond.
- [ ] The family is notified (email/push or backend log).
- [ ] The cancelling sitter's response is marked `withdrawn`.

## 6. Reviews & ratings (NEW)

- [ ] On a **completed** booking (family Past tab), "Leave a Review" appears.
- [ ] Submitting 1–5 stars + comment succeeds; the button changes to "Review submitted".
- [ ] Trying to review the same booking twice is prevented (shows "already reviewed").
- [ ] Reviewing a **non-completed** booking is rejected by the API.
- [ ] After a review, the sitter's `averageRating` / `reviewCount` update (visible on RequestDetail sitter cards and the **sitter Dashboard** rating tile).

## 7. Calendar view (NEW)

- [ ] Sitter Bookings page: **List / Calendar** toggle works.
- [ ] Calendar highlights confirmed (solid) vs completed (light) days; clicking a day lists that day's bookings.
- [ ] Same on the family Bookings page.
- [ ] No `date-fns` resolution errors in the console (the corrupted install was repaired).

## 8. Sitter Dashboard (NEW: real data)

- [ ] Stats are **real** (no hardcoded "The Smiths" test data): Available Jobs, Upcoming, Completed counts, and Rating reflect the DB.
- [ ] "Available Jobs" and "Upcoming Bookings" lists show real records and link correctly.
- [ ] A `pending_approval` sitter sees 0 jobs (expected) rather than an error.

## 9. Availability (FIXED: now persists to backend)

> This page was previously a non-functional stub (saved nothing). Now wired to the real API.

- [ ] Open `/sitting/sitter/availability` → weekly schedule loads from the server (not the hardcoded default after a save).
- [ ] Toggle a day off / change hours → "Save Schedule" → reload page → the change **persisted**.
- [ ] Add a blocked date (all-day or time range) → it appears and **persists** after reload.
- [ ] Remove a blocked date → it's gone after reload.
- [ ] Block a date, then as a family create a request on that date → the sitter should NOT see it / can't respond (availability conflict).

## 10. Admin sitter approval (NEW)

- [ ] Log in as **admin** → sidebar shows "Club Sitting" → `/admin/sitters` lists sitters with stats (Total / Active / Pending Approval).
- [ ] Status filter + search work.
- [ ] Open a `pending_approval` sitter → detail shows profile, rating, booking stats.
- [ ] **Approve** → status flips to `active`; that sitter can now see jobs.
- [ ] **Reject** sets `rejected` (with reason shown); **Suspend** an active sitter; **Reactivate** a suspended one.

## 11. In-app notifications (NEW)

- [ ] Bell appears in sitter + family dashboard headers (mobile header + desktop sidebar).
- [ ] Family posts a request → matching sitters' bell shows an unread badge.
- [ ] Open the bell → list shows the notification; clicking it marks read and navigates to the job/request.
- [ ] "Mark all read" clears the badge.
- [ ] Same notifications fire for respond / confirm / cancel / reopen (one per event, to the right recipient).

## 12. Sitter job-detail page (NEW)

- [ ] From Jobs, "View Details" opens `/sitting/sitter/jobs/:id` with full job info.
- [ ] Respond / Withdraw work from the detail page; scheduling-conflict warning shows when unavailable.
- [ ] Once selected, the family contact phone unlocks.

## 13. Profile photo upload (NEW)

- [ ] Sitter Profile → "Upload Photo" → pick an image → avatar shows and **persists** after reload.
- [ ] Profile can now be saved even with an empty bio/experience (validation relaxed).

## 14. Auto-expiry (NEW)

- [ ] Set an `open`/`responses_received` request's `date` to yesterday in Mongo → reload sitter Jobs or family Requests → it becomes `expired` and drops off the jobs list; its interested responses become `not_selected`.

## 15. Login redirect + registration idempotency (NEW)

- [ ] Sitter login → `/sitting/sitter`; family login → `/sitting/family`; admin → `/admin`.
- [ ] A `family` user with no sitting profile lands on `/` (home), not a broken dashboard.
- [ ] Re-POSTing a completed registration `sessionId` returns the existing profile (HTTP 200), no 500/duplicate.

## 16. Booking payment — Stage 1 (NEW)

Requires `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`. Locally run
`stripe listen --forward-to localhost:5001/api/stripe/webhook` so the webhook can mark the booking paid.

- [ ] On a `confirmed` booking, the family Bookings page shows a **Pay Sitter** button.
- [ ] Clicking it redirects to Stripe Checkout for `hours × rate` (rate picked by child-count, falling back to base `hourlyRate`). Pay with test card `4242 4242 4242 4242`.
- [ ] After payment the family page shows a green **Paid · $X** badge; the sitter Bookings page shows **Paid · $X** (read-only); the sitter gets an in-app/push "Payment Received" notification.
- [ ] Admin → sitter detail shows **Paid bookings** and **Total paid**.
- [ ] Paying an already-paid booking is blocked; a sitter with no hourly rate set returns a clear error instead of a $0 charge.

---

## Known gaps NOT yet built (don't file as bugs — see CLAUDE.md "Sitter side — remaining gaps")

- **Stage 2 booking payment**: Stripe Connect sitter payouts/escrow + auto-refund on cancellation (Stage 1 charges the family and pays sitters out off-platform; refunds are manual via Stripe).
- Membership is a one-time first-month charge — no recurring renewal yet.
- Push notifications only reach users who clicked "Enable" and require VAPID keys configured.
