# Club Sitting - Phase 1 Development Scope

## Club Nanny Expansion + Mobile Web App (Progressive Web App)

---

## 1. Project Overview

Club Sitting is a Phase 1 expansion of the existing Club Nanny platform. The current Club Nanny offering is focused on longer-term nanny and family relationships. Club Sitting will add a shorter-term babysitting service where families can request once-off or short-notice babysitting and approved sitters can respond to those requests.

The intention is to create an on-demand, Uber-style booking experience without building a full native mobile application or a second large-scale platform. Phase 1 must remain lean, mobile-first and practical, while still giving families, sitters and administrators the core tools needed to manage short-term babysitting bookings.

This scope is written as both a client-facing description of what will be delivered and a developer-ready build guide for the first phase.

---

## 2. Phase 1 Objectives

- Update the existing website structure so users can clearly choose between Club Nanny and Club Sitting.
- Create a mobile-first Club Sitting web app that can be installed on a phone as a Progressive Web App (PWA).
- Allow families to register, pay the required membership fee, create babysitting requests and confirm a sitter.
- Allow sitters to register, pay the required fees, manage a basic profile, set availability and respond to nearby babysitting jobs.
- Provide a simple location-based job distribution system using suburb/city, postal code and preferred working radius.
- Provide in-app notifications, web push notifications where supported, and email backup notifications.
- Give administrators the basic controls needed to approve users, manage memberships, oversee bookings and support users.
- Avoid large-scale features that would materially increase cost, such as native apps, live GPS tracking, advanced algorithms, in-app chat or external calendar integrations.

---

## 3. Scope Control

Phase 1 is not a rebuild of the entire Club Nanny platform. It is a focused addition that adds a Club Sitting user journey, a PWA-style mobile experience and a simple booking workflow. Existing Club Nanny functionality should remain in place and should only be changed where required to create the new Club Nanny / Club Sitting split.

### Included in Phase 1

- Website navigation update and Club Sitting landing flow
- Family and sitter registration for Club Sitting
- Mobile-first PWA dashboards
- Booking request, sitter response and booking confirmation workflow
- Basic calendar/availability and overlap prevention
- In-app, push and email notification flows
- Membership/application fee capture or payment-status recording
- Basic admin controls

### Not Included in Phase 1

- Native iOS or Android applications
- App Store or Google Play deployment
- Live GPS tracking or real-time map movement
- Automated dispatch or complex matching algorithms
- Google Calendar, Apple Calendar or Outlook calendar sync
- Custom notification sounds or voice notifications
- Sitter payout management or escrow payments
- Advanced analytics, reports, CRM or accounting integrations

---

## 4. Website Updates

### 4.1 Our Program Page Redesign

The existing Our Program page must be updated to create two clear user paths. This prevents confusion between long-term nanny placement and short-term babysitting.

| Path | Purpose | Primary call to action |
|------|---------|------------------------|
| Nanny | Existing Club Nanny service for longer-term nanny placements and family/nanny relationships. | Register as Family / Register as Nanny |
| Sitter | New Club Sitting service for short-term babysitting requests and flexible sitter bookings. | Register as Family / Register as Sitter / Install Web App |

### 4.2 Nanny Section

The existing Club Nanny content and workflows must remain active. Only minor layout changes should be made where needed to support the new two-path structure.

- Existing family registration
- Existing nanny registration
- Existing informational content
- Existing long-term placement workflow

### 4.3 Sitter Section

A new Club Sitting section must be created for short-term babysitting. This section should explain the service in simple terms and guide users into the correct registration flow.

- Overview of Club Sitting and how short-term babysitting bookings work.
- Family registration button.
- Sitter registration button.
- Membership and application fee notices before registration submission.
- Instructions for installing the mobile web app on a phone.
- Short explanation that Club Sitting is a web-based app, not an App Store or Google Play app in Phase 1.

---

## 5. Mobile Web App (PWA)

The Club Sitting web app must be built as a Progressive Web App. It must work in a mobile browser, be installable to a phone home screen where supported, and provide an app-like experience without requiring a native app build.

- Mobile-first layout for family and sitter usage.
- Installable web app configuration using a web app manifest and service worker.
- Persistent login/session handling so users do not need to log in every time they open the app.
- Family dashboard, sitter dashboard and admin dashboard.
- Basic offline/app-shell support only where practical. Full offline booking functionality is not required.
- Push notifications where supported by the browser, device and user permissions.
- Email notifications as a fallback where push notifications are unsupported, disabled or not yet approved by the user.

---

## 6. User Roles and Account States

| Role | Description | Core access |
|------|-------------|-------------|
| Public visitor | Unregistered user browsing the website. | Can view public information and registration options. |
| Family applicant | Family that has started or submitted registration. | Can complete profile and payment steps; access may remain limited until approval if required. |
| Active family | Approved/active family account. | Can create babysitting requests, view responses, confirm bookings and leave reviews. |
| Sitter applicant | Sitter that has started or submitted registration. | Can complete profile, payment and required application details; access may remain limited until approval. |
| Active sitter | Approved/active sitter account. | Can manage profile, availability, job responses, bookings and reviews. |
| Admin | Club Nanny/Club Sitting internal user. | Can approve users, manage memberships, oversee bookings and provide support. |

---

## 7. Account Functionality

### 7.1 Family Accounts

- Create an account and log in.
- Manage family/household profile.
- Complete membership/payment step before final application submission or activation, depending on the existing payment process.
- Submit babysitting requests.
- View interested/available sitters for each request.
- Open sitter profile cards and view key sitter information.
- Confirm one sitter for a booking.
- View upcoming, previous, cancelled and completed bookings.
- Receive in-app, push and email notifications.
- Leave a rating and short review after a completed booking.

### 7.2 Sitter Accounts

- Create an account and log in.
- Manage sitter profile, including profile photo, age, hourly rate, short bio and relevant childcare experience fields.
- Complete application fee and membership/payment step before final application submission or activation, depending on the existing payment process.
- Set suburb/city, postal code and preferred working radius.
- Manage simplified availability and unavailable time blocks.
- View available babysitting jobs matched to their area and availability.
- Respond to a job using a clear I am available / Interested action.
- View upcoming, previous, cancelled and completed bookings.
- Receive in-app, push and email notifications.
- Leave a rating and short review after a completed booking.

---

## 8. Club Sitting Booking Flow

| Step | Family experience | Sitter experience | System/admin result |
|------|-------------------|-------------------|---------------------|
| 1. Family creates request | Family enters date, start time, end time, address, suburb/city, postal code, number/ages of children and notes. | No action yet. | Booking request is created with status Open. |
| 2. System checks matching | Family sees request as submitted/open. | Only approved sitters who match area/radius and do not have overlapping confirmed bookings can see or receive the job. | System filters by location and time availability. |
| 3. Notifications sent | Family may receive confirmation that the request is open. | Matched sitters receive in-app notification, push notification where supported and email fallback. | Notification log is created. |
| 4. Sitter responds | Family dashboard updates to show interested/available sitters. | Sitter taps I am available / Interested. | Sitter response is linked to the booking request. |
| 5. Family chooses sitter | Family reviews profile cards and selects one sitter. | Selected sitter receives booking confirmation. Non-selected sitters may see that the job is no longer available. | Booking status changes to Confirmed. |
| 6. Contact details unlock | Family can see sitter contact details for the confirmed booking. | Sitter can see family/job contact details for the confirmed booking. | Contact details stay hidden until confirmation. |
| 7. Booking completed | Family can leave a rating/review. | Sitter can leave a rating/review. | Booking status changes to Completed and reviews are saved. |

---

## 9. Family Job Request Form

The family job request form must include the following fields:

- Date of babysitting request.
- Start time and end time.
- Job address.
- Suburb/city.
- Postal/zip code.
- Number of children.
- Ages of children.
- Additional notes or special instructions.
- Optional emergency/contact notes if this already exists in the account structure.

### Validation rules:

- End time must be after start time.
- Date and time cannot be in the past.
- Required location fields must be completed before the request can be submitted.
- A request cannot be confirmed with more than one sitter.

---

## 10. Interested Sitter Profile Cards

When sitters respond to a request, the family dashboard must display simple sitter cards. Each card should include:

- Profile photo.
- Name.
- Age.
- Hourly rate.
- Short profile summary.
- Average star rating where available.
- Button to expand profile details.
- Button to select/book the sitter.

---

## 11. Sitter Availability Calendar

Each sitter profile must include a simplified availability and booking calendar. This is not an advanced calendar integration. Its purpose is to prevent obvious clashes and help sitters manage multiple babysitting jobs in a day.

- Sitters can view upcoming confirmed bookings.
- Sitters can mark basic available or unavailable time blocks.
- Confirmed bookings must block out the relevant time slot.
- Multiple jobs on the same day are allowed if the time slots do not overlap.
- Overlap rule: a new confirmed booking conflicts where the new start time is before an existing end time and the new end time is after an existing start time.
- External calendar sync is excluded from Phase 1.

---

## 12. Location-Based Job Matching

The platform must include a simplified location-aware matching system. This will not be built as live GPS tracking. The system should use profile and job location details to show or send jobs to relevant nearby sitters.

| Data captured | Used for |
|---------------|----------|
| Sitter suburb/city | Area matching and sitter search filtering. |
| Sitter postal/zip code | Postal-code proximity and matching. |
| Sitter preferred working radius | Determining whether a job is within the sitter preferred area. |
| Family job address | Confirmed job location and contact detail after booking. |
| Family job suburb/city | Area matching. |
| Family job postal/zip code | Postal-code proximity and matching. |

### Phase 1 matching logic:

- Only active/approved sitters are eligible to receive or view jobs.
- Jobs are matched using postal code, suburb/city and preferred working radius.
- The developer may implement distance matching through stored postal-code coordinates or a geocoding service if already available in the stack.
- If exact distance calculation is not available in Phase 1, the fallback is postal-code and suburb/city matching.
- Live GPS tracking, real-time movement and map-based dispatch are excluded.

---

## 13. Notifications

The notification system must be reliable enough for short-term babysitting requests, but it must remain simple. Phase 1 will use in-app notifications, web push notifications where supported and email notifications as a backup.

| Trigger | Recipient | Notification channels |
|---------|-----------|----------------------|
| New babysitting request matched to sitter area | Matched sitters | In-app, push where supported, email backup |
| Sitter responds as available/interested | Family | In-app, push where supported, email backup |
| Family confirms sitter | Selected sitter and family | In-app, push where supported, email backup |
| Booking cancelled or expired | Affected family/sitter | In-app, push where supported, email backup |
| Booking completed / review reminder | Family and sitter | In-app and email; push optional |

### Important implementation requirements:

- The system must request push notification permission only after a user is logged in and has context for why notifications are useful.
- Users must still be able to use the web app if they decline push notifications.
- Every push notification should also create an in-app notification record.
- Email fallback must be used for key booking events where push delivery is not supported or permission has not been granted.
- Push notifications depend on device, browser and operating-system support and cannot be guaranteed for every user.

---

## 14. Reviews and Ratings

Phase 1 must include a simplified review system after completed bookings.

- Families can leave a star rating and short written review for a sitter.
- Sitters can leave a star rating and short written review for a family/booking.
- Reviews are linked to completed bookings only.
- Admin can view and moderate reviews if needed.
- Advanced review analytics and public review pages are excluded.

---

## 15. Payments and Memberships

Phase 1 must support the required Club Sitting membership/application payment process at registration level. It does not include a full sitter payout system for each babysitting booking unless this already exists in the current platform and can be reused without additional build complexity.

| User type | Required payment handling |
|-----------|--------------------------|
| Family | Monthly membership fee must be paid or recorded before application submission/activation, depending on the current business process. |
| Sitter | Application fee and monthly membership fee must be paid or recorded before application submission/activation, depending on the current business process. |
| Admin | Admin must be able to view payment/membership status and manually manage exceptions where needed. |

### Payment scope notes:

- Use the existing payment provider or payment process if already available.
- If no reusable payment gateway exists, Phase 1 may use payment links or a simple payment-status workflow, subject to client approval.
- Booking-level payments, automated sitter payouts, escrow and invoicing integrations are excluded from Phase 1.

---

## 16. Admin Functionality

Admin functionality must be sufficient to manage the Phase 1 workflow and support users without creating a complex back-office system.

- View, approve, reject or suspend family accounts.
- View, approve, reject or suspend sitter accounts.
- View and manage application and membership/payment status.
- View booking requests, sitter responses and confirmed bookings.
- Manually cancel or update a booking where support intervention is required.
- View notification records for support purposes.
- View and moderate ratings/reviews.
- Basic user search/filtering by role, status and area.

---

## 17. Core Data Objects for Development

The developer should allow for the following core data objects. Field names can follow the existing codebase conventions.

| Object | Minimum purpose |
|--------|-----------------|
| User | Login, role, email, phone, password/session and account status. |
| FamilyProfile | Household profile, contact information and membership status. |
| SitterProfile | Profile photo, bio, age, hourly rate, area, postal code, radius, approval and membership status. |
| SitterAvailability | Available/unavailable blocks and confirmed booking blocks. |
| BookingRequest | Family request details, time, location, children details, notes and status. |
| SitterResponse | Links a sitter to a booking request with response status and timestamp. |
| Booking | Confirmed booking linking family, sitter, request details and booking status. |
| Review | Star rating and short review linked to a completed booking. |
| Notification | In-app notification records and delivery status for push/email events. |
| Payment/Membership Record | Payment references or membership status records for family and sitter accounts. |

---

## 18. Booking and Response Statuses

| Item | Statuses |
|------|----------|
| Booking request | Draft, Open, Responses Received, Confirmed, Cancelled, Expired, Completed |
| Sitter response | Available/Interested, Withdrawn, Not Selected, Selected |
| User account | Draft, Pending Payment, Pending Approval, Active, Suspended, Rejected |
| Notification | Created, Sent, Failed, Read |

---

## 19. Phase 1 Acceptance Criteria

- Website visitors can clearly choose between Club Nanny and Club Sitting from the Our Program page.
- Families and sitters can register through separate Club Sitting flows.
- Membership/application payment requirements are presented before final submission/activation.
- Approved families can create babysitting requests from a mobile-first dashboard.
- Approved sitters can manage profiles, area settings and basic availability.
- The system prevents confirmed booking time overlaps for a sitter.
- Matching sitters can view and/or receive relevant nearby jobs.
- Sitters can respond as available/interested.
- Families can view interested sitter cards and confirm one sitter.
- Confirmed bookings appear in both family and sitter dashboards.
- Contact details remain hidden until booking confirmation.
- In-app notifications are recorded for key booking events.
- Push notifications are implemented where supported by the user device/browser and permission status.
- Email backup notifications are sent for key booking events.
- Completed bookings allow basic reviews and ratings.
- Admins can approve users, monitor bookings and manage basic support actions.

---

## 20. Suggested Build Order

1. Website update: Our Program split, Club Sitting information page and registration entry points.
2. Authentication and account roles: family, sitter and admin access.
3. Family and sitter profiles, including membership/payment status fields.
4. Family job request form and booking status model.
5. Sitter area/radius settings, availability and overlap prevention.
6. Job matching and sitter response flow.
7. Family sitter-selection and booking confirmation flow.
8. Dashboards for upcoming, past, cancelled and completed bookings.
9. In-app notifications, email fallback and PWA push notifications.
10. Reviews/ratings and basic admin controls.
11. PWA installation testing and mobile QA.

---

## 21. How PWA Push Notifications Will Work

Club Sitting will not use native-app push notifications in Phase 1. Push notifications must be implemented as web push notifications for a Progressive Web App. This means notifications are delivered through the browser using web standards, subject to user permission and device/browser support.

### 21.1 Required Technical Components

- HTTPS must be enabled. Web push and service workers require a secure context.
- A web app manifest must be created with app name, short name, icons, theme color, start URL and display mode set to standalone or fullscreen where appropriate.
- A service worker must be registered for the PWA. The service worker handles push events and notification clicks.
- The app must request notification permission from the user after login or during onboarding, not immediately on first page load.
- The browser Push API must be used to subscribe the user device/browser to push notifications.
- VAPID public/private keys must be generated and used by the server to send secure web push messages.
- Each push subscription must be stored against the logged-in user and device/browser.
- When a booking event happens, the server must create an in-app notification and send a push payload to the relevant stored subscriptions.
- The service worker must display the notification and route notification clicks back to the correct booking or dashboard screen.
- Email backup must remain in place for important events because push delivery is dependent on browser support, user permission and device settings.

### 21.2 User Setup Flow for Push Notifications

1. User logs in to Club Sitting.
2. The app explains why notifications are useful, for example: new sitter requests, booking responses and confirmations.
3. User taps Enable Notifications.
4. The browser/device permission prompt appears.
5. If permission is granted, the app subscribes the device/browser and stores the subscription.
6. If permission is declined, the user continues using the app and receives in-app/email notifications only.
7. For iPhone/iPad users, the user may need to add the PWA to the Home Screen before web push notifications are available, depending on browser and operating-system support.

### 21.3 Developer Notes for Notification Events

| Event | Click destination |
|-------|-------------------|
| New babysitting request | Sitter job detail screen |
| Sitter interested/available | Family booking request detail screen |
| Booking confirmed | Confirmed booking detail screen |
| Booking cancelled/expired | Relevant booking detail screen or dashboard |
| Review reminder | Completed booking review screen |

Push notification wording must be short and action-focused. Examples:
- "New babysitting request available"
- "A sitter is interested in your booking"
- "Booking confirmed"
- "Booking cancelled"
- "Please review your completed booking"

---

## 22. Final Phase 1 Positioning

Phase 1 should deliver a usable, mobile-first Club Sitting experience that supports short-term babysitting requests without overbuilding. The system should feel app-like to users, but remain a web-based PWA. It should provide the core booking, matching, notification and admin tools needed to launch, while leaving advanced features for later paid phases.
