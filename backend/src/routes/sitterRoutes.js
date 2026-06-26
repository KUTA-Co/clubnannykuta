import express from 'express';
import { authenticateToken, requireRole } from '../middleware/authMiddleware.js';
import {
  SitterProfile,
  SitterAvailability,
  BookingRequest,
  SitterResponse,
  SittingFamilyProfile,
  Review,
  FamilyReview
} from '../models/index.js';
import matchingService from '../services/matchingService.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

// All sitter routes require authentication
router.use(authenticateToken);
router.use(requireRole('sitter'));

// ============================================
// PROFILE ROUTES
// ============================================

/**
 * GET /api/sitter/profile
 * Get the authenticated sitter's profile
 */
router.get('/profile', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Get sitter profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile'
    });
  }
});

/**
 * PUT /api/sitter/profile
 * Update the authenticated sitter's profile
 */
router.put('/profile', async (req, res) => {
  try {
    const allowedUpdates = [
      'firstName', 'lastName', 'phone', 'bio', 'age',
      'hourlyRate', 'hourlyRate1Kid', 'hourlyRate2Kids', 'hourlyRate3PlusKids',
      'yearsOfExperience', 'ageGroupsWorkedWith', 'typesOfExperience',
      'experience', 'faithJourney', 'whyCalledToServe', 'specialSkills',
      'city', 'state', 'postalCode', 'preferredRadius'
    ];

    const updates = {};
    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const profile = await SitterProfile.findOneAndUpdate(
      { userId: req.user.id },
      updates,
      { new: true, runValidators: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Update sitter profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

/**
 * POST /api/sitter/profile/photo
 * Upload profile photo (URL-based for now)
 */
router.post('/profile/photo', async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({
        success: false,
        message: 'Photo URL is required'
      });
    }

    const profile = await SitterProfile.findOneAndUpdate(
      { userId: req.user.id },
      { profilePhoto: photoUrl },
      { new: true }
    );

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload photo'
    });
  }
});

// ============================================
// AVAILABILITY ROUTES
// ============================================

/**
 * GET /api/sitter/availability
 * Get the sitter's availability settings
 */
router.get('/availability', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    let availability = await SitterAvailability.findOne({ sitterId: profile._id });

    // Create default availability if none exists
    if (!availability) {
      availability = await SitterAvailability.create({
        sitterId: profile._id,
        blockedSlots: [],
        weeklyAvailability: {
          monday: { available: true, start: '08:00', end: '22:00' },
          tuesday: { available: true, start: '08:00', end: '22:00' },
          wednesday: { available: true, start: '08:00', end: '22:00' },
          thursday: { available: true, start: '08:00', end: '22:00' },
          friday: { available: true, start: '08:00', end: '22:00' },
          saturday: { available: true, start: '08:00', end: '22:00' },
          sunday: { available: true, start: '08:00', end: '22:00' }
        }
      });
    }

    res.json({
      success: true,
      availability
    });
  } catch (error) {
    console.error('Get availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get availability'
    });
  }
});

/**
 * PUT /api/sitter/availability
 * Update availability settings (weekly availability or blocked slots)
 */
router.put('/availability', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    const { weeklyAvailability, blockedSlots } = req.body;

    const updates = {};
    if (weeklyAvailability) {
      updates.weeklyAvailability = weeklyAvailability;
    }
    if (blockedSlots) {
      updates.blockedSlots = blockedSlots;
    }

    const availability = await SitterAvailability.findOneAndUpdate(
      { sitterId: profile._id },
      updates,
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      availability
    });
  } catch (error) {
    console.error('Update availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update availability'
    });
  }
});

/**
 * POST /api/sitter/availability/block
 * Add a blocked time slot
 */
router.post('/availability/block', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    const { date, startTime, endTime, reason, isAllDay } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        message: 'Date is required'
      });
    }

    const availability = await SitterAvailability.findOneAndUpdate(
      { sitterId: profile._id },
      {
        $push: {
          blockedSlots: {
            date,
            startTime,
            endTime,
            reason,
            isAllDay: isAllDay || false
          }
        }
      },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      availability
    });
  } catch (error) {
    console.error('Block time error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block time'
    });
  }
});

/**
 * DELETE /api/sitter/availability/block/:slotId
 * Remove a blocked time slot
 */
router.delete('/availability/block/:slotId', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    const availability = await SitterAvailability.findOneAndUpdate(
      { sitterId: profile._id },
      {
        $pull: {
          blockedSlots: { _id: req.params.slotId }
        }
      },
      { new: true }
    );

    res.json({
      success: true,
      availability
    });
  } catch (error) {
    console.error('Unblock time error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock time'
    });
  }
});

// ============================================
// JOBS ROUTES
// ============================================

/**
 * GET /api/sitter/jobs
 * Get available jobs
 */
router.get('/jobs', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    // Check if sitter is active
    if (profile.status !== 'active' || profile.membershipStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account must be active to view jobs'
      });
    }

    // Lazily expire past-dated open requests before listing
    await matchingService.expirePastOpenRequests();

    // Find open jobs. Keep the availability flag per job so sitters can see new
    // requests even when their profile location is missing or differs from the family.
    const jobQuery = {
      status: { $in: ['open', 'responses_received'] },
      date: { $gte: startOfToday() } // Include same-day jobs that have not expired yet
    };

    const jobs = await BookingRequest.find(jobQuery)
      .populate('familyId', 'householdName city state')
      .sort({ date: 1, startTime: 1 });

    // Check availability for each job and get response status
    const jobsWithStatus = await Promise.all(
      jobs.map(async (job) => {
        const isAvailable = await matchingService.checkSitterAvailability(
          profile._id,
          job.date,
          job.startTime,
          job.endTime
        );

        // Check if sitter has already responded
        const existingResponse = await SitterResponse.findOne({
          requestId: job._id,
          sitterId: profile._id
        });

        return {
          ...job.toObject(),
          isAvailable,
          hasResponded: !!existingResponse,
          responseStatus: existingResponse?.status
        };
      })
    );

    res.json({
      success: true,
      jobs: jobsWithStatus
    });
  } catch (error) {
    console.error('Get jobs error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get jobs'
    });
  }
});

/**
 * GET /api/sitter/jobs/:id
 * Get details of a specific job
 */
router.get('/jobs/:id', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    const job = await BookingRequest.findById(req.params.id)
      .populate('familyId', 'householdName city state phone email emergencyContact address postalCode');

    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if sitter has responded
    const existingResponse = await SitterResponse.findOne({
      requestId: job._id,
      sitterId: profile._id
    });

    // Check availability
    const isAvailable = await matchingService.checkSitterAvailability(
      profile._id,
      job.date,
      job.startTime,
      job.endTime
    );
    const isSelected =
      existingResponse?.status === 'selected' &&
      job.confirmedSitterId?.toString() === profile._id.toString();

    const jobObject = job.toObject();
    if (!isSelected) {
      delete jobObject.address;
      if (jobObject.familyId) {
        delete jobObject.familyId.phone;
        delete jobObject.familyId.email;
        delete jobObject.familyId.emergencyContact;
        delete jobObject.familyId.address;
        delete jobObject.familyId.postalCode;
      }
    }

    res.json({
      success: true,
      job: {
        ...jobObject,
        isAvailable,
        hasResponded: !!existingResponse,
        responseStatus: existingResponse?.status,
        response: existingResponse
      }
    });
  } catch (error) {
    console.error('Get job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get job'
    });
  }
});

/**
 * POST /api/sitter/jobs/:id/respond
 * Express interest in a job
 */
router.post('/jobs/:id/respond', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    // Check if sitter is active
    if (profile.status !== 'active' || profile.membershipStatus !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Your account must be active to respond to jobs'
      });
    }

    const job = await BookingRequest.findById(req.params.id);
    if (!job) {
      return res.status(404).json({
        success: false,
        message: 'Job not found'
      });
    }

    // Check if job is still open
    if (!['open', 'responses_received'].includes(job.status)) {
      return res.status(400).json({
        success: false,
        message: 'This job is no longer accepting responses'
      });
    }

    // An existing response may be reactivated below (if previously withdrawn / not selected)
    const existingResponse = await SitterResponse.findOne({
      requestId: job._id,
      sitterId: profile._id
    });

    if (existingResponse?.status === 'interested') {
      return res.status(400).json({
        success: false,
        message: 'You have already responded to this job'
      });
    }

    if (existingResponse?.status === 'selected') {
      return res.status(400).json({
        success: false,
        message: 'You have already been selected for this job'
      });
    }

    // Check availability
    const isAvailable = await matchingService.checkSitterAvailability(
      profile._id,
      job.date,
      job.startTime,
      job.endTime
    );

    if (!isAvailable) {
      return res.status(400).json({
        success: false,
        message: 'You have a scheduling conflict for this time'
      });
    }

    // Reactivate a previous (withdrawn / not_selected) response, or create a new one
    let response;
    if (existingResponse) {
      existingResponse.status = 'interested';
      existingResponse.message = req.body.message || existingResponse.message || '';
      existingResponse.respondedAt = new Date();
      existingResponse.withdrawnAt = undefined;
      response = await existingResponse.save();
    } else {
      response = await SitterResponse.create({
        requestId: job._id,
        sitterId: profile._id,
        status: 'interested',
        message: req.body.message || ''
      });
    }

    // Update job status if first response
    if (job.status === 'open') {
      job.status = 'responses_received';
      await job.save();
    }

    // Notify the family that a sitter is interested (fire-and-forget)
    notificationService.notifySitterResponded(job, profile);

    res.json({
      success: true,
      response
    });
  } catch (error) {
    console.error('Respond to job error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to respond to job'
    });
  }
});

/**
 * DELETE /api/sitter/jobs/:id/respond
 * Withdraw interest from a job
 */
router.delete('/jobs/:id/respond', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    const response = await SitterResponse.findOne({
      requestId: req.params.id,
      sitterId: profile._id
    });

    if (!response) {
      return res.status(404).json({
        success: false,
        message: 'Response not found'
      });
    }

    // Can only withdraw if still interested (not selected)
    if (response.status !== 'interested') {
      return res.status(400).json({
        success: false,
        message: 'Cannot withdraw after being selected'
      });
    }

    response.status = 'withdrawn';
    response.withdrawnAt = new Date();
    await response.save();

    res.json({
      success: true,
      message: 'Successfully withdrew interest'
    });
  } catch (error) {
    console.error('Withdraw response error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to withdraw response'
    });
  }
});

// ============================================
// BOOKINGS ROUTES
// ============================================

/**
 * GET /api/sitter/bookings
 * Get the sitter's confirmed and past bookings
 */
router.get('/bookings', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    // Lazily transition past confirmed bookings to completed
    await matchingService.autoCompletePastBookings();

    const { status, upcoming } = req.query;

    const query = { confirmedSitterId: profile._id };

    if (status) {
      query.status = status;
    } else if (upcoming === 'true') {
      // Upcoming = confirmed (not yet completed/cancelled) future bookings
      query.status = 'confirmed';
      query.date = { $gte: startOfToday() };
    } else {
      query.status = { $in: ['confirmed', 'completed'] };
    }

    const bookings = await BookingRequest.find(query)
      .populate('familyId', 'householdName phone address city state postalCode emergencyContact')
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
 * POST /api/sitter/bookings/:id/complete
 * Sitter marks a confirmed booking they're assigned to as completed
 */
router.post('/bookings/:id/complete', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    const booking = await BookingRequest.findOne({
      _id: req.params.id,
      confirmedSitterId: profile._id
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
 * DELETE /api/sitter/bookings/:id
 * Sitter cancels a confirmed booking. The request reopens for other sitters
 * and the family is notified.
 */
router.delete('/bookings/:id', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    const booking = await BookingRequest.findOne({
      _id: req.params.id,
      confirmedSitterId: profile._id
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
        message: 'Only a confirmed booking can be cancelled'
      });
    }

    // Reopen the request for other sitters
    booking.status = 'open';
    booking.confirmedSitterId = null;
    booking.confirmedAt = null;
    await booking.save();

    // Withdraw this sitter's response
    await SitterResponse.findOneAndUpdate(
      { requestId: booking._id, sitterId: profile._id },
      { status: 'withdrawn', withdrawnAt: new Date() }
    );

    // Notify the family the booking was cancelled and reopened (fire-and-forget)
    const family = await SittingFamilyProfile.findById(booking.familyId);
    if (family) {
      notificationService.notifyBookingReopenedToFamily(booking, family);
    }

    res.json({
      success: true,
      message: 'Booking cancelled and request reopened'
    });
  } catch (error) {
    console.error('Sitter cancel booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel booking'
    });
  }
});

// ============================================
// REVIEWS
// ============================================

/**
 * GET /api/sitter/reviews
 * List reviews left about the authenticated sitter
 */
router.get('/reviews', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Sitter profile not found'
      });
    }

    const reviews = await Review.find({ sitterId: profile._id })
      .populate('familyId', 'householdName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews,
      averageRating: profile.averageRating,
      reviewCount: profile.reviewCount
    });
  } catch (error) {
    console.error('Get sitter reviews error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reviews'
    });
  }
});

/**
 * GET /api/sitter/bookings/:id/review
 * Get the sitter's existing review of the family for a booking (if any)
 */
router.get('/bookings/:id/review', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Sitter profile not found' });
    }

    const review = await FamilyReview.findOne({
      bookingId: req.params.id,
      sitterId: profile._id
    });

    res.json({ success: true, review });
  } catch (error) {
    console.error('Get family review error:', error);
    res.status(500).json({ success: false, message: 'Failed to get review' });
  }
});

/**
 * POST /api/sitter/bookings/:id/review
 * Sitter leaves a rating/review of the family for a completed booking
 */
router.post('/bookings/:id/review', async (req, res) => {
  try {
    const profile = await SitterProfile.findOne({ userId: req.user.id });
    if (!profile) {
      return res.status(404).json({ success: false, message: 'Sitter profile not found' });
    }

    const booking = await BookingRequest.findOne({
      _id: req.params.id,
      confirmedSitterId: profile._id
    });

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    if (booking.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'You can only review completed bookings'
      });
    }

    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'A rating between 1 and 5 is required'
      });
    }

    // One review per booking (per direction)
    const existing = await FamilyReview.findOne({ bookingId: booking._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already reviewed this booking'
      });
    }

    const review = await FamilyReview.create({
      bookingId: booking._id,
      sitterId: profile._id,
      familyId: booking.familyId,
      rating,
      comment: comment || ''
    });

    // Update the family's denormalized rating
    await matchingService.recomputeFamilyRating(booking.familyId);

    res.status(201).json({ success: true, review });
  } catch (error) {
    console.error('Create family review error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit review' });
  }
});

export default router;
