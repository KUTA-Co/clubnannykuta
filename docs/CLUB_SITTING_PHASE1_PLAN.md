# Club Sitting - Phase 1 Development Plan

> **Status:** Planning
> **Last Updated:** 2026-05-27
> **Type:** Scope Analysis & Implementation Plan

---

## 1. Executive Summary

Club Sitting is an expansion of Club Nanny that adds **short-term, on-demand babysitting** (Uber-style) alongside the existing long-term nanny placement service.

**Key Distinction:**
| Service | Duration | Model |
|---------|----------|-------|
| Club Nanny | Long-term (8-12 weeks) | Matching/placement |
| Club Sitting | Short-term (once-off) | On-demand booking |

---

## 2. Scope Analysis

### 2.1 What's Being Built

| Component | Description |
|-----------|-------------|
| Website Split | "Our Program" page shows two paths: Nanny vs Sitter |
| PWA Mobile App | Mobile-first web app, installable on phone |
| Family Dashboard | Create requests, view sitters, confirm bookings |
| Sitter Dashboard | Manage profile, availability, respond to jobs |
| Booking Flow | Request → Sitter responses → Family confirms → Booking |
| Location Matching | Suburb/postal code + radius matching |
| Notifications | In-app + Web Push + Email fallback |
| Reviews | Star rating + short review after completion |
| Admin Controls | Approve users, manage bookings, moderate reviews |

### 2.2 What's NOT Being Built (Phase 1)

- Native iOS/Android apps
- App Store/Google Play deployment
- Live GPS tracking
- Automated dispatch algorithms
- Calendar sync (Google/Apple/Outlook)
- In-app chat/messaging
- Sitter payouts/escrow
- Advanced analytics/CRM

---

## 3. Technical Analysis - Existing Codebase

### 3.1 Current Tech Stack (Reusable)

| Layer | Technology | Reusable for Club Sitting |
|-------|------------|---------------------------|
| Frontend | React 18 + TypeScript + Vite | ✅ Yes |
| UI | Tailwind + shadcn/ui | ✅ Yes |
| Backend | Node.js + Express | ✅ Yes |
| Database | MongoDB + Mongoose | ✅ Yes |
| Auth | JWT + bcrypt | ✅ Yes |
| Email | Mailgun | ✅ Yes |
| Payments | Stripe | ✅ Yes |

### 3.2 Existing Models (Can Extend)

| Model | Current Use | Club Sitting Extension |
|-------|-------------|------------------------|
| User | Auth/login | Add `accountType: 'nanny' | 'sitter' | 'family'` |
| FamilyApplication | Long-term family apps | Create separate `SittingFamily` model |
| NannyApplication | Long-term nanny apps | Create separate `Sitter` model |
| Payment | Stripe payments | Reuse for membership fees |

### 3.3 New Models Required

```
SittingFamily        - Family profile for Club Sitting
Sitter               - Sitter profile (photo, bio, rate, area, radius)
SitterAvailability   - Available/unavailable time blocks
BookingRequest       - Family job request (date, time, location, children)
SitterResponse       - Sitter's response to a request
Booking              - Confirmed booking linking family + sitter
Review               - Star rating + text linked to completed booking
Notification         - In-app notification records
PushSubscription     - Web push subscription storage
```

---

## 4. User Flows

### 4.1 Family Flow

```
1. Visit site → Choose "Club Sitting" path
2. Register as Family → Pay membership fee
3. Admin approves (or auto-approve if paid)
4. Login → Family Dashboard (PWA)
5. Create babysitting request (date, time, location, children)
6. View interested sitters (profile cards)
7. Select & confirm one sitter
8. Booking confirmed → Contact details unlocked
9. After completion → Leave review
```

### 4.2 Sitter Flow

```
1. Visit site → Choose "Club Sitting" → Register as Sitter
2. Pay application fee + membership fee
3. Complete profile (photo, bio, rate, area, radius)
4. Admin approves
5. Login → Sitter Dashboard (PWA)
6. Set availability (available/unavailable blocks)
7. Receive job notifications (matching area/radius)
8. Tap "I'm Available" on jobs
9. If selected → Booking confirmed → Contact details unlocked
10. After completion → Leave review
```

### 4.3 Booking State Machine

```
[Draft] → [Open] → [Responses Received] → [Confirmed] → [Completed]
                           ↓
                    [Cancelled/Expired]
```

---

## 5. PWA Requirements

### 5.1 Manifest & Service Worker

- Web app manifest with icons, theme color, start URL
- Service worker for push notifications
- `display: standalone` for app-like feel
- Persistent login (JWT in secure storage)

### 5.2 Push Notifications

| Event | Recipients | Channels |
|-------|------------|----------|
| New job available | Matched sitters | Push + In-app + Email |
| Sitter interested | Family | Push + In-app + Email |
| Booking confirmed | Both | Push + In-app + Email |
| Booking cancelled | Affected party | Push + In-app + Email |
| Review reminder | Both | In-app + Email |

**Technical requirements:**
- HTTPS (already have)
- VAPID keys for web push
- Service worker push event handler
- Store push subscriptions per user/device
- Email fallback for all critical events

### 5.3 iOS Considerations

- iOS Safari requires "Add to Home Screen" for push support
- Must show user instructions for iOS PWA installation
- Push permission prompt after login, not on page load

---

## 6. Location Matching Logic

### 6.1 Data Points

| Field | Source | Purpose |
|-------|--------|---------|
| `suburb` | Sitter profile | Area matching |
| `postalCode` | Sitter profile | Proximity matching |
| `workingRadius` | Sitter profile (km) | Distance filter |
| `jobSuburb` | Booking request | Match against sitter area |
| `jobPostalCode` | Booking request | Match against sitter area |

### 6.2 Matching Algorithm (Phase 1 - Simple)

```javascript
// Pseudo-code for job matching
function findMatchingSitters(job) {
  return Sitter.find({
    status: 'active',
    $or: [
      { suburb: job.suburb },
      { postalCode: job.postalCode }
    ],
    // Check no overlapping confirmed bookings
    // Check within working radius (if coordinates available)
  });
}
```

**Phase 1 approach:**
- Match by postal code OR suburb
- Optional: Use postal code coordinates for distance calc
- Filter out sitters with overlapping confirmed bookings

---

## 7. Database Schema Design

### 7.1 New Collections

```javascript
// SittingFamily
{
  userId: ObjectId,
  contactName: String,
  phone: String,
  address: String,
  suburb: String,
  postalCode: String,
  children: [{ name: String, age: Number }],
  membershipStatus: 'pending' | 'active' | 'expired',
  membershipPaidAt: Date,
  status: 'pending' | 'approved' | 'suspended',
  createdAt: Date
}

// Sitter
{
  userId: ObjectId,
  profilePhoto: String,
  fullName: String,
  age: Number,
  bio: String,
  hourlyRate: Number,
  suburb: String,
  postalCode: String,
  workingRadiusKm: Number,
  experience: String,
  membershipStatus: 'pending' | 'active' | 'expired',
  applicationFeePaid: Boolean,
  status: 'pending' | 'approved' | 'suspended',
  averageRating: Number,
  totalReviews: Number,
  createdAt: Date
}

// SitterAvailability
{
  sitterId: ObjectId,
  type: 'available' | 'unavailable',
  date: Date,
  startTime: String,
  endTime: String
}

// BookingRequest
{
  familyId: ObjectId,
  date: Date,
  startTime: String,
  endTime: String,
  address: String,
  suburb: String,
  postalCode: String,
  numberOfChildren: Number,
  childrenAges: [Number],
  notes: String,
  status: 'draft' | 'open' | 'responses_received' | 'confirmed' | 'cancelled' | 'expired' | 'completed',
  createdAt: Date,
  expiresAt: Date
}

// SitterResponse
{
  bookingRequestId: ObjectId,
  sitterId: ObjectId,
  status: 'interested' | 'withdrawn' | 'not_selected' | 'selected',
  respondedAt: Date
}

// Booking
{
  requestId: ObjectId,
  familyId: ObjectId,
  sitterId: ObjectId,
  date: Date,
  startTime: String,
  endTime: String,
  address: String,
  status: 'confirmed' | 'cancelled' | 'completed',
  confirmedAt: Date,
  completedAt: Date
}

// Review
{
  bookingId: ObjectId,
  reviewerId: ObjectId,
  revieweeId: ObjectId,
  reviewerType: 'family' | 'sitter',
  rating: Number (1-5),
  comment: String,
  createdAt: Date
}

// Notification
{
  userId: ObjectId,
  type: String,
  title: String,
  body: String,
  data: Object,
  read: Boolean,
  createdAt: Date
}

// PushSubscription
{
  userId: ObjectId,
  endpoint: String,
  keys: { p256dh: String, auth: String },
  createdAt: Date
}
```

---

## 8. API Endpoints Required

### 8.1 Auth & Registration

```
POST /api/sitting/register/family
POST /api/sitting/register/sitter
POST /api/sitting/login
GET  /api/sitting/me
```

### 8.2 Family Endpoints

```
GET    /api/sitting/family/profile
PUT    /api/sitting/family/profile
POST   /api/sitting/family/requests          # Create job request
GET    /api/sitting/family/requests          # List my requests
GET    /api/sitting/family/requests/:id      # Get request details
GET    /api/sitting/family/requests/:id/responses  # Get sitter responses
POST   /api/sitting/family/requests/:id/select/:sitterId  # Confirm sitter
GET    /api/sitting/family/bookings          # List my bookings
POST   /api/sitting/family/bookings/:id/complete
POST   /api/sitting/family/reviews           # Leave review
```

### 8.3 Sitter Endpoints

```
GET    /api/sitting/sitter/profile
PUT    /api/sitting/sitter/profile
GET    /api/sitting/sitter/availability
POST   /api/sitting/sitter/availability
DELETE /api/sitting/sitter/availability/:id
GET    /api/sitting/sitter/jobs              # Available jobs in my area
POST   /api/sitting/sitter/jobs/:id/respond  # I'm interested
GET    /api/sitting/sitter/bookings          # My bookings
POST   /api/sitting/sitter/reviews           # Leave review
```

### 8.4 Notifications

```
GET    /api/sitting/notifications
PUT    /api/sitting/notifications/:id/read
POST   /api/sitting/push/subscribe
DELETE /api/sitting/push/unsubscribe
```

### 8.5 Admin Endpoints

```
GET    /api/sitting/admin/families
PUT    /api/sitting/admin/families/:id/approve
PUT    /api/sitting/admin/families/:id/suspend
GET    /api/sitting/admin/sitters
PUT    /api/sitting/admin/sitters/:id/approve
PUT    /api/sitting/admin/sitters/:id/suspend
GET    /api/sitting/admin/bookings
PUT    /api/sitting/admin/bookings/:id/cancel
GET    /api/sitting/admin/reviews
DELETE /api/sitting/admin/reviews/:id
```

---

## 9. Frontend Pages Required

### 9.1 Public Pages

```
/program                    # Updated - Two paths (Nanny vs Sitter)
/sitting                    # Club Sitting landing/info page
/sitting/register/family    # Family registration
/sitting/register/sitter    # Sitter registration
/sitting/login              # Login page
```

### 9.2 Family Dashboard (PWA)

```
/sitting/family/dashboard           # Main dashboard
/sitting/family/profile             # Edit profile
/sitting/family/requests/new        # Create new request
/sitting/family/requests/:id        # View request + responses
/sitting/family/bookings            # My bookings
/sitting/family/bookings/:id        # Booking detail
/sitting/family/reviews/:bookingId  # Leave review
/sitting/family/notifications       # Notification list
```

### 9.3 Sitter Dashboard (PWA)

```
/sitting/sitter/dashboard           # Main dashboard
/sitting/sitter/profile             # Edit profile
/sitting/sitter/availability        # Manage availability
/sitting/sitter/jobs                # Available jobs
/sitting/sitter/jobs/:id            # Job detail
/sitting/sitter/bookings            # My bookings
/sitting/sitter/bookings/:id        # Booking detail
/sitting/sitter/reviews/:bookingId  # Leave review
/sitting/sitter/notifications       # Notification list
```

### 9.4 Admin Pages

```
/admin/sitting/families             # Manage families
/admin/sitting/sitters              # Manage sitters
/admin/sitting/bookings             # Manage bookings
/admin/sitting/reviews              # Moderate reviews
```

---

## 10. Implementation Phases

### Phase 1A: Foundation (Week 1-2)

- [ ] Update "Our Program" page with Nanny/Sitter split
- [ ] Create Club Sitting landing page
- [ ] Create database models (Sitter, SittingFamily, etc.)
- [ ] Create auth routes for sitting users
- [ ] Family registration + Stripe membership
- [ ] Sitter registration + Stripe fees

### Phase 1B: Profiles & Dashboards (Week 3-4)

- [ ] Family profile management
- [ ] Sitter profile management (photo, bio, rate, area)
- [ ] Sitter availability management
- [ ] Family dashboard shell
- [ ] Sitter dashboard shell
- [ ] PWA manifest + service worker setup

### Phase 1C: Booking Flow (Week 5-6)

- [ ] Family: Create booking request
- [ ] Job matching logic (area/postal code)
- [ ] Sitter: View available jobs
- [ ] Sitter: Respond to jobs
- [ ] Family: View interested sitters (profile cards)
- [ ] Family: Select & confirm sitter
- [ ] Booking confirmation flow
- [ ] Overlap prevention logic

### Phase 1D: Notifications (Week 7)

- [ ] In-app notification system
- [ ] Web push implementation (VAPID)
- [ ] Push subscription management
- [ ] Email fallback notifications
- [ ] Notification preferences

### Phase 1E: Reviews & Admin (Week 8)

- [ ] Review/rating system
- [ ] Admin: Approve/suspend users
- [ ] Admin: Manage bookings
- [ ] Admin: Moderate reviews
- [ ] Basic search/filtering

### Phase 1F: Polish & QA (Week 9-10)

- [ ] Mobile QA and PWA testing
- [ ] iOS "Add to Home Screen" instructions
- [ ] Push notification testing
- [ ] End-to-end booking flow testing
- [ ] Edge case handling
- [ ] Performance optimization

---

## 11. Technical Considerations

### 11.1 Code Organization

```
src/
  pages/
    sitting/                    # All Club Sitting pages
      family/
      sitter/
  components/
    sitting/                    # Club Sitting components
  hooks/
    useSittingAuth.ts
    useNotifications.ts
    usePushSubscription.ts

backend/
  src/
    models/
      sitting/                  # Club Sitting models
    routes/
      sittingRoutes.js
    controllers/
      sitting/
    services/
      pushNotificationService.js
```

### 11.2 Shared vs Separate

| Component | Approach |
|-----------|----------|
| Auth system | Extend existing (add role) |
| Email service | Reuse existing Mailgun |
| Payment | Reuse existing Stripe |
| Admin layout | Extend with new tabs |
| Public pages | New pages, shared components |
| PWA config | New service worker for sitting |

### 11.3 Push Notification Libraries

```
web-push          # Server-side push sending
```

---

## 12. Questions to Clarify

1. **Auto-approve after payment?** Or require manual admin approval?

2. **Membership pricing?**
   - Family monthly fee: $?
   - Sitter application fee: $?
   - Sitter monthly fee: $?

3. **Job expiration?** How long does a request stay open before expiring?

4. **Cancellation policy?** Can families/sitters cancel after confirmation?

5. **Radius options?** What radius values should sitters choose from? (5km, 10km, 20km, etc.)

6. **Review visibility?** Public or only visible to logged-in users?

7. **Booking history retention?** How long to keep old bookings?

8. **Separate login for Nanny vs Sitting?** Or unified auth with role switching?

---

## 13. Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| iOS push limitations | Medium | Clear "Add to Home Screen" instructions |
| Location matching accuracy | Medium | Start with postal code, add geocoding later |
| Scope creep | High | Strict Phase 1 boundaries, defer to Phase 2 |
| User adoption | Medium | Clear onboarding flow |
| Spam job requests | Low | Admin moderation, rate limiting |

---

## 14. Success Criteria (Phase 1)

- [ ] Users can choose between Club Nanny and Club Sitting
- [ ] Families can register and pay membership
- [ ] Sitters can register, pay fees, complete profile
- [ ] Families can create babysitting requests
- [ ] Sitters receive notifications for nearby jobs
- [ ] Sitters can respond to jobs
- [ ] Families can view sitter cards and confirm one
- [ ] Bookings appear in both dashboards
- [ ] Contact details unlock after confirmation
- [ ] Reviews can be left after completion
- [ ] Push notifications work on supported devices
- [ ] Admin can manage users and bookings
- [ ] PWA is installable on mobile

---

## Next Steps

1. **Review this plan** - Confirm scope alignment
2. **Answer clarifying questions** (Section 12)
3. **Finalize pricing** for memberships/fees
4. **Begin Phase 1A** - Foundation work

