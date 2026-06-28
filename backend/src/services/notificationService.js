import { SitterProfile, SittingFamilyProfile, Notification } from '../models/index.js';
import emailService from './emailService.js';
import { sendPushToUser } from './pushService.js';
import { areaMatchConditions } from './matchingService.js';

/**
 * Notification service for Club Nanny sitter-side booking events.
 *
 * Every method fans an event out to BOTH email (Mailgun) and web-push.
 * A failure in one channel never throws back to the caller, so an API request
 * is never broken by a flaky email or an unconfigured VAPID key.
 */

function formatJobDate(dateValue) {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'the booking date';

  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(date);
}

function formatTimeRange(request) {
  return `${request.startTime}-${request.endTime}`;
}

async function safePush(userId, payload) {
  if (!userId) return;
  try {
    await sendPushToUser(userId, payload);
  } catch (error) {
    console.error('Push notification failed:', error.message);
  }
}

async function safeEmail(sendPromise) {
  try {
    await sendPromise;
  } catch (error) {
    console.error('Email notification failed:', error.message);
  }
}

async function createInApp(userId, { type, title, body, link, dedupeKey }) {
  if (!userId) return;
  try {
    if (dedupeKey) {
      await Notification.findOneAndUpdate(
        { userId, dedupeKey },
        {
          $setOnInsert: {
            userId,
            type,
            title,
            body,
            link,
            dedupeKey,
            read: false
          }
        },
        { upsert: true, new: true }
      );
      return;
    }

    await Notification.create({ userId, type, title, body, link });
  } catch (error) {
    console.error('In-app notification failed:', error.message);
  }
}

/**
 * A new job was posted — alert every active sitter in the request's area.
 */
async function notifyNewJob(request, options = {}) {
  try {
    const excludeSitterIds = new Set(
      (options.excludeSitterIds || []).map((id) => String(id))
    );
    // Notify active sitters in the request's area (same city/state OR shared ZIP prefix)
    const sitterQuery = { status: 'active', membershipStatus: 'active' };
    const areaOr = areaMatchConditions(request);
    if (areaOr) sitterQuery.$or = areaOr;

    const sitters = await SitterProfile.find(sitterQuery);
    const recipients = sitters.filter((sitter) => !excludeSitterIds.has(String(sitter._id)));
    const dateLabel = formatJobDate(request.date);
    const body = `${dateLabel} • ${request.city}, ${request.state} • ${formatTimeRange(request)}`;
    const title = options.title || 'New Babysitting Request Near You';
    const notificationType = options.type || 'new_job';
    const dedupePrefix = options.dedupeKeyPrefix || `new_job:${request._id}`;

    await Promise.all(recipients.map(async (sitter) => {
      await safeEmail(emailService.sendNewJobAlert({
        to: sitter.email,
        sitterName: sitter.firstName,
        date: request.date,
        startTime: request.startTime,
        endTime: request.endTime,
        city: request.city,
        state: request.state,
        numberOfChildren: request.numberOfChildren,
        requestId: request._id
      }));

      await safePush(sitter.userId, {
        title,
        body,
        url: `/sitting/sitter/jobs/${request._id}`,
        tag: `job-${request._id}`
      });

      await createInApp(sitter.userId, {
        type: notificationType,
        title,
        body,
        link: `/sitting/sitter/jobs/${request._id}`,
        dedupeKey: `${dedupePrefix}:sitter:${sitter.userId}`
      });
    }));
  } catch (error) {
    console.error('notifyNewJob error:', error.message);
  }
}

/**
 * A sitter expressed interest — notify the family that owns the request.
 */
async function notifySitterResponded(request, sitter) {
  try {
    const family = await SittingFamilyProfile.findById(request.familyId);
    if (!family) return;

    const sitterName = `${sitter.firstName} ${sitter.lastName}`.trim();
    const dateLabel = formatJobDate(request.date);

    await safeEmail(emailService.sendSitterRespondedToFamily({
      to: family.email,
      familyName: family.householdName,
      sitterName,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      requestId: request._id
    }));

    await safePush(family.userId, {
      title: 'A Sitter Is Interested!',
      body: `${sitterName} responded to your ${dateLabel} request`,
      url: `/sitting/family/requests/${request._id}`,
      tag: `response-${request._id}`
    });

    await createInApp(family.userId, {
      type: 'response',
      title: 'A Sitter Is Interested!',
      body: `${sitterName} responded to your ${dateLabel} request`,
      link: `/sitting/family/requests/${request._id}`,
      dedupeKey: `response:${request._id}:sitter:${sitter._id}:family:${family.userId}`
    });
  } catch (error) {
    console.error('notifySitterResponded error:', error.message);
  }
}

/**
 * Family confirmed a sitter — notify the chosen sitter.
 */
async function notifyBookingConfirmed(request, sitter, family) {
  try {
    const familyName = family?.householdName || 'A family';
    const dateLabel = formatJobDate(request.date);
    const timeRange = formatTimeRange(request);

    await safeEmail(emailService.sendBookingConfirmedToSitter({
      to: sitter.email,
      sitterName: sitter.firstName,
      familyName,
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      address: request.address,
      city: request.city,
      state: request.state
    }));

    await safePush(sitter.userId, {
      title: "You're Booked!",
      body: `${familyName} confirmed you for ${dateLabel}, ${timeRange}`,
      url: '/sitting/sitter/bookings',
      tag: `confirmed-${request._id}`
    });

    await createInApp(sitter.userId, {
      type: 'confirmed',
      title: "You're Booked!",
      body: `${familyName} confirmed you for ${dateLabel}, ${timeRange}`,
      link: '/sitting/sitter/bookings',
      dedupeKey: `confirmed:${request._id}:sitter:${sitter.userId}`
    });

    // Also confirm to the family (in-app + push)
    if (family?.userId) {
      const sitterName = `${sitter.firstName} ${sitter.lastName || ''}`.trim();
      await safePush(family.userId, {
        title: 'Booking Confirmed',
        body: `${sitterName} is booked for ${dateLabel}, ${timeRange}`,
        url: '/sitting/family/bookings',
        tag: `confirmed-fam-${request._id}`
      });
      await createInApp(family.userId, {
        type: 'confirmed',
        title: 'Booking Confirmed',
        body: `${sitterName} is booked for ${dateLabel}, ${timeRange}`,
        link: '/sitting/family/bookings',
        dedupeKey: `confirmed:${request._id}:family:${family.userId}`
      });
    }
  } catch (error) {
    console.error('notifyBookingConfirmed error:', error.message);
  }
}

/**
 * Family cancelled a confirmed booking — notify the sitter.
 */
async function notifyBookingCancelledToSitter(request, sitter, options = {}) {
  try {
    const dateLabel = formatJobDate(request.date);
    const timeRange = formatTimeRange(request);
    const reason = options.reason || request.cancellationReason || '';
    const reasonText = reason ? ` Reason: ${reason}` : '';

    await safeEmail(emailService.sendBookingCancelled({
      to: sitter.email,
      recipientName: sitter.firstName,
      by: 'family',
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime,
      reason
    }));

    await safePush(sitter.userId, {
      title: 'Booking Cancelled',
      body: `The family cancelled your ${dateLabel}, ${timeRange} booking.${reasonText}`,
      url: '/sitting/sitter/bookings',
      tag: `cancelled-${request._id}`
    });

    await createInApp(sitter.userId, {
      type: 'cancelled',
      title: 'Booking Cancelled',
      body: `The family cancelled your ${dateLabel}, ${timeRange} booking.${reasonText}`,
      link: '/sitting/sitter/bookings',
      dedupeKey: `cancelled:${request._id}:sitter:${sitter.userId}`
    });
  } catch (error) {
    console.error('notifyBookingCancelledToSitter error:', error.message);
  }
}

/**
 * Sitter cancelled a confirmed booking — notify the family (request reopened).
 */
async function notifyBookingReopenedToFamily(request, family) {
  try {
    const dateLabel = formatJobDate(request.date);
    const timeRange = formatTimeRange(request);

    await safeEmail(emailService.sendBookingCancelled({
      to: family.email,
      recipientName: family.householdName,
      by: 'sitter',
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime
    }));

    await safePush(family.userId, {
      title: 'Sitter Cancelled — Request Reopened',
      body: `Your ${dateLabel}, ${timeRange} request is open again`,
      url: `/sitting/family/requests/${request._id}`,
      tag: `reopened-${request._id}`
    });

    await createInApp(family.userId, {
      type: 'reopened',
      title: 'Sitter Cancelled — Request Reopened',
      body: `Your ${dateLabel}, ${timeRange} request is open again`,
      link: `/sitting/family/requests/${request._id}`,
      dedupeKey: `reopened:${request._id}:family:${family.userId}`
    });
  } catch (error) {
    console.error('notifyBookingReopenedToFamily error:', error.message);
  }
}

/**
 * A booking was filled by another sitter — let the non-selected sitters down gently.
 */
async function notifyBookingFilledToOthers(request, sitterIds) {
  try {
    if (!sitterIds || sitterIds.length === 0) return;
    const sitters = await SitterProfile.find({ _id: { $in: sitterIds } });
    const softBody =
      "Thank you for your interest in this booking. It has now been filled, but please keep an eye on the platform — we'd love to connect you with another booking soon.";

    await Promise.all(sitters.map(async (sitter) => {
      await safePush(sitter.userId, {
        title: 'This booking has been filled',
        body: "Thanks for your interest — keep an eye out for more bookings soon.",
        url: '/sitting/sitter/jobs',
        tag: `filled-${request._id}`
      });

      await createInApp(sitter.userId, {
        type: 'filled',
        title: 'This booking has been filled',
        body: softBody,
        link: '/sitting/sitter/jobs',
        dedupeKey: `filled:${request._id}:sitter:${sitter.userId}`
      });
    }));
  } catch (error) {
    console.error('notifyBookingFilledToOthers error:', error.message);
  }
}

/**
 * Family paid for a confirmed booking — let the sitter know money is on the way.
 */
async function notifyBookingPaid(request, sitter) {
  try {
    const dateLabel = formatJobDate(request.date);
    const timeRange = formatTimeRange(request);
    const amount = request.payment?.amountCents
      ? `$${(request.payment.amountCents / 100).toFixed(2)} `
      : '';

    // Email is optional — only send if a template exists, so this degrades gracefully.
    if (typeof emailService.sendBookingPaidToSitter === 'function') {
      await safeEmail(emailService.sendBookingPaidToSitter({
        to: sitter.email,
        sitterName: sitter.firstName,
        amountCents: request.payment?.amountCents,
        date: request.date,
        startTime: request.startTime,
        endTime: request.endTime
      }));
    }

    await safePush(sitter.userId, {
      title: 'Payment Received',
      body: `${amount}was paid for your ${dateLabel}, ${timeRange} booking`,
      url: '/sitting/sitter/bookings',
      tag: `paid-${request._id}`
    });

    await createInApp(sitter.userId, {
      type: 'payment',
      title: 'Payment Received',
      body: `${amount}was paid for your ${dateLabel}, ${timeRange} booking`,
      link: '/sitting/sitter/bookings',
      dedupeKey: `paid:${request._id}:sitter:${sitter.userId}`
    });
  } catch (error) {
    console.error('notifyBookingPaid error:', error.message);
  }
}

/**
 * A confirmed booking reached its out-time — remind the family to rate the sitter.
 */
async function notifyFamilyReviewReminder(request, family, sitter) {
  try {
    if (!family?.userId) return;

    const sitterName = `${sitter?.firstName || 'your sitter'} ${sitter?.lastName || ''}`.trim();
    const dateLabel = formatJobDate(request.date);
    const link = `/sitting/family/bookings?review=${request._id}`;
    const body = `Your ${dateLabel} booking with ${sitterName} has ended. Please rate your sitter.`;

    await safePush(family.userId, {
      title: 'Rate your sitter',
      body,
      url: link,
      tag: `review-reminder-${request._id}`
    });

    await createInApp(family.userId, {
      type: 'review_reminder',
      title: 'Rate your sitter',
      body,
      link,
      dedupeKey: `review-reminder:${request._id}:family:${family.userId}`
    });
  } catch (error) {
    console.error('notifyFamilyReviewReminder error:', error.message);
  }
}

export default {
  notifyNewJob,
  notifySitterResponded,
  notifyBookingConfirmed,
  notifyBookingCancelledToSitter,
  notifyBookingReopenedToFamily,
  notifyBookingFilledToOthers,
  notifyBookingPaid,
  notifyFamilyReviewReminder
};
