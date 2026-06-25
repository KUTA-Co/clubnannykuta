import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import {
  SitterProfile,
  SittingFamilyProfile,
  BookingRequest,
  SitterResponse
} from '../models/index.js';
import stripeService from '../services/stripeService.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

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

    const query = {};

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
      .populate('userId', 'email createdAt lastLogin')
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
      sitter,
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

    res.json({
      success: true,
      message: membershipRefund
        ? 'Sitter rejected. The $12 first month subscription fee has been refunded.'
        : 'Sitter rejected.',
      membershipRefund,
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

    const query = {};

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
