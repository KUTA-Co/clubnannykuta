import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  SittingFamilyProfile,
  BookingRequest,
  SitterResponse,
  SitterProfile,
  Review,
  User
} from '../models/index.js';
import matchingService from '../services/matchingService.js';
import notificationService from '../services/notificationService.js';
import stripeService from '../services/stripeService.js';

const router = express.Router();

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function dateInputValue(dateValue) {
  if (dateValue instanceof Date) {
    const year = dateValue.getFullYear();
    const month = String(dateValue.getMonth() + 1).padStart(2, '0');
    const day = String(dateValue.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(dateValue || '').slice(0, 10);
}

function parseDateTime(dateValue, timeValue) {
  const [year, month, day] = dateInputValue(dateValue).split('-').map(Number);
  const [hours, minutes] = String(timeValue || '').split(':').map(Number);

  if ([year, month, day, hours, minutes].some((value) => Number.isNaN(value))) {
    return null;
  }

  return new Date(year, month - 1, day, hours, minutes);
}

function parseRequestDateTimes(dateValue, startTime, endTime) {
  const startDateTime = parseDateTime(dateValue, startTime);
  const endDateTime = parseDateTime(dateValue, endTime);

  if (startDateTime && endDateTime && endDateTime <= startDateTime) {
    endDateTime.setDate(endDateTime.getDate() + 1);
  }

  return { startDateTime, endDateTime };
}

function parseIsoDateTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function resolveRequestDateTimes(dateValue, startTime, endTime, startAtValue, endAtValue) {
  const explicitStartAt = parseIsoDateTime(startAtValue);
  const explicitEndAt = parseIsoDateTime(endAtValue);

  if (explicitStartAt && explicitEndAt) {
    return { startAt: explicitStartAt, endAt: explicitEndAt };
  }

  const { startDateTime, endDateTime } = parseRequestDateTimes(dateValue, startTime, endTime);
  return { startAt: startDateTime, endAt: endDateTime };
}

function validateBookingRequestInput({
  date,
  startTime,
  endTime,
  address,
  city,
  state,
  postalCode,
  numberOfChildren,
  startAt
}) {
  if (!date || !startTime || !endTime || !numberOfChildren) {
    return 'Date, start time, end time, and number of children are required';
  }

  if (!address || !city || !state || !postalCode) {
    return 'Address, city, state, and ZIP code are required';
  }

  const { startDateTime, endDateTime } = parseRequestDateTimes(date, startTime, endTime);

  if (!startDateTime || !endDateTime) {
    return 'Please enter a valid date, start time, and end time';
  }

  const comparableStart = parseIsoDateTime(startAt) || startDateTime;
  if (comparableStart < new Date()) {
    return 'Start time cannot be in the past';
  }

  return null;
}

// All family routes require authentication
router.use(authenticateToken);
router.use(requireRole('family'));

// ============================================
// PROFILE ROUTES
// ============================================

/**
 * GET /api/sitting/family/profile
 * Get the authenticated family's sitting profile
 */
router.get('/profile', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get sitting family profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

/**
 * PUT /api/sitting/family/profile
 * Update the authenticated family's sitting profile
 */
router.put('/profile', async (req, res) => {
  try {
    const allowedUpdates = [
      'householdName', 'email', 'phone', 'children',
      'address', 'city', 'state', 'postalCode', 'emergencyContact'
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Array.isArray(updates.children)) {
      updates.numberOfChildren = updates.children.length;
      updates.childrenAges = updates.children
        .map((child) => child?.age)
        .filter((age) => age !== undefined && age !== null && age !== '')
        .join(', ');
    }

    if (updates.email !== undefined) {
      const email = normalizeEmail(updates.email);
      if (!/^\S+@\S+\.\S+$/.test(email)) {
        return res.status(400).json({
          success: false,
          message: 'Please enter a valid email address'
        });
      }

      const [existingUser, existingProfile] = await Promise.all([
        User.findOne({ email, _id: { $ne: req.user.id } }),
        SittingFamilyProfile.findOne({ email, userId: { $ne: req.user.id } })
      ]);

      if (existingUser || existingProfile) {
        return res.status(400).json({
          success: false,
          message: 'That email address is already in use'
        });
      }

      updates.email = email;
    }

    const profile = await SittingFamilyProfile.findOneAndUpdate(
      { userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const userUpdates = {};
    if (updates.email !== undefined) userUpdates.email = updates.email;
    if (updates.householdName !== undefined) {
      userUpdates.firstName = updates.householdName;
      userUpdates.lastName = '';
    }
    if (updates.phone !== undefined) userUpdates.phone = updates.phone;

    const user = Object.keys(userUpdates).length
      ? await User.findByIdAndUpdate(req.user.id, userUpdates, { new: true, runValidators: true }).select('email firstName lastName role')
      : await User.findById(req.user.id).select('email firstName lastName role');

    res.json({
      success: true,
      profile,
      user: user ? {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      } : undefined
    });
  } catch (error) {
    console.error('Update sitting family profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// ============================================
// BOOKING REQUESTS ROUTES
// ============================================

/**
 * POST /api/sitting/family/requests
 * Create a new booking request
 */
router.post('/requests', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    // Check if family is active
    if (profile.status !== 'active' || profile.membershipStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your membership must be active to create booking requests'
      });
    }

    const {
      date,
      startTime,
      endTime,
      address,
      city,
      state,
      postalCode,
      numberOfChildren,
      childrenAges,
      notes,
      specialInstructions,
      startAt,
      endAt,
      timeZone
    } = req.body;

    const resolvedAddress = address || profile.address;
    const resolvedCity = city || profile.city;
    const resolvedState = state || profile.state;
    const resolvedPostalCode = postalCode || profile.postalCode;

    const validationMessage = validateBookingRequestInput({
      date,
      startTime,
      endTime,
      address: resolvedAddress,
      city: resolvedCity,
      state: resolvedState,
      postalCode: resolvedPostalCode,
      numberOfChildren,
      startAt
    });

    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage
      });
    }

    const requestDateTimes = resolveRequestDateTimes(date, startTime, endTime, startAt, endAt);

    // Create the booking request
    const request = await BookingRequest.create({
      familyId: profile._id,
      date: new Date(date),
      startTime,
      endTime,
      startAt: requestDateTimes.startAt,
      endAt: requestDateTimes.endAt,
      timeZone,
      address: resolvedAddress,
      city: resolvedCity,
      state: resolvedState,
      postalCode: resolvedPostalCode,
      numberOfChildren,
      childrenAges: childrenAges || [],
      notes,
      specialInstructions,
      status: 'open',
      expiresAt: new Date(date)
    });

    // Notify active sitters in the area before the serverless function exits.
    await notificationService.notifyNewJob(request);

    res.status(201).json({
      success: true,
      request
    });
  } catch (error) {
    console.error('Create booking request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create booking request'
    });
  }
});

/**
 * GET /api/sitting/family/requests
 * Get all booking requests for the family
 */
router.get('/requests', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    // Lazily expire past-dated open requests before listing
    await matchingService.expirePastOpenRequests();

    const { status, upcoming } = req.query;

    const query = { familyId: profile._id };

    if (status) {
      query.status = status;
    }

    if (upcoming === 'true') {
      query.date = { $gte: startOfToday() };
    }

    const requests = await BookingRequest.find(query)
      .populate('confirmedSitterId', 'firstName lastName profilePhoto phone email hourlyRate hourlyRate1Kid hourlyRate2Kids hourlyRate3PlusKids averageRating reviewCount')
      .sort({ date: upcoming === 'true' ? 1 : -1 });

    // Keep the visible status aligned with currently interested sitters.
    const requestsWithCounts = await Promise.all(
      requests.map(async (request) => {
        const synced = await matchingService.syncRequestResponseStatus(request);
        return {
          ...request.toObject(),
          responseCount: synced?.responseCount
        };
      })
    );

    res.json({
      success: true,
      requests: requestsWithCounts
    });
  } catch (error) {
    console.error('Get booking requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking requests'
    });
  }
});

/**
 * GET /api/sitting/family/requests/:id
 * Get a specific booking request with sitter responses
 */
router.get('/requests/:id', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const request = await BookingRequest.findOne({
      _id: req.params.id,
      familyId: profile._id
    }).populate(
      'confirmedSitterId',
      'firstName lastName profilePhoto phone email hourlyRate hourlyRate1Kid hourlyRate2Kids hourlyRate3PlusKids bio experience city state averageRating reviewCount'
    );

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found'
      });
    }

    const synced = await matchingService.syncRequestResponseStatus(request);
    const syncedRequest = synced?.request || request;

    // Get sitter responses
    const responses = await matchingService.getRequestResponses(syncedRequest._id);
    const confirmedSitterReviews = syncedRequest.confirmedSitterId?._id
      ? await matchingService.getSitterReviews(syncedRequest.confirmedSitterId._id)
      : [];

    res.json({
      success: true,
      request: {
        ...syncedRequest.toObject(),
        responseCount: synced?.responseCount,
        confirmedSitterReviews,
        responses
      }
    });
  } catch (error) {
    console.error('Get booking request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking request'
    });
  }
});

/**
 * PUT /api/sitting/family/requests/:id
 * Update a booking request
 */
router.put('/requests/:id', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const request = await BookingRequest.findOne({
      _id: req.params.id,
      familyId: profile._id
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found'
      });
    }

    // Can only update open requests
    if (!['draft', 'open', 'responses_received'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a confirmed or completed request'
      });
    }

    const allowedUpdates = [
      'date', 'startTime', 'endTime', 'address', 'city', 'state', 'postalCode',
      'numberOfChildren', 'childrenAges', 'notes', 'specialInstructions', 'timeZone'
    ];

    const timeFieldsChanged = ['date', 'startTime', 'endTime', 'startAt', 'endAt']
      .some((key) => req.body[key] !== undefined);

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        request[key] = key === 'date' ? new Date(req.body[key]) : req.body[key];
      }
    }

    if (timeFieldsChanged) {
      const requestDateTimes = resolveRequestDateTimes(
        request.date,
        request.startTime,
        request.endTime,
        req.body.startAt,
        req.body.endAt
      );
      request.startAt = requestDateTimes.startAt;
      request.endAt = requestDateTimes.endAt;
      request.reviewReminderSentAt = null;
    }

    const validationMessage = validateBookingRequestInput(request);
    if (validationMessage) {
      return res.status(400).json({
        success: false,
        message: validationMessage
      });
    }

    await request.save();

    res.json({
      success: true,
      request
    });
  } catch (error) {
    console.error('Update booking request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update booking request'
    });
  }
});

/**
 * DELETE /api/sitting/family/requests/:id
 * Cancel a booking request
 */
router.delete('/requests/:id', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const request = await BookingRequest.findOne({
      _id: req.params.id,
      familyId: profile._id
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found'
      });
    }

    // Can't cancel completed requests
    if (request.status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot cancel a completed request'
      });
    }

    // Capture the confirmed sitter (if any) before changing status, so we can notify them
    const previouslyConfirmedSitterId = request.status === 'confirmed' ? request.confirmedSitterId : null;

    request.status = 'cancelled';
    request.cancelledAt = new Date();
    request.cancellationReason = req.body.reason || 'Cancelled by family';
    await request.save();

    // Update all interested responses to not_selected
    await SitterResponse.updateMany(
      { requestId: request._id, status: 'interested' },
      { status: 'not_selected' }
    );

    // Notify the confirmed sitter that the family cancelled before returning.
    if (previouslyConfirmedSitterId) {
      const sitter = await SitterProfile.findById(previouslyConfirmedSitterId);
      if (sitter) {
        await notificationService.notifyBookingCancelledToSitter(request, sitter, { reason: request.cancellationReason });
      }
    }

    res.json({
      success: true,
      message: 'Booking request cancelled'
    });
  } catch (error) {
    console.error('Cancel booking request error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking request'
    });
  }
});

/**
 * POST /api/sitting/family/requests/:id/confirm
 * Confirm a sitter for the booking
 */
router.post('/requests/:id/confirm', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const request = await BookingRequest.findOne({
      _id: req.params.id,
      familyId: profile._id
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Booking request not found'
      });
    }

    // Check if request can be confirmed
    if (!['open', 'responses_received'].includes(request.status)) {
      return res.status(400).json({
        success: false,
        message: 'This request cannot be confirmed'
      });
    }

    const { sitterId } = req.body;

    if (!sitterId) {
      return res.status(400).json({
        success: false,
        message: 'Sitter ID is required'
      });
    }

    // Verify sitter has responded
    const response = await SitterResponse.findOne({
      requestId: request._id,
      sitterId,
      status: 'interested'
    });

    if (!response) {
      return res.status(400).json({
        success: false,
        message: 'This sitter has not expressed interest in this job'
      });
    }

    // Verify sitter is still available
    const sitter = await SitterProfile.findById(sitterId);
    if (!sitter || sitter.status !== 'active' || sitter.membershipStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This sitter is no longer available'
      });
    }

    const isAvailable = await matchingService.checkSitterAvailability(
      sitterId,
      request.date,
      request.startTime,
      request.endTime
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'This sitter is no longer available for this time'
      });
    }

    // Confirm the booking
    request.status = 'confirmed';
    request.confirmedSitterId = sitterId;
    request.confirmedAt = new Date();
    await request.save();

    // Update selected sitter's response
    response.status = 'selected';
    response.selectedAt = new Date();
    await response.save();

    // Capture the other interested sitters before marking them not-selected (so we can notify them)
    const otherResponses = await SitterResponse.find(
      { requestId: request._id, sitterId: { $ne: sitterId }, status: 'interested' },
      { sitterId: 1 }
    );
    const otherSitterIds = otherResponses.map((r) => r.sitterId);

    // Mark all other responses as not selected
    await SitterResponse.updateMany(
      {
        requestId: request._id,
        sitterId: { $ne: sitterId },
        status: 'interested'
      },
      { status: 'not_selected' }
    );

    // Get updated request with sitter info
    const updatedRequest = await BookingRequest.findById(request._id)
      .populate('confirmedSitterId', 'firstName lastName profilePhoto phone email hourlyRate hourlyRate1Kid hourlyRate2Kids hourlyRate3PlusKids');

    // Notify the confirmed sitter, and gently notify the non-selected sitters.
    await notificationService.notifyBookingConfirmed(request, sitter, profile);
    await notificationService.notifyBookingFilledToOthers(request, otherSitterIds);

    res.json({
      success: true,
      request: updatedRequest
    });
  } catch (error) {
    console.error('Confirm sitter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm sitter'
    });
  }
});

// ============================================
// BOOKINGS ROUTES (Confirmed)
// ============================================

/**
 * GET /api/sitting/family/bookings
 * Get all confirmed bookings
 */
router.get('/bookings', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    // Lazily transition past confirmed bookings to completed
    await matchingService.autoCompletePastBookings();

    const { upcoming } = req.query;

    const query = { familyId: profile._id };

    if (upcoming === 'true') {
      // Upcoming = confirmed (not yet completed/cancelled) future bookings
      query.status = 'confirmed';
      query.date = { $gte: startOfToday() };
    } else {
      query.status = { $in: ['confirmed', 'completed'] };
    }

    const bookings = await BookingRequest.find(query)
      .populate('confirmedSitterId', 'firstName lastName profilePhoto phone email hourlyRate hourlyRate1Kid hourlyRate2Kids hourlyRate3PlusKids averageRating reviewCount')
      .sort({ date: upcoming === 'true' ? 1 : -1 });

    res.json({
      success: true,
      bookings
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get bookings'
    });
  }
});

/**
 * POST /api/sitting/family/bookings/:id/cancel-sitter
 * Family cancels the confirmed sitter for a booking. The family must provide a
 * reason, and may choose whether the request should reopen for other sitters.
 */
router.post('/bookings/:id/cancel-sitter', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const reason = String(req.body.reason || '').trim();
    const notifyOtherSitters = Boolean(req.body.notifyOtherSitters);

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Cancellation reason is required'
      });
    }

    const booking = await BookingRequest.findOne({
      _id: req.params.id,
      familyId: profile._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'confirmed' || !booking.confirmedSitterId) {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed sitter bookings can be cancelled'
      });
    }

    const cancelledSitterId = booking.confirmedSitterId;
    const sitter = await SitterProfile.findById(cancelledSitterId);

    booking.status = notifyOtherSitters ? 'open' : 'cancelled';
    booking.confirmedSitterId = null;
    booking.confirmedAt = null;
    booking.cancelledAt = new Date();
    booking.cancellationReason = reason;
    await booking.save();

    await SitterResponse.findOneAndUpdate(
      { requestId: booking._id, sitterId: cancelledSitterId },
      { status: 'withdrawn', withdrawnAt: new Date() }
    );

    if (notifyOtherSitters) {
      await matchingService.syncRequestResponseStatus(booking);
    } else {
      await SitterResponse.updateMany(
        { requestId: booking._id, status: 'interested' },
        { status: 'not_selected' }
      );
    }

    if (sitter) {
      await notificationService.notifyBookingCancelledToSitter(booking, sitter, { reason });
    }

    if (notifyOtherSitters) {
      await notificationService.notifyNewJob(booking, {
        excludeSitterIds: [cancelledSitterId],
        title: 'Babysitting Request Available Again',
        type: 'job_reopened',
        dedupeKeyPrefix: `job_reopened:${booking._id}:${Date.now()}`
      });
    }

    res.json({
      success: true,
      message: notifyOtherSitters
        ? 'Sitter cancelled and request reopened for other sitters'
        : 'Sitter cancelled and request closed',
      booking
    });
  } catch (error) {
    console.error('Family cancel sitter booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel sitter booking'
    });
  }
});

/**
 * POST /api/sitting/family/bookings/:id/complete
 * Family marks a confirmed booking as completed
 */
router.post('/bookings/:id/complete', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const booking = await BookingRequest.findOne({
      _id: req.params.id,
      familyId: profile._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed bookings can be marked as completed'
      });
    }

    booking.status = 'completed';
    booking.completedAt = new Date();
    await booking.save();

    res.json({
      success: true,
      booking
    });
  } catch (error) {
    console.error('Complete booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete booking'
    });
  }
});

/**
 * POST /api/sitting/family/bookings/:id/pay
 * Start a Stripe Checkout session to pay the confirmed sitter for this booking.
 * Amount = duration × the sitter's applicable hourly rate (snapshotted onto the booking).
 */
router.post('/bookings/:id/pay', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const booking = await BookingRequest.findOne({
      _id: req.params.id,
      familyId: profile._id
    }).populate('confirmedSitterId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (!['confirmed', 'completed'].includes(booking.status)) {
      return res.status(400).json({
        success: false,
        message: 'Only confirmed or completed bookings can be paid'
      });
    }

    if (!booking.confirmedSitterId) {
      return res.status(400).json({
        success: false,
        message: 'This booking has no confirmed sitter'
      });
    }

    if (booking.payment?.status === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'This booking has already been paid'
      });
    }

    const { hours, ratePerHourCents, amountCents } = matchingService.computeBookingAmount(
      booking,
      booking.confirmedSitterId
    );

    if (!amountCents || amountCents < 50) {
      return res.status(400).json({
        success: false,
        message: "Unable to calculate a charge — the sitter's hourly rate is not set"
      });
    }

    const rateDollars = (ratePerHourCents / 100).toFixed(2);
    const description = `${hours} hour${hours === 1 ? '' : 's'} × $${rateDollars}/hr`;

    const session = await stripeService.createBookingPaymentSession({
      bookingId: booking._id,
      email: profile.email,
      name: profile.householdName,
      amountCents,
      description
    });

    // Snapshot the amount + session on the booking (payment confirmed later by the webhook)
    booking.payment = {
      ...(booking.payment ? booking.payment.toObject?.() ?? booking.payment : {}),
      status: 'unpaid',
      amountCents,
      currency: 'usd',
      ratePerHourCents,
      hours,
      stripeSessionId: session.id
    };
    await booking.save();

    res.json({
      success: true,
      url: session.url,
      amountCents
    });
  } catch (error) {
    console.error('Booking payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start booking payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// REVIEWS
// ============================================

/**
 * GET /api/sitting/family/bookings/:id/review
 * Get the family's existing review for a booking (if any)
 */
router.get('/bookings/:id/review', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const review = await Review.findOne({
      bookingId: req.params.id,
      familyId: profile._id
    });

    res.json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get review'
    });
  }
});

/**
 * POST /api/sitting/family/bookings/:id/review
 * Leave a review for a completed booking
 */
router.post('/bookings/:id/review', async (req, res) => {
  try {
    const profile = await SittingFamilyProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Family profile not found'
      });
    }

    const booking = await BookingRequest.findOne({
      _id: req.params.id,
      familyId: profile._id
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed bookings'
      });
    }

    if (!booking.confirmedSitterId) {
      return res.status(400).json({
        success: false,
        message: 'This booking has no confirmed sitter to review'
      });
    }

    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'A rating between 1 and 5 is required'
      });
    }

    // One review per booking
    const existing = await Review.findOne({ bookingId: booking._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }

    const review = await Review.create({
      bookingId: booking._id,
      sitterId: booking.confirmedSitterId,
      familyId: profile._id,
      rating,
      comment: comment || ''
    });

    // Update the sitter's denormalized rating
    await matchingService.recomputeSitterRating(booking.confirmedSitterId);

    res.status(201).json({
      success: true,
      review
    });
  } catch (error) {
    console.error('Create review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit review'
    });
  }
});

export default router;
