import { SitterProfile, SittingFamilyProfile, Notification } from '../models/index.js';
import emailService from './emailService.js';
import { sendPushToUser } from './pushService.js';
import { areaMatchConditions } from './matchingService.js';

/**
 * Notification service for Club Nanny sitter-side booking events.
 *
 * Every method fans an event out to BOTH email (Mailgun) and web-push.
 * All delivery is fire-and-forget: a failure in one channel never throws
 * back to the caller, so an API request is never broken by a flaky email
 * or an unconfigured VAPID key (pushService no-ops when VAPID is unset).
 */

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

async function createInApp(userId, { type, title, body, link }) {
  if (!userId) return;
  try {
    await Notification.create({ userId, type, title, body, link });
  } catch (error) {
    console.error('In-app notification failed:', error.message);
  }
}

/**
 * A new job was posted — alert every active sitter in the request's area.
 */
async function notifyNewJob(request) {
  try {
    // Notify active sitters in the request's area (same city/state OR shared ZIP prefix)
    const sitterQuery = { status: 'active', membershipStatus: 'active' };
    const areaOr = areaMatchConditions(request);
    if (areaOr) sitterQuery.$or = areaOr;

    const sitters = await SitterProfile.find(sitterQuery);

    await Promise.all(sitters.map(async (sitter) => {
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
        title: 'New Babysitting Request Near You',
        body: `${request.city}, ${request.state} • ${request.startTime}-${request.endTime}`,
        url: `/sitting/sitter/jobs/${request._id}`,
        tag: `job-${request._id}`
      });

      await createInApp(sitter.userId, {
        type: 'new_job',
        title: 'New Babysitting Request Near You',
        body: `${request.city}, ${request.state} • ${request.startTime}-${request.endTime}`,
        link: `/sitting/sitter/jobs/${request._id}`
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
      body: `${sitterName} responded to your request`,
      url: `/sitting/family/requests/${request._id}`,
      tag: `response-${request._id}`
    });

    await createInApp(family.userId, {
      type: 'response',
      title: 'A Sitter Is Interested!',
      body: `${sitterName} responded to your request`,
      link: `/sitting/family/requests/${request._id}`
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
      body: `${familyName} confirmed you for ${request.startTime}-${request.endTime}`,
      url: '/sitting/sitter/bookings',
      tag: `confirmed-${request._id}`
    });

    await createInApp(sitter.userId, {
      type: 'confirmed',
      title: "You're Booked!",
      body: `${familyName} confirmed you for ${request.startTime}-${request.endTime}`,
      link: '/sitting/sitter/bookings'
    });

    // Also confirm to the family (in-app + push)
    if (family?.userId) {
      const sitterName = `${sitter.firstName} ${sitter.lastName || ''}`.trim();
      await safePush(family.userId, {
        title: 'Booking Confirmed',
        body: `${sitterName} is booked for ${request.startTime}-${request.endTime}`,
        url: '/sitting/family/bookings',
        tag: `confirmed-fam-${request._id}`
      });
      await createInApp(family.userId, {
        type: 'confirmed',
        title: 'Booking Confirmed',
        body: `${sitterName} is booked for ${request.startTime}-${request.endTime}`,
        link: '/sitting/family/bookings'
      });
    }
  } catch (error) {
    console.error('notifyBookingConfirmed error:', error.message);
  }
}

/**
 * Family cancelled a confirmed booking — notify the sitter.
 */
async function notifyBookingCancelledToSitter(request, sitter) {
  try {
    await safeEmail(emailService.sendBookingCancelled({
      to: sitter.email,
      recipientName: sitter.firstName,
      by: 'family',
      date: request.date,
      startTime: request.startTime,
      endTime: request.endTime
    }));

    await safePush(sitter.userId, {
      title: 'Booking Cancelled',
      body: `The family cancelled your ${request.startTime}-${request.endTime} booking`,
      url: '/sitting/sitter/bookings',
      tag: `cancelled-${request._id}`
    });

    await createInApp(sitter.userId, {
      type: 'cancelled',
      title: 'Booking Cancelled',
      body: `The family cancelled your ${request.startTime}-${request.endTime} booking`,
      link: '/sitting/sitter/bookings'
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
      body: `Your ${request.startTime}-${request.endTime} request is open again`,
      url: `/sitting/family/requests/${request._id}`,
      tag: `reopened-${request._id}`
    });

    await createInApp(family.userId, {
      type: 'reopened',
      title: 'Sitter Cancelled — Request Reopened',
      body: `Your ${request.startTime}-${request.endTime} request is open again`,
      link: `/sitting/family/requests/${request._id}`
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
        link: '/sitting/sitter/jobs'
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
      body: `${amount}was paid for your ${request.startTime}-${request.endTime} booking`,
      url: '/sitting/sitter/bookings',
      tag: `paid-${request._id}`
    });

    await createInApp(sitter.userId, {
      type: 'payment',
      title: 'Payment Received',
      body: `${amount}was paid for your ${request.startTime}-${request.endTime} booking`,
      link: '/sitting/sitter/bookings'
    });
  } catch (error) {
    console.error('notifyBookingPaid error:', error.message);
  }
}

export default {
  notifyNewJob,
  notifySitterResponded,
  notifyBookingConfirmed,
  notifyBookingCancelledToSitter,
  notifyBookingReopenedToFamily,
  notifyBookingFilledToOthers,
  notifyBookingPaid
};
