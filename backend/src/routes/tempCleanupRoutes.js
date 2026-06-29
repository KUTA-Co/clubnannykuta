import express from 'express';
import mongoose from 'mongoose';
import {
  User,
  FamilyApplication,
  NannyApplication,
  Payment,
  Match,
  PushSubscription,
  SitterProfile,
  SittingFamilyProfile,
  BookingRequest,
  SitterResponse,
  SitterAvailability,
  Review,
  FamilyReview,
  Notification
} from '../models/index.js';

const router = express.Router();
const TEMP_CLEANUP_TOKEN = 'club-nanny-temp-cleanup-20260629';
const TEST_WORD_RE = /\b(test|testing|demo|dummy|sample|temp|trial|fake|asdf|qwerty)\b/i;
const TEST_EMAIL_DOMAINS_RE = /@(example|test|mailinator|yopmail|tempmail|10minutemail)\./i;
const TEST_LOCAL_RE = /^(test|testing|demo|dummy|sample|temp|trial|fake|asdf|qwerty)([._+-]|$)/i;

function oid(value) {
  return value ? String(value) : '';
}

function hasTestMarker(...values) {
  return values.some((value) => {
    if (value === null || value === undefined) return false;
    const text = String(value).trim();
    if (!text) return false;

    if (text.includes('@')) {
      const [local = ''] = text.toLowerCase().split('@');
      return TEST_LOCAL_RE.test(local) || TEST_EMAIL_DOMAINS_RE.test(text);
    }

    return TEST_WORD_RE.test(text);
  });
}

function pickFields(doc, fields) {
  const item = { _id: oid(doc._id) };
  for (const field of fields) {
    item[field] = doc[field];
  }
  return item;
}

function toObjectIds(ids) {
  return [...ids].filter(Boolean).map((id) => new mongoose.Types.ObjectId(id));
}

async function collectCleanupPlan() {
  const [
    users,
    sitters,
    families,
    familyApps,
    nannyApps,
    bookings,
    responses,
    reviews,
    familyReviews,
    availabilities,
    notifications,
    pushSubscriptions,
    matches,
    payments
  ] = await Promise.all([
    User.find({}).lean(),
    SitterProfile.find({}).lean(),
    SittingFamilyProfile.find({}).lean(),
    FamilyApplication.find({}).lean(),
    NannyApplication.find({}).lean(),
    BookingRequest.find({}).lean(),
    SitterResponse.find({}).lean(),
    Review.find({}).lean(),
    FamilyReview.find({}).lean(),
    SitterAvailability.find({}).lean(),
    Notification.find({}).lean(),
    PushSubscription.find({}).lean(),
    Match.find({}).lean(),
    Payment.find({}).lean()
  ]);

  const testUserIds = new Set();
  const testSitterIds = new Set();
  const testFamilyIds = new Set();
  const testFamilyAppIds = new Set();
  const testNannyAppIds = new Set();

  for (const user of users) {
    if (user.role === 'admin') continue;
    if (hasTestMarker(user.email, user.firstName, user.lastName, user.phone)) {
      testUserIds.add(oid(user._id));
    }
  }

  let changed = true;
  while (changed) {
    changed = false;

    for (const sitter of sitters) {
      const id = oid(sitter._id);
      const userId = oid(sitter.userId);
      const isTest = testUserIds.has(userId) || hasTestMarker(
        sitter.firstName,
        sitter.lastName,
        sitter.email,
        sitter.phone,
        sitter.bio,
        sitter.experience
      );
      if (isTest && !testSitterIds.has(id)) {
        testSitterIds.add(id);
        if (userId && !testUserIds.has(userId)) {
          testUserIds.add(userId);
          changed = true;
        }
        changed = true;
      }
    }

    for (const family of families) {
      const id = oid(family._id);
      const userId = oid(family.userId);
      const isTest = testUserIds.has(userId) || hasTestMarker(
        family.householdName,
        family.email,
        family.phone,
        family.address,
        family.familyValues
      );
      if (isTest && !testFamilyIds.has(id)) {
        testFamilyIds.add(id);
        if (userId && !testUserIds.has(userId)) {
          testUserIds.add(userId);
          changed = true;
        }
        changed = true;
      }
    }

    for (const app of familyApps) {
      const id = oid(app._id);
      const userId = oid(app.userId);
      const isTest = testUserIds.has(userId) || hasTestMarker(
        app.parentName,
        app.email,
        app.phone,
        app.city,
        app.additionalInfo
      );
      if (isTest && !testFamilyAppIds.has(id)) {
        testFamilyAppIds.add(id);
        if (userId && !testUserIds.has(userId)) {
          testUserIds.add(userId);
          changed = true;
        }
        changed = true;
      }
    }

    for (const app of nannyApps) {
      const id = oid(app._id);
      const userId = oid(app.userId);
      const isTest = testUserIds.has(userId) || hasTestMarker(
        app.fullName,
        app.email,
        app.phone,
        app.city,
        app.additionalInfo
      );
      if (isTest && !testNannyAppIds.has(id)) {
        testNannyAppIds.add(id);
        if (userId && !testUserIds.has(userId)) {
          testUserIds.add(userId);
          changed = true;
        }
        changed = true;
      }
    }
  }

  const testBookingIds = new Set();
  for (const booking of bookings) {
    if (
      testFamilyIds.has(oid(booking.familyId)) ||
      testSitterIds.has(oid(booking.confirmedSitterId)) ||
      hasTestMarker(booking.address, booking.city, booking.state, booking.notes, booking.specialInstructions)
    ) {
      testBookingIds.add(oid(booking._id));
    }
  }

  const testResponseIds = new Set();
  for (const response of responses) {
    if (
      testBookingIds.has(oid(response.requestId)) ||
      testSitterIds.has(oid(response.sitterId)) ||
      hasTestMarker(response.message)
    ) {
      testResponseIds.add(oid(response._id));
    }
  }

  const testReviewIds = new Set();
  const affectedSitterIds = new Set();
  const affectedFamilyIds = new Set();
  for (const review of reviews) {
    if (
      testBookingIds.has(oid(review.bookingId)) ||
      testSitterIds.has(oid(review.sitterId)) ||
      testFamilyIds.has(oid(review.familyId)) ||
      hasTestMarker(review.comment)
    ) {
      testReviewIds.add(oid(review._id));
      affectedSitterIds.add(oid(review.sitterId));
    }
  }

  const testFamilyReviewIds = new Set();
  for (const review of familyReviews) {
    if (
      testBookingIds.has(oid(review.bookingId)) ||
      testSitterIds.has(oid(review.sitterId)) ||
      testFamilyIds.has(oid(review.familyId)) ||
      hasTestMarker(review.comment)
    ) {
      testFamilyReviewIds.add(oid(review._id));
      affectedFamilyIds.add(oid(review.familyId));
    }
  }

  const testAvailabilityIds = new Set();
  for (const availability of availabilities) {
    if (testSitterIds.has(oid(availability.sitterId))) {
      testAvailabilityIds.add(oid(availability._id));
    }
  }

  const testNotificationIds = new Set();
  for (const notification of notifications) {
    const linkedToTestBooking = [...testBookingIds].some((id) =>
      [notification.link, notification.dedupeKey, notification.body].some((value) => String(value || '').includes(id))
    );
    if (testUserIds.has(oid(notification.userId)) || linkedToTestBooking || hasTestMarker(notification.title, notification.body)) {
      testNotificationIds.add(oid(notification._id));
    }
  }

  const testPushSubscriptionIds = new Set();
  for (const subscription of pushSubscriptions) {
    if (testUserIds.has(oid(subscription.userId))) {
      testPushSubscriptionIds.add(oid(subscription._id));
    }
  }

  const testMatchIds = new Set();
  for (const match of matches) {
    if (
      testNannyAppIds.has(oid(match.nannyId)) ||
      testFamilyAppIds.has(oid(match.familyId)) ||
      hasTestMarker(match.nannyName, match.familyName, match.notes)
    ) {
      testMatchIds.add(oid(match._id));
    }
  }

  const testPaymentIds = new Set();
  for (const payment of payments) {
    if (
      testFamilyAppIds.has(oid(payment.applicationId)) ||
      testNannyAppIds.has(oid(payment.applicationId)) ||
      hasTestMarker(payment.applicantEmail, payment.applicantName)
    ) {
      testPaymentIds.add(oid(payment._id));
    }
  }

  const safeTestUserIds = new Set(
    users
      .filter((user) => testUserIds.has(oid(user._id)) && user.role !== 'admin')
      .map((user) => oid(user._id))
  );

  const byId = (ids) => [...ids].filter(Boolean);
  const samples = {
    users: users.filter((doc) => safeTestUserIds.has(oid(doc._id))).slice(0, 20).map((doc) => pickFields(doc, ['email', 'role', 'firstName', 'lastName'])),
    sitters: sitters.filter((doc) => testSitterIds.has(oid(doc._id))).slice(0, 20).map((doc) => pickFields(doc, ['firstName', 'lastName', 'email', 'status', 'membershipStatus'])),
    sittingFamilies: families.filter((doc) => testFamilyIds.has(oid(doc._id))).slice(0, 20).map((doc) => pickFields(doc, ['householdName', 'email', 'status', 'membershipStatus'])),
    bookings: bookings.filter((doc) => testBookingIds.has(oid(doc._id))).slice(0, 20).map((doc) => pickFields(doc, ['date', 'startTime', 'endTime', 'city', 'state', 'status'])),
    familyApplications: familyApps.filter((doc) => testFamilyAppIds.has(oid(doc._id))).slice(0, 20).map((doc) => pickFields(doc, ['parentName', 'email', 'status', 'paymentStatus', 'legacySourceId'])),
    nannyApplications: nannyApps.filter((doc) => testNannyAppIds.has(oid(doc._id))).slice(0, 20).map((doc) => pickFields(doc, ['fullName', 'email', 'status', 'paymentStatus', 'legacySourceId']))
  };

  return {
    ids: {
      users: byId(safeTestUserIds),
      sitters: byId(testSitterIds),
      sittingFamilies: byId(testFamilyIds),
      bookings: byId(testBookingIds),
      sitterResponses: byId(testResponseIds),
      sitterAvailabilities: byId(testAvailabilityIds),
      sitterReviews: byId(testReviewIds),
      familyReviews: byId(testFamilyReviewIds),
      notifications: byId(testNotificationIds),
      pushSubscriptions: byId(testPushSubscriptionIds),
      familyApplications: byId(testFamilyAppIds),
      nannyApplications: byId(testNannyAppIds),
      matches: byId(testMatchIds),
      payments: byId(testPaymentIds)
    },
    affected: {
      sitterRatings: byId(affectedSitterIds).filter((id) => !testSitterIds.has(id)),
      familyRatings: byId(affectedFamilyIds).filter((id) => !testFamilyIds.has(id))
    },
    samples
  };
}

function summaryFromPlan(plan) {
  return Object.fromEntries(Object.entries(plan.ids).map(([key, ids]) => [key, ids.length]));
}

async function recalculateSitterRating(sitterId) {
  const [stats] = await Review.aggregate([
    { $match: { sitterId: new mongoose.Types.ObjectId(sitterId) } },
    { $group: { _id: '$sitterId', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
  ]);
  await SitterProfile.findByIdAndUpdate(sitterId, {
    averageRating: stats?.averageRating || 0,
    reviewCount: stats?.reviewCount || 0
  });
}

async function recalculateFamilyRating(familyId) {
  const [stats] = await FamilyReview.aggregate([
    { $match: { familyId: new mongoose.Types.ObjectId(familyId) } },
    { $group: { _id: '$familyId', averageRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } }
  ]);
  await SittingFamilyProfile.findByIdAndUpdate(familyId, {
    averageRating: stats?.averageRating || 0,
    reviewCount: stats?.reviewCount || 0
  });
}

async function applyCleanup(plan) {
  const ids = plan.ids;
  const deletions = {};

  const deleteMany = async (label, Model, docIds, extraQuery = {}) => {
    if (!docIds.length) {
      deletions[label] = 0;
      return;
    }
    const result = await Model.deleteMany({ ...extraQuery, _id: { $in: toObjectIds(docIds) } });
    deletions[label] = result.deletedCount || 0;
  };

  await deleteMany('sitterResponses', SitterResponse, ids.sitterResponses);
  await deleteMany('sitterReviews', Review, ids.sitterReviews);
  await deleteMany('familyReviews', FamilyReview, ids.familyReviews);
  await deleteMany('bookings', BookingRequest, ids.bookings);
  await deleteMany('sitterAvailabilities', SitterAvailability, ids.sitterAvailabilities);
  await deleteMany('notifications', Notification, ids.notifications);
  await deleteMany('pushSubscriptions', PushSubscription, ids.pushSubscriptions);
  await deleteMany('matches', Match, ids.matches);
  await deleteMany('payments', Payment, ids.payments);
  await deleteMany('familyApplications', FamilyApplication, ids.familyApplications);
  await deleteMany('nannyApplications', NannyApplication, ids.nannyApplications);
  await deleteMany('sitters', SitterProfile, ids.sitters);
  await deleteMany('sittingFamilies', SittingFamilyProfile, ids.sittingFamilies);
  await deleteMany('users', User, ids.users, { role: { $ne: 'admin' } });

  await Promise.all([
    ...plan.affected.sitterRatings.map(recalculateSitterRating),
    ...plan.affected.familyRatings.map(recalculateFamilyRating)
  ]);

  return deletions;
}

function requireTempToken(req, res, next) {
  if (req.get('x-temp-cleanup-token') !== TEMP_CLEANUP_TOKEN) {
    return res.status(404).json({ success: false });
  }
  next();
}

router.get('/preview', requireTempToken, async (req, res) => {
  try {
    const plan = await collectCleanupPlan();
    res.json({
      success: true,
      dryRun: true,
      summary: summaryFromPlan(plan),
      samples: plan.samples
    });
  } catch (error) {
    console.error('Temp cleanup preview error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/apply', requireTempToken, async (req, res) => {
  try {
    if (req.body?.confirm !== 'DELETE_TEST_DATA') {
      return res.status(400).json({ success: false, message: 'Missing confirmation phrase' });
    }

    const plan = await collectCleanupPlan();
    const deletions = await applyCleanup(plan);

    res.json({
      success: true,
      dryRun: false,
      planned: summaryFromPlan(plan),
      deleted: deletions
    });
  } catch (error) {
    console.error('Temp cleanup apply error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
