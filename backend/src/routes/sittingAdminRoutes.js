import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import {
  SitterProfile,
  SittingFamilyProfile,
  BookingRequest,
  SitterResponse,
  Review
} from '../models/index.js';
import stripeService from '../services/stripeService.js';
import emailService from '../services/emailService.js';
import matchingService from '../services/matchingService.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

function sitterPayloadWithCurrentEmail(sitter) {
  const sitterObject = sitter.toObject();
  const userEmail = sitterObject.userId?.email;

  if (userEmail && userEmail !== sitterObject.email) {
    const userUpdatedAt = sitterObject.userId?.updatedAt ? new Date(sitterObject.userId.updatedAt) : null;
    const profileUpdatedAt = sitterObject.updatedAt ? new Date(sitterObject.updatedAt) : null;

    if (!profileUpdatedAt || !userUpdatedAt || userUpdatedAt >= profileUpdatedAt) {
      sitterObject.email = userEmail;
    }
  }

  return sitterObject;
}

// ============================================
// SITTER MANAGEMENT
// ============================================

/**
 * GET /api/admin/sitting/sitters
 * List all sitters with optional filtering
 */
router.get('/sitters', async (req, res) => {
  try {
    const { status, membershipStatus, search, page = 1, limit = 20 } = req.query;

    const query = status ? {} : { status: { $ne: 'pending_payment' } };

    if (status) {
      query.status = status;
    }

    if (membershipStatus) {
      query.membershipStatus = membershipStatus;
    }

    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [sitters, total] = await Promise.all([
      SitterProfile.find(query)
        .populate('userId', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SitterProfile.countDocuments(query)
    ]);

    res.json({
      success: true,
      sitters,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get sitters error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sitters'
    });
  }
});

/**
 * GET /api/admin/sitting/sitters/:id
 * Get a specific sitter's details
 */
router.get('/sitters/:id', async (req, res) => {
  try {
    const sitter = await SitterProfile.findById(req.params.id)
      .populate('userId', 'email createdAt updatedAt lastLogin')
      .populate('approvedBy', 'email firstName lastName');

    if (!sitter) {
      return res.status(404).json({
        success: false,
        message: 'Sitter not found'
      });
    }

    // Get booking stats
    const bookingStats = await BookingRequest.aggregate([
      { $match: { confirmedSitterId: sitter._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Payment totals across this sitter's bookings (for support / payout awareness)
    const [paymentStats] = await BookingRequest.aggregate([
      { $match: { confirmedSitterId: sitter._id, 'payment.status': 'paid' } },
      {
        $group: {
          _id: null,
          paidCount: { $sum: 1 },
          paidAmountCents: { $sum: '$payment.amountCents' }
        }
      }
    ]);

    res.json({
      success: true,
      sitter: sitterPayloadWithCurrentEmail(sitter),
      bookingStats,
      paymentStats: paymentStats || { paidCount: 0, paidAmountCents: 0 }
    });
  } catch (error) {
    console.error('Get sitter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sitter'
    });
  }
});

/**
 * POST /api/admin/sitting/sitters/:id/send-confirmation
 * Resend sitter application confirmation email
 */
router.post('/sitters/:id/send-confirmation', async (req, res) => {
  try {
    const sitter = await SitterProfile.findById(req.params.id)
      .populate('userId', 'email updatedAt');

    if (!sitter) {
      return res.status(404).json({
        success: false,
        message: 'Sitter not found'
      });
    }

    if (sitter.status === 'rejected') {
      return res.status(400).json({
        success: false,
        message: 'Application confirmation email is not sent to rejected sitters'
      });
    }

    const result = await emailService.sendSitterApplicationSubmittedToApplicant(sitterPayloadWithCurrentEmail(sitter));

    res.json({
      success: Boolean(result?.success),
      message: result?.success ? 'Application confirmation email sent' : 'Failed to send application confirmation email',
      emailType: 'confirmation',
      result
    });
  } catch (error) {
    console.error('Resend sitter confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email'
    });
  }
});

/**
 * POST /api/admin/sitting/sitters/:id/send-approval
 * Resend sitter approval email with web app download and notification instructions
 */
router.post('/sitters/:id/send-approval', async (req, res) => {
  try {
    const sitter = await SitterProfile.findById(req.params.id)
      .populate('userId', 'email updatedAt');

    if (!sitter) {
      return res.status(404).json({
        success: false,
        message: 'Sitter not found'
      });
    }

    if (sitter.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Approval email can only be sent to approved active sitters'
      });
    }

    const result = await emailService.sendSitterApprovalEmail(sitterPayloadWithCurrentEmail(sitter));

    res.json({
      success: Boolean(result?.success),
      message: result?.success ? 'Approval email sent' : 'Failed to send approval email',
      result
    });
  } catch (error) {
    console.error('Resend sitter approval error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send approval email'
    });
  }
});

/**
 * GET /api/admin/sitting/sitters/:id/reviews
 * Get reviews for a sitter
 */
router.get('/sitters/:id/reviews', async (req, res) => {
  try {
    const sitter = await SitterProfile.findById(req.params.id);

    if (!sitter) {
      return res.status(404).json({
        success: false,
        message: 'Sitter not found'
      });
    }

    const reviews = await Review.find({ sitterId: sitter._id })
      .populate('familyId', 'householdName email')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews
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
 * DELETE /api/admin/sitting/sitters/:id/reviews/:reviewId
 * Delete a sitter review and recompute the sitter rating
 */
router.delete('/sitters/:id/reviews/:reviewId', async (req, res) => {
  try {
    const sitter = await SitterProfile.findById(req.params.id);

    if (!sitter) {
      return res.status(404).json({
        success: false,
        message: 'Sitter not found'
      });
    }

    const review = await Review.findOneAndDelete({
      _id: req.params.reviewId,
      sitterId: sitter._id
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    await matchingService.recomputeSitterRating(sitter._id);

    res.json({
      success: true,
      message: 'Review deleted'
    });
  } catch (error) {
    console.error('Delete sitter review error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete review'
    });
  }
});

/**
 * PUT /api/admin/sitting/sitters/:id/approve
 * Approve a sitter
 */
router.put('/sitters/:id/approve', async (req, res) => {
  try {
    const sitter = await SitterProfile.findById(req.params.id);

    if (!sitter) {
      return res.status(404).json({
        success: false,
        message: 'Sitter not found'
      });
    }

    if (sitter.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'Sitter is not pending approval'
      });
    }

    sitter.status = 'active';
    sitter.membershipStatus = 'active';
    sitter.membershipExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    sitter.membershipFeeAppliedAt = sitter.membershipFeeAppliedAt || new Date();
    sitter.approvedAt = new Date();
    sitter.approvedBy = req.user.id;
    await sitter.save();

    try {
      const emailResult = await emailService.sendSitterApprovalEmail(sitter.toObject());
      console.log('Sitter approval email processed:', emailResult);
    } catch (emailError) {
      console.error('Failed to send sitter approval email:', emailError.message);
    }

    res.json({
      success: true,
      message: 'Sitter approved. First month subscription has been applied.',
      sitter
    });
  } catch (error) {
    console.error('Approve sitter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to approve sitter'
    });
  }
});

/**
 * PUT /api/admin/sitting/sitters/:id/reject
 * Reject a sitter
 */
router.put('/sitters/:id/reject', async (req, res) => {
  try {
    const sitter = await SitterProfile.findById(req.params.id);

    if (!sitter) {
      return res.status(404).json({
        success: false,
        message: 'Sitter not found'
      });
    }

    let membershipRefund = null;
    const membershipRefundAmount = sitter.membershipFeeAmountCents || 0;

    if (membershipRefundAmount > 0 && !sitter.membershipFeeRefundedAt) {
      if (!sitter.stripePaymentIntentId) {
        return res.status(400).json({
          success: false,
          message: 'Cannot refund the membership fee because this sitter has no Stripe payment intent recorded.'
        });
      }

      membershipRefund = await stripeService.refundPaymentIntent({
        paymentIntentId: sitter.stripePaymentIntentId,
        amount: membershipRefundAmount,
        metadata: {
          refundType: 'sitter_membership_rejection',
          sitterProfileId: sitter._id.toString(),
          sitterEmail: sitter.email
        }
      });

      sitter.membershipFeeRefundId = membershipRefund.id;
      sitter.membershipFeeRefundedAt = new Date();
    }

    sitter.status = 'rejected';
    sitter.membershipStatus = 'inactive';
    sitter.rejectionReason = req.body.reason || 'Application rejected';
    await sitter.save();

    let rejectionEmailSent = false;
    try {
      const emailResult = await emailService.sendSitterRejectionEmail(sitter.toObject(), {
        membershipRefunded: Boolean(membershipRefund)
      });
      rejectionEmailSent = Boolean(emailResult?.success);
      console.log('Sitter rejection email processed:', emailResult);
    } catch (emailError) {
      console.error('Failed to send sitter rejection email:', emailError.message);
    }

    res.json({
      success: true,
      message: membershipRefund
        ? 'Sitter rejected. The $12 first month subscription fee has been refunded.'
        : 'Sitter rejected.',
      membershipRefund,
      rejectionEmailSent,
      sitter
    });
  } catch (error) {
    console.error('Reject sitter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reject sitter'
    });
  }
});

/**
 * PUT /api/admin/sitting/sitters/:id/suspend
 * Suspend a sitter
 */
router.put('/sitters/:id/suspend', async (req, res) => {
  try {
    const sitter = await SitterProfile.findById(req.params.id);

    if (!sitter) {
      return res.status(404).json({
        success: false,
        message: 'Sitter not found'
      });
    }

    sitter.status = 'suspended';
    await sitter.save();

    res.json({
      success: true,
      sitter
    });
  } catch (error) {
    console.error('Suspend sitter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suspend sitter'
    });
  }
});

/**
 * PUT /api/admin/sitting/sitters/:id/activate
 * Reactivate a suspended sitter
 */
router.put('/sitters/:id/activate', async (req, res) => {
  try {
    const sitter = await SitterProfile.findById(req.params.id);

    if (!sitter) {
      return res.status(404).json({
        success: false,
        message: 'Sitter not found'
      });
    }

    if (sitter.membershipStatus !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Sitter membership is not active'
      });
    }

    sitter.status = 'active';
    await sitter.save();

    res.json({
      success: true,
      sitter
    });
  } catch (error) {
    console.error('Activate sitter error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate sitter'
    });
  }
});

// ============================================
// FAMILY MANAGEMENT
// ============================================

/**
 * GET /api/admin/sitting/families
 * List all sitting families
 */
router.get('/families', async (req, res) => {
  try {
    const { status, membershipStatus, search, page = 1, limit = 20 } = req.query;

    const query = status ? {} : { status: { $ne: 'pending_payment' } };

    if (status) {
      query.status = status;
    }

    if (membershipStatus) {
      query.membershipStatus = membershipStatus;
    }

    if (search) {
      query.$or = [
        { householdName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [families, total] = await Promise.all([
      SittingFamilyProfile.find(query)
        .populate('userId', 'email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      SittingFamilyProfile.countDocuments(query)
    ]);

    res.json({
      success: true,
      families,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get families error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get families'
    });
  }
});

/**
 * GET /api/admin/sitting/families/:id
 * Get a specific family's details
 */
router.get('/families/:id', async (req, res) => {
  try {
    const family = await SittingFamilyProfile.findById(req.params.id)
      .populate('userId', 'email createdAt lastLogin');

    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Family not found'
      });
    }

    // Get booking stats
    const bookingStats = await BookingRequest.aggregate([
      { $match: { familyId: family._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      family,
      bookingStats
    });
  } catch (error) {
    console.error('Get family error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get family'
    });
  }
});

/**
 * POST /api/admin/sitting/families/:id/send-confirmation
 * Resend sitting family application confirmation email
 */
router.post('/families/:id/send-confirmation', async (req, res) => {
  try {
    const family = await SittingFamilyProfile.findById(req.params.id);

    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Family not found'
      });
    }

    const result = await emailService.sendSittingFamilyApplicationSubmittedToApplicant(family.toObject());

    res.json({
      success: Boolean(result?.success),
      message: result?.success ? 'Confirmation email sent' : 'Failed to send confirmation email',
      result
    });
  } catch (error) {
    console.error('Resend sitting family confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email'
    });
  }
});

// ============================================
// BOOKING MANAGEMENT
// ============================================

/**
 * GET /api/admin/sitting/bookings
 * List all bookings
 */
router.get('/bookings', async (req, res) => {
  try {
    const { status, startDate, endDate, page = 1, limit = 20 } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.date = {};
      if (startDate) {
        query.date.$gte = new Date(startDate);
      }
      if (endDate) {
        query.date.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [bookings, total] = await Promise.all([
      BookingRequest.find(query)
        .populate('familyId', 'householdName city state')
        .populate('confirmedSitterId', 'firstName lastName email')
        .sort({ date: -1, createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      BookingRequest.countDocuments(query)
    ]);

    res.json({
      success: true,
      bookings,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
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
 * GET /api/admin/sitting/bookings/:id
 * Get a specific booking's details
 */
router.get('/bookings/:id', async (req, res) => {
  try {
    const booking = await BookingRequest.findById(req.params.id)
      .populate('familyId')
      .populate('confirmedSitterId');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Get all responses
    const responses = await SitterResponse.find({ requestId: booking._id })
      .populate('sitterId', 'firstName lastName email profilePhoto hourlyRate');

    res.json({
      success: true,
      booking,
      responses
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get booking'
    });
  }
});

/**
 * PUT /api/admin/sitting/bookings/:id/complete
 * Mark a booking as completed
 */
router.put('/bookings/:id/complete', async (req, res) => {
  try {
    const booking = await BookingRequest.findById(req.params.id);

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

// ============================================
// DASHBOARD STATS
// ============================================

/**
 * GET /api/admin/sitting/stats
 * Get Club Nanny sitter-side dashboard statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const [
      totalSitters,
      activeSitters,
      pendingSitters,
      totalFamilies,
      activeFamilies,
      totalBookings,
      confirmedBookings,
      completedBookings
    ] = await Promise.all([
      SitterProfile.countDocuments(),
      SitterProfile.countDocuments({ status: 'active', membershipStatus: 'active' }),
      SitterProfile.countDocuments({ status: 'pending_approval' }),
      SittingFamilyProfile.countDocuments(),
      SittingFamilyProfile.countDocuments({ status: 'active', membershipStatus: 'active' }),
      BookingRequest.countDocuments(),
      BookingRequest.countDocuments({ status: 'confirmed' }),
      BookingRequest.countDocuments({ status: 'completed' })
    ]);

    // Get recent activity
    const recentBookings = await BookingRequest.find()
      .populate('familyId', 'householdName')
      .populate('confirmedSitterId', 'firstName lastName')
      .sort({ createdAt: -1 })
      .limit(5);

    const recentSitters = await SitterProfile.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      stats: {
        sitters: {
          total: totalSitters,
          active: activeSitters,
          pending: pendingSitters
        },
        families: {
          total: totalFamilies,
          active: activeFamilies
        },
        bookings: {
          total: totalBookings,
          confirmed: confirmedBookings,
          completed: completedBookings
        }
      },
      recent: {
        bookings: recentBookings,
        sitters: recentSitters
      }
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
});

export default router;
