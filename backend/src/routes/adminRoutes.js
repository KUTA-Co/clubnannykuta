import express from 'express';
import { authenticateToken, requireAdmin } from '../middleware/authMiddleware.js';
import emailService from '../services/emailService.js';
import stripeService from '../services/stripeService.js';
import pdfService from '../services/pdfService.js';
import {
  User,
  FamilyApplication,
  NannyApplication,
  Payment,
  ContactSubmission,
  SitterProfile,
  SittingFamilyProfile,
  Match
} from '../models/index.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticateToken);
router.use(requireAdmin);

function paymentStatusFromApplication(paymentStatus) {
  if (paymentStatus === 'paid') return 'completed';
  if (paymentStatus === 'refunded') return 'refunded';
  if (paymentStatus === 'pending') return 'pending';
  return null;
}

function normalizePaymentDoc(payment) {
  const normalized = typeof payment.toObject === 'function' ? payment.toObject() : payment;
  return {
    ...normalized,
    _id: String(payment._id),
    applicationId: payment.applicationId ? String(payment.applicationId) : payment.applicationId,
    isDerived: false
  };
}

function makeDerivedPayment({
  id,
  stripeSessionId,
  stripePaymentIntentId,
  stripeCustomerId,
  paymentType = 'application',
  applicationType,
  applicationId,
  applicationModel,
  applicantEmail,
  applicantName,
  amount,
  status,
  createdAt,
  completedAt,
  metadata
}) {
  return {
    _id: id,
    stripeSessionId,
    stripePaymentIntentId,
    stripeCustomerId,
    paymentType,
    applicationType,
    applicationId,
    applicationModel,
    applicantEmail,
    applicantName,
    amount,
    currency: 'USD',
    status,
    createdAt,
    completedAt,
    metadata,
    isDerived: true
  };
}

function getPaymentSortValue(payment, field) {
  const value = payment[field];
  if (field.toLowerCase().includes('date') || field === 'createdAt' || field === 'completedAt') {
    return value ? new Date(value).getTime() : 0;
  }
  if (typeof value === 'string') return value.toLowerCase();
  return value ?? '';
}

async function getUnifiedPayments({ status, applicationType, sortBy = 'createdAt', sortOrder = 'desc' }) {
  const query = {};
  if (status) query.status = status;
  if (applicationType) query.applicationType = applicationType;

  const paymentDocs = (await Payment.find(query).lean()).map(normalizePaymentDoc);
  const seenSessions = new Set(paymentDocs.map((payment) => payment.stripeSessionId).filter(Boolean));
  const seenApplicationKeys = new Set(
    paymentDocs.map((payment) => `${payment.applicationType}:${payment.applicationId}`).filter(Boolean)
  );
  const derivedPayments = [];

  const includeType = (type) => !applicationType || applicationType === type;
  const includeStatus = (paymentStatus) => !status || paymentStatus === status;
  const hasPaymentSession = { $exists: true, $nin: [null, ''] };

  if (includeType('family')) {
    const familyApplications = await FamilyApplication.find({
      $or: [
        { stripeSessionId: hasPaymentSession, paymentStatus: { $in: ['paid', 'pending', 'refunded'] } },
        { paymentStatus: 'paid' }
      ]
    }).lean();

    for (const application of familyApplications) {
      const derivedStatus = paymentStatusFromApplication(application.paymentStatus);
      const applicationKey = `family:${application._id}`;
      if (!derivedStatus || !includeStatus(derivedStatus)) continue;
      if ((application.stripeSessionId && seenSessions.has(application.stripeSessionId)) || seenApplicationKeys.has(applicationKey)) continue;

      derivedPayments.push(makeDerivedPayment({
        id: `derived-family-${application._id}`,
        stripeSessionId: application.stripeSessionId || `legacy-family-${application._id}`,
        stripePaymentIntentId: application.stripePaymentIntentId,
        applicationType: 'family',
        applicationId: String(application._id),
        applicationModel: 'FamilyApplication',
        applicantEmail: application.email,
        applicantName: application.parentName,
        amount: stripeService.getApplicationFee('family'),
        status: derivedStatus,
        createdAt: application.createdAt,
        completedAt: derivedStatus === 'completed' ? (application.updatedAt || application.createdAt) : undefined,
        metadata: application.stripeSessionId ? undefined : { legacyPayment: true }
      }));
    }
  }

  if (includeType('nanny')) {
    const nannyApplications = await NannyApplication.find({
      $or: [
        { stripeSessionId: hasPaymentSession, paymentStatus: { $in: ['paid', 'pending', 'refunded'] } },
        { paymentStatus: 'paid' }
      ]
    }).lean();

    for (const application of nannyApplications) {
      const derivedStatus = paymentStatusFromApplication(application.paymentStatus);
      const applicationKey = `nanny:${application._id}`;
      if (!derivedStatus || !includeStatus(derivedStatus)) continue;
      if ((application.stripeSessionId && seenSessions.has(application.stripeSessionId)) || seenApplicationKeys.has(applicationKey)) continue;

      derivedPayments.push(makeDerivedPayment({
        id: `derived-nanny-${application._id}`,
        stripeSessionId: application.stripeSessionId || `legacy-nanny-${application._id}`,
        stripePaymentIntentId: application.stripePaymentIntentId,
        applicationType: 'nanny',
        applicationId: String(application._id),
        applicationModel: 'NannyApplication',
        applicantEmail: application.email,
        applicantName: application.fullName,
        amount: stripeService.getApplicationFee('nanny'),
        status: derivedStatus,
        createdAt: application.createdAt,
        completedAt: derivedStatus === 'completed' ? (application.updatedAt || application.createdAt) : undefined,
        metadata: application.stripeSessionId ? undefined : { legacyPayment: true }
      }));
    }
  }

  if (includeType('sitter')) {
    const sitters = await SitterProfile.find({
      applicationFeePaid: true
    }).lean();

    for (const sitter of sitters) {
      const applicationKey = `sitter:${sitter._id}`;
      const derivedStatus = sitter.membershipFeeRefundedAt ? 'refunded' : 'completed';
      if (!includeStatus(derivedStatus)) continue;
      if ((sitter.stripeSessionId && seenSessions.has(sitter.stripeSessionId)) || seenApplicationKeys.has(applicationKey)) continue;

      derivedPayments.push(makeDerivedPayment({
        id: `derived-sitter-${sitter._id}`,
        stripeSessionId: sitter.stripeSessionId || `sitter-${sitter._id}`,
        stripePaymentIntentId: sitter.stripePaymentIntentId,
        stripeCustomerId: sitter.stripeCustomerId,
        paymentType: 'sitter_registration',
        applicationType: 'sitter',
        applicationId: String(sitter._id),
        applicationModel: 'SitterProfile',
        applicantEmail: sitter.email,
        applicantName: `${sitter.firstName || ''} ${sitter.lastName || ''}`.trim(),
        amount: Number(sitter.applicationFeeAmountCents || stripeService.getSittingFee('sitter_application'))
          + Number(sitter.membershipFeeAmountCents || 0),
        status: derivedStatus,
        createdAt: sitter.createdAt,
        completedAt: sitter.applicationFeePaidAt || sitter.membershipFeeChargedAt || sitter.updatedAt,
        metadata: {
          membershipFeeRefundedAt: sitter.membershipFeeRefundedAt,
          membershipFeeRefundId: sitter.membershipFeeRefundId
        }
      }));
    }
  }

  if (includeType('sitting_family')) {
    const sittingFamilies = await SittingFamilyProfile.find({
      stripeSessionId: hasPaymentSession,
      membershipStatus: 'active'
    }).lean();

    for (const family of sittingFamilies) {
      const applicationKey = `sitting_family:${family._id}`;
      const derivedStatus = 'completed';
      if (!includeStatus(derivedStatus)) continue;
      if (seenSessions.has(family.stripeSessionId) || seenApplicationKeys.has(applicationKey)) continue;

      derivedPayments.push(makeDerivedPayment({
        id: `derived-sitting-family-${family._id}`,
        stripeSessionId: family.stripeSessionId,
        stripeCustomerId: family.stripeCustomerId,
        paymentType: 'sitting_family_membership',
        applicationType: 'sitting_family',
        applicationId: String(family._id),
        applicationModel: 'SittingFamilyProfile',
        applicantEmail: family.email,
        applicantName: family.householdName,
        amount: stripeService.getSittingFee('family_membership'),
        status: derivedStatus,
        createdAt: family.createdAt,
        completedAt: family.updatedAt
      }));
    }
  }

  const direction = sortOrder === 'asc' ? 1 : -1;
  return [...paymentDocs, ...derivedPayments].sort((a, b) => {
    const aValue = getPaymentSortValue(a, sortBy);
    const bValue = getPaymentSortValue(b, sortBy);
    if (aValue < bValue) return -1 * direction;
    if (aValue > bValue) return 1 * direction;
    return 0;
  });
}

// ============================================
// DASHBOARD STATS
// ============================================

router.get('/dashboard/stats', async (req, res) => {
  try {
    const visibleApplicationQuery = { status: { $ne: 'pending_payment' } };
    const [
      totalFamilyApps,
      pendingFamilyApps,
      totalNannyApps,
      pendingNannyApps,
      totalUsers,
      totalPayments,
      recentPaymentsData,
      newContacts
    ] = await Promise.all([
      FamilyApplication.countDocuments(visibleApplicationQuery),
      FamilyApplication.countDocuments({ status: 'pending' }),
      NannyApplication.countDocuments(visibleApplicationQuery),
      NannyApplication.countDocuments({ status: 'pending' }),
      User.countDocuments(),
      Payment.countDocuments({ status: 'completed' }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      ContactSubmission.countDocuments({ status: 'new' })
    ]);

    const totalRevenue = recentPaymentsData[0]?.total || 0;

    // Get recent activity
    const recentFamilyApps = await FamilyApplication.find(visibleApplicationQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('parentName email status paymentStatus createdAt');

    const recentNannyApps = await NannyApplication.find(visibleApplicationQuery)
      .sort({ createdAt: -1 })
      .limit(5)
      .select('fullName email status paymentStatus createdAt');

    res.json({
      success: true,
      stats: {
        familyApplications: {
          total: totalFamilyApps,
          pending: pendingFamilyApps
        },
        nannyApplications: {
          total: totalNannyApps,
          pending: pendingNannyApps
        },
        users: totalUsers,
        payments: {
          total: totalPayments,
          revenue: totalRevenue,
          formattedRevenue: `$${(totalRevenue / 100).toLocaleString()}`
        },
        contacts: {
          new: newContacts
        }
      },
      recentActivity: {
        familyApplications: recentFamilyApps,
        nannyApplications: recentNannyApps
      }
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard stats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// FAMILY APPLICATIONS
// ============================================

// Bulk delete family applications
router.post('/applications/family/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No application IDs provided'
      });
    }

    // Delete related payments first
    await Payment.deleteMany({ applicationId: { $in: ids }, applicationType: 'family' });

    // Delete the applications
    const result = await FamilyApplication.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} family application(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete family applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// List all family applications
router.get('/applications/family', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'pending_payment' };
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { parentName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [applications, total] = await Promise.all([
      FamilyApplication.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('reviewedBy', 'firstName lastName email'),
      FamilyApplication.countDocuments(query)
    ]);

    res.json({
      success: true,
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List family applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single family application
router.get('/applications/family/:id', async (req, res) => {
  try {
    const application = await FamilyApplication.findById(req.params.id)
      .populate('reviewedBy', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Get family application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Resend family application confirmation email
router.post('/applications/family/:id/send-confirmation', async (req, res) => {
  try {
    const application = await FamilyApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.status === 'pending_payment' || application.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation email can only be sent after payment is completed'
      });
    }

    const result = await emailService.sendFamilyApplicationConfirmation(application.toObject());

    res.json({
      success: Boolean(result?.success),
      message: result?.success ? 'Confirmation email sent' : 'Failed to send confirmation email',
      result
    });
  } catch (error) {
    console.error('Resend family confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email'
    });
  }
});

// Update family application status
router.patch('/applications/family/:id', async (req, res) => {
  try {
    const {
      status,
      reviewNotes,
      sendEmail = true,
      // Placement tracking fields
      placementDate,
      placementEndDate,
      matchedNannyId,
      matchedNannyName,
      matchNotes
    } = req.body;

    // Validate status if provided
    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'matched', 'inactive'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    const application = await FamilyApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const previousStatus = application.status;

    // Update basic fields
    if (status) application.status = status;
    if (reviewNotes !== undefined) application.reviewNotes = reviewNotes;

    // Update placement tracking fields
    if (placementDate !== undefined) application.placementDate = placementDate || null;
    if (placementEndDate !== undefined) application.placementEndDate = placementEndDate || null;
    if (matchedNannyId !== undefined) application.matchedNannyId = matchedNannyId || null;
    if (matchedNannyName !== undefined) application.matchedNannyName = matchedNannyName || null;
    if (matchNotes !== undefined) application.matchNotes = matchNotes || null;

    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();

    await application.save();

    // Send status update email if status changed
    let emailSent = false;
    if (sendEmail && status && status !== previousStatus) {
      try {
        await emailService.sendApplicationStatusUpdate({
          email: application.email,
          name: application.parentName,
          type: 'family',
          status,
          notes: reviewNotes
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      application,
      emailSent
    });
  } catch (error) {
    console.error('Update family application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// NANNY APPLICATIONS
// ============================================

// Bulk delete nanny applications
router.post('/applications/nanny/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No application IDs provided'
      });
    }

    // Delete related payments first
    await Payment.deleteMany({ applicationId: { $in: ids }, applicationType: 'nanny' });

    // Delete the applications
    const result = await NannyApplication.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} nanny application(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete nanny applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// List all nanny applications
router.get('/applications/nanny', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    } else {
      query.status = { $ne: 'pending_payment' };
    }
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { university: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [applications, total] = await Promise.all([
      NannyApplication.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('reviewedBy', 'firstName lastName email'),
      NannyApplication.countDocuments(query)
    ]);

    res.json({
      success: true,
      applications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List nanny applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get single nanny application
router.get('/applications/nanny/:id', async (req, res) => {
  try {
    const application = await NannyApplication.findById(req.params.id)
      .populate('reviewedBy', 'firstName lastName email');

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    res.json({
      success: true,
      application
    });
  } catch (error) {
    console.error('Get nanny application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Resend nanny application confirmation email
router.post('/applications/nanny/:id/send-confirmation', async (req, res) => {
  try {
    const application = await NannyApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (application.status === 'pending_payment' || application.paymentStatus !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Confirmation email can only be sent after payment is completed'
      });
    }

    const result = await emailService.sendNannyApplicationConfirmation(application.toObject());

    res.json({
      success: Boolean(result?.success),
      message: result?.success ? 'Confirmation email sent' : 'Failed to send confirmation email',
      result
    });
  } catch (error) {
    console.error('Resend nanny confirmation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email'
    });
  }
});

// Update nanny application status
router.patch('/applications/nanny/:id', async (req, res) => {
  try {
    const {
      status,
      reviewNotes,
      sendEmail = true,
      // Background check tracking fields
      backgroundCheckStatus,
      backgroundCheckRequestedDate,
      backgroundCheckCompletedDate,
      backgroundCheckNotes,
      // Placement tracking fields
      placementDate,
      placementEndDate,
      matchedFamilyId,
      matchedFamilyName,
      matchNotes
    } = req.body;

    // Validate status if provided
    const validStatuses = ['pending', 'reviewing', 'approved', 'rejected', 'matched', 'inactive'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status value'
      });
    }

    // Validate background check status if provided
    const validBgCheckStatuses = ['not_requested', 'requested', 'in_progress', 'passed', 'failed'];
    if (backgroundCheckStatus && !validBgCheckStatuses.includes(backgroundCheckStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid background check status value'
      });
    }

    const application = await NannyApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const previousStatus = application.status;

    // Update basic fields
    if (status) application.status = status;
    if (reviewNotes !== undefined) application.reviewNotes = reviewNotes;

    // Update background check tracking fields
    console.log('Background check update:', {
      backgroundCheckStatus,
      backgroundCheckRequestedDate,
      backgroundCheckCompletedDate,
      backgroundCheckNotes
    });
    if (backgroundCheckStatus !== undefined) application.backgroundCheckStatus = backgroundCheckStatus;
    if (backgroundCheckRequestedDate !== undefined) application.backgroundCheckRequestedDate = backgroundCheckRequestedDate || null;
    if (backgroundCheckCompletedDate !== undefined) application.backgroundCheckCompletedDate = backgroundCheckCompletedDate || null;
    if (backgroundCheckNotes !== undefined) application.backgroundCheckNotes = backgroundCheckNotes || null;

    // Update placement tracking fields
    if (placementDate !== undefined) application.placementDate = placementDate || null;
    if (placementEndDate !== undefined) application.placementEndDate = placementEndDate || null;
    if (matchedFamilyId !== undefined) application.matchedFamilyId = matchedFamilyId || null;
    if (matchedFamilyName !== undefined) application.matchedFamilyName = matchedFamilyName || null;
    if (matchNotes !== undefined) application.matchNotes = matchNotes || null;

    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();

    await application.save();

    console.log('Saved nanny application:', {
      id: application._id,
      backgroundCheckStatus: application.backgroundCheckStatus,
      backgroundCheckRequestedDate: application.backgroundCheckRequestedDate,
      backgroundCheckCompletedDate: application.backgroundCheckCompletedDate,
      backgroundCheckNotes: application.backgroundCheckNotes
    });

    // Send status update email if status changed
    let emailSent = false;
    if (sendEmail && status && status !== previousStatus) {
      try {
        await emailService.sendApplicationStatusUpdate({
          email: application.email,
          name: application.fullName,
          type: 'nanny',
          status,
          notes: reviewNotes
        });
        emailSent = true;
      } catch (emailError) {
        console.error('Failed to send status update email:', emailError);
      }
    }

    res.json({
      success: true,
      message: 'Application updated successfully',
      application,
      emailSent
    });
  } catch (error) {
    console.error('Update nanny application error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update application',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// MATCHING
// ============================================

// Match a nanny with a family (creates bi-directional link)
router.post('/applications/match', async (req, res) => {
  try {
    const {
      nannyId,
      familyId,
      placementDate,
      placementEndDate,
      matchNotes
    } = req.body;

    if (!nannyId || !familyId) {
      return res.status(400).json({
        success: false,
        message: 'Both nannyId and familyId are required'
      });
    }

    const [nannyApp, familyApp] = await Promise.all([
      NannyApplication.findById(nannyId),
      FamilyApplication.findById(familyId)
    ]);

    if (!nannyApp) {
      return res.status(404).json({
        success: false,
        message: 'Nanny application not found'
      });
    }

    if (!familyApp) {
      return res.status(404).json({
        success: false,
        message: 'Family application not found'
      });
    }

    // Update nanny application
    nannyApp.status = 'matched';
    nannyApp.matchedFamilyId = familyApp._id;
    nannyApp.matchedFamilyName = familyApp.parentName;
    nannyApp.matchNotes = matchNotes || null;
    if (placementDate) nannyApp.placementDate = placementDate;
    if (placementEndDate) nannyApp.placementEndDate = placementEndDate;
    nannyApp.reviewedBy = req.user.id;
    nannyApp.reviewedAt = new Date();

    // Update family application
    familyApp.status = 'matched';
    familyApp.matchedNannyId = nannyApp._id;
    familyApp.matchedNannyName = nannyApp.fullName;
    familyApp.matchNotes = matchNotes || null;
    if (placementDate) familyApp.placementDate = placementDate;
    if (placementEndDate) familyApp.placementEndDate = placementEndDate;
    familyApp.reviewedBy = req.user.id;
    familyApp.reviewedAt = new Date();

    await Promise.all([
      nannyApp.save(),
      familyApp.save()
    ]);

    res.json({
      success: true,
      message: 'Applications matched successfully',
      nanny: nannyApp,
      family: familyApp
    });
  } catch (error) {
    console.error('Match applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to match applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Unmatch (remove the match between nanny and family)
router.post('/applications/unmatch', async (req, res) => {
  try {
    const { nannyId, familyId } = req.body;

    if (!nannyId && !familyId) {
      return res.status(400).json({
        success: false,
        message: 'Either nannyId or familyId is required'
      });
    }

    let nannyApp, familyApp;

    if (nannyId) {
      nannyApp = await NannyApplication.findById(nannyId);
      if (nannyApp?.matchedFamilyId) {
        familyApp = await FamilyApplication.findById(nannyApp.matchedFamilyId);
      }
    }

    if (familyId && !familyApp) {
      familyApp = await FamilyApplication.findById(familyId);
      if (familyApp?.matchedNannyId) {
        nannyApp = await NannyApplication.findById(familyApp.matchedNannyId);
      }
    }

    // Clear match from nanny
    if (nannyApp) {
      nannyApp.status = 'approved';
      nannyApp.matchedFamilyId = null;
      nannyApp.matchedFamilyName = null;
      nannyApp.matchNotes = null;
      nannyApp.placementDate = null;
      nannyApp.placementEndDate = null;
      await nannyApp.save();
    }

    // Clear match from family
    if (familyApp) {
      familyApp.status = 'approved';
      familyApp.matchedNannyId = null;
      familyApp.matchedNannyName = null;
      familyApp.matchNotes = null;
      familyApp.placementDate = null;
      familyApp.placementEndDate = null;
      await familyApp.save();
    }

    res.json({
      success: true,
      message: 'Match removed successfully'
    });
  } catch (error) {
    console.error('Unmatch applications error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unmatch applications',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// MULTI-MATCHING (Many-to-Many)
// ============================================

// Helper function to update application status based on active matches
async function updateApplicationMatchStatus(nannyId, familyId) {
  if (nannyId) {
    const nannyActiveMatches = await Match.countDocuments({ nannyId, status: 'active' });
    const nanny = await NannyApplication.findById(nannyId);
    if (nanny && nanny.status !== 'inactive' && nanny.status !== 'rejected') {
      nanny.status = nannyActiveMatches > 0 ? 'matched' : 'approved';
      await nanny.save();
    }
  }
  if (familyId) {
    const familyActiveMatches = await Match.countDocuments({ familyId, status: 'active' });
    const family = await FamilyApplication.findById(familyId);
    if (family && family.status !== 'inactive' && family.status !== 'rejected') {
      family.status = familyActiveMatches > 0 ? 'matched' : 'approved';
      await family.save();
    }
  }
}

// Get all matches (with filters)
router.get('/matches', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      nannyId,
      familyId
    } = req.query;

    const query = {};
    if (status) query.status = status;
    if (nannyId) query.nannyId = nannyId;
    if (familyId) query.familyId = familyId;

    const [matches, total] = await Promise.all([
      Match.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit)),
      Match.countDocuments(query)
    ]);

    res.json({
      success: true,
      matches,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch matches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get matches for a specific nanny
router.get('/matches/nanny/:nannyId', async (req, res) => {
  try {
    const { nannyId } = req.params;
    const { status } = req.query;

    const query = { nannyId };
    if (status) query.status = status;

    const matches = await Match.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      matches
    });
  } catch (error) {
    console.error('Get nanny matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nanny matches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get matches for a specific family
router.get('/matches/family/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    const { status } = req.query;

    const query = { familyId };
    if (status) query.status = status;

    const matches = await Match.find(query).sort({ createdAt: -1 });

    res.json({
      success: true,
      matches
    });
  } catch (error) {
    console.error('Get family matches error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch family matches',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new match
router.post('/matches', async (req, res) => {
  try {
    const {
      nannyId,
      familyId,
      startDate,
      endDate,
      schedule,
      notes
    } = req.body;

    if (!nannyId || !familyId) {
      return res.status(400).json({
        success: false,
        message: 'Both nannyId and familyId are required'
      });
    }

    // Fetch both applications
    const [nanny, family] = await Promise.all([
      NannyApplication.findById(nannyId),
      FamilyApplication.findById(familyId)
    ]);

    if (!nanny) {
      return res.status(404).json({
        success: false,
        message: 'Nanny application not found'
      });
    }

    if (!family) {
      return res.status(404).json({
        success: false,
        message: 'Family application not found'
      });
    }

    // Check if an active match already exists between these two
    const existingMatch = await Match.findOne({
      nannyId,
      familyId,
      status: 'active'
    });

    if (existingMatch) {
      return res.status(400).json({
        success: false,
        message: 'An active match already exists between this nanny and family'
      });
    }

    // Create the match
    const match = new Match({
      nannyId,
      familyId,
      nannyName: nanny.fullName,
      familyName: family.parentName,
      startDate: startDate || null,
      endDate: endDate || null,
      schedule: schedule || null,
      notes: notes || null,
      status: 'active',
      createdBy: req.user.id
    });

    await match.save();

    // Update both application statuses to 'matched'
    await updateApplicationMatchStatus(nannyId, familyId);

    res.json({
      success: true,
      message: 'Match created successfully',
      match
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a match
router.patch('/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      startDate,
      endDate,
      schedule,
      notes,
      status
    } = req.body;

    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const oldStatus = match.status;

    // Update fields
    if (startDate !== undefined) match.startDate = startDate || null;
    if (endDate !== undefined) match.endDate = endDate || null;
    if (schedule !== undefined) match.schedule = schedule || null;
    if (notes !== undefined) match.notes = notes || null;
    if (status && ['active', 'completed', 'cancelled'].includes(status)) {
      match.status = status;
    }

    await match.save();

    // If status changed, update application statuses
    if (oldStatus !== match.status) {
      await updateApplicationMatchStatus(match.nannyId, match.familyId);
    }

    res.json({
      success: true,
      message: 'Match updated successfully',
      match
    });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a match (or mark as cancelled)
router.delete('/matches/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { permanent } = req.query;

    const match = await Match.findById(id);

    if (!match) {
      return res.status(404).json({
        success: false,
        message: 'Match not found'
      });
    }

    const { nannyId, familyId } = match;

    if (permanent === 'true') {
      // Permanently delete
      await Match.findByIdAndDelete(id);
    } else {
      // Soft delete - mark as cancelled
      match.status = 'cancelled';
      await match.save();
    }

    // Update application statuses
    await updateApplicationMatchStatus(nannyId, familyId);

    res.json({
      success: true,
      message: permanent === 'true' ? 'Match deleted permanently' : 'Match cancelled successfully'
    });
  } catch (error) {
    console.error('Delete match error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete match',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// PAYMENTS
// ============================================

router.post('/payments/sync-stripe-applications', async (req, res) => {
  try {
    const {
      since = '2026-06-16',
      dryRun = false,
      maxSessions = 300
    } = req.body || {};

    const sinceDate = new Date(`${since}T00:00:00.000Z`);
    if (Number.isNaN(sinceDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid since date. Use YYYY-MM-DD.'
      });
    }

    const stripe = stripeService.ensureConfigured();
    const sessions = [];
    let startingAfter;

    while (sessions.length < Number(maxSessions)) {
      const page = await stripe.checkout.sessions.list({
        limit: Math.min(100, Number(maxSessions) - sessions.length),
        created: { gte: Math.floor(sinceDate.getTime() / 1000) },
        ...(startingAfter ? { starting_after: startingAfter } : {})
      });

      sessions.push(...page.data);
      if (!page.has_more || !page.data.length) break;
      startingAfter = page.data[page.data.length - 1].id;
    }

    const summary = {
      scanned: sessions.length,
      applicationSessions: 0,
      createdApplications: 0,
      updatedApplications: 0,
      createdPayments: 0,
      updatedPayments: 0,
      skipped: 0,
      dryRun: Boolean(dryRun),
      recovered: []
    };

    for (const session of sessions) {
      const applicationType = session.metadata?.applicationType;
      if (!['family', 'nanny'].includes(applicationType)) {
        summary.skipped += 1;
        continue;
      }

      summary.applicationSessions += 1;

      const email = (session.metadata?.applicantEmail || session.customer_email || '').toLowerCase();
      const applicantName = session.metadata?.applicantName || session.customer_details?.name || 'Recovered Applicant';
      const paymentStatus = session.payment_status === 'paid' ? 'paid' : 'pending';
      const recordStatus = session.payment_status === 'paid' ? 'completed' : 'pending';
      const createdAt = new Date(session.created * 1000);
      const dateWindowStart = new Date(createdAt.getTime() - 3 * 24 * 60 * 60 * 1000);
      const dateWindowEnd = new Date(createdAt.getTime() + 3 * 24 * 60 * 60 * 1000);
      const Model = applicationType === 'family' ? FamilyApplication : NannyApplication;
      const nameField = applicationType === 'family' ? 'parentName' : 'fullName';
      const applicationModel = applicationType === 'family' ? 'FamilyApplication' : 'NannyApplication';
      const amount = Number(session.amount_total || stripeService.getApplicationFee(applicationType));

      if (!email) {
        summary.skipped += 1;
        continue;
      }

      let application = await Model.findOne({ stripeSessionId: session.id });
      if (!application) {
        application = await Model.findOne({
          email,
          createdAt: { $gte: dateWindowStart, $lte: dateWindowEnd }
        });
      }

      if (!application) {
        if (!dryRun) {
          application = await Model.create({
            [nameField]: applicantName,
            email,
            status: 'pending',
            paymentStatus,
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || undefined,
            createdAt,
            updatedAt: createdAt,
            reviewNotes: 'Recovered from Stripe payment because the application record was missing after payment.'
          });
        }
        summary.createdApplications += 1;
      } else {
        if (!dryRun) {
          application.paymentStatus = paymentStatus;
          application.stripeSessionId = session.id;
          application.stripePaymentIntentId = session.payment_intent || application.stripePaymentIntentId;
          await application.save();
        }
        summary.updatedApplications += 1;
      }

      let payment = await Payment.findOne({ stripeSessionId: session.id });
      if (!payment && application?._id) {
        if (!dryRun) {
          payment = await Payment.create({
            stripeSessionId: session.id,
            stripePaymentIntentId: session.payment_intent || undefined,
            stripeCustomerId: session.customer || undefined,
            paymentType: 'application',
            applicationType,
            applicationId: application._id,
            applicationModel,
            applicantEmail: email,
            applicantName,
            amount,
            status: recordStatus,
            completedAt: session.payment_status === 'paid' ? createdAt : undefined,
            metadata: {
              recoveredFromStripe: true
            }
          });
        }
        summary.createdPayments += 1;
      } else if (payment) {
        if (!dryRun) {
          payment.status = recordStatus;
          payment.amount = amount;
          payment.stripePaymentIntentId = session.payment_intent || payment.stripePaymentIntentId;
          payment.stripeCustomerId = session.customer || payment.stripeCustomerId;
          payment.completedAt = session.payment_status === 'paid' ? (payment.completedAt || createdAt) : payment.completedAt;
          await payment.save();
        }
        summary.updatedPayments += 1;
      }

      summary.recovered.push({
        type: applicationType,
        name: applicantName,
        email,
        paymentStatus,
        amount,
        sessionId: session.id,
        createdAt
      });
    }

    res.json({
      success: true,
      message: `Stripe sync complete: ${summary.createdApplications} applications created, ${summary.createdPayments} payments created.`,
      summary
    });
  } catch (error) {
    console.error('Stripe application payment sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync Stripe application payments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/payments', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      applicationType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const unifiedPayments = await getUnifiedPayments({ status, applicationType, sortBy, sortOrder });
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const total = unifiedPayments.length;
    const payments = unifiedPayments.slice((parsedPage - 1) * parsedLimit, parsedPage * parsedLimit);

    res.json({
      success: true,
      payments,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (error) {
    console.error('List payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// USERS
// ============================================

router.get('/users', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      role,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } }
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      User.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .select('-password'),
      User.countDocuments(query)
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update user
router.patch('/users/:id', async (req, res) => {
  try {
    const { isActive, role } = req.body;

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    if (typeof isActive === 'boolean') user.isActive = isActive;
    if (role && ['family', 'nanny', 'admin'].includes(role)) user.role = role;

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// CONTACT SUBMISSIONS
// ============================================

router.get('/contacts', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (status) query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } }
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [contacts, total] = await Promise.all([
      ContactSubmission.find(query)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('respondedBy', 'firstName lastName email'),
      ContactSubmission.countDocuments(query)
    ]);

    res.json({
      success: true,
      contacts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('List contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch contacts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Export contacts (no pagination, for CSV/PDF)
router.get('/contacts/export', async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;

    const query = {};
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.createdAt.$lte = end;
      }
    }

    const contacts = await ContactSubmission.find(query)
      .sort({ createdAt: -1 })
      .populate('respondedBy', 'firstName lastName email');

    res.json({
      success: true,
      contacts
    });
  } catch (error) {
    console.error('Export contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export contacts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update contact status
router.patch('/contacts/:id', async (req, res) => {
  try {
    const { status, responseNotes } = req.body;

    const contact = await ContactSubmission.findById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    if (status) contact.status = status;
    if (responseNotes !== undefined) contact.responseNotes = responseNotes;

    if (status === 'replied') {
      contact.respondedBy = req.user.id;
      contact.respondedAt = new Date();
    }

    await contact.save();

    res.json({
      success: true,
      message: 'Contact updated successfully',
      contact
    });
  } catch (error) {
    console.error('Update contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update contact',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete single contact
router.delete('/contacts/:id', async (req, res) => {
  try {
    const contact = await ContactSubmission.findByIdAndDelete(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: 'Contact submission not found'
      });
    }

    res.json({
      success: true,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contact',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Bulk delete contacts
router.post('/contacts/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No contact IDs provided'
      });
    }

    const result = await ContactSubmission.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} contact(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete contacts error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete contacts',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// VERIFY PAYMENT STATUS
// ============================================

router.post('/verify-payment/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;

    // Get the application
    const Model = type === 'family' ? FamilyApplication : NannyApplication;
    const application = await Model.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    if (!application.stripeSessionId) {
      return res.status(400).json({
        success: false,
        message: 'No payment session found for this application'
      });
    }

    // Import stripe service dynamically
    const { default: stripeService } = await import('../services/stripeService.js');

    // Get session from Stripe
    const session = await stripeService.getSession(application.stripeSessionId);

    if (session.payment_status === 'paid') {
      // Update application
      application.paymentStatus = 'paid';
      application.stripePaymentIntentId = session.payment_intent;
      await application.save();

      // Update payment record if exists, or create one if it doesn't
      let payment = await Payment.findOne({ stripeSessionId: session.id });
      if (payment) {
        payment.status = 'completed';
        payment.stripePaymentIntentId = session.payment_intent;
        payment.completedAt = new Date();
        await payment.save();
      } else {
        // Create payment record if it doesn't exist
        const { default: stripeService } = await import('../services/stripeService.js');
        const applicantName = type === 'family' ? application.parentName : application.fullName;

        payment = await Payment.create({
          stripeSessionId: session.id,
          stripePaymentIntentId: session.payment_intent,
          applicationType: type,
          applicationId: application._id,
          applicationModel: type === 'family' ? 'FamilyApplication' : 'NannyApplication',
          applicantEmail: application.email,
          applicantName: applicantName,
          amount: stripeService.getApplicationFee(type),
          status: 'completed',
          completedAt: new Date()
        });
      }

      // Send notification emails (since webhook didn't fire)
      let emailsSent = false;
      try {
        const applicantName = type === 'family' ? application.parentName : application.fullName;

        // Send payment confirmation to applicant
        await emailService.sendPaymentConfirmation({
          email: application.email,
          name: applicantName,
          type,
          amount: 25000 // $250
        });

        // Send application notification to admins and confirmation to applicant
        if (type === 'family') {
          await emailService.handleFamilyApplication(application.toObject());
        } else {
          await emailService.handleNannyApplication(application.toObject());
        }
        emailsSent = true;
      } catch (emailError) {
        console.error('Failed to send notification emails:', emailError);
      }

      res.json({
        success: true,
        message: 'Payment verified and status updated',
        paymentStatus: 'paid',
        emailsSent
      });
    } else {
      res.json({
        success: true,
        message: `Payment status: ${session.payment_status}`,
        paymentStatus: session.payment_status
      });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// SEND CUSTOM EMAIL
// ============================================

// Send custom email to an applicant
router.post('/email/send', async (req, res) => {
  try {
    const { to, subject, message, applicantName, applicationType } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: to, subject, message'
      });
    }

    const result = await emailService.sendCustomEmail({
      to,
      subject,
      message,
      applicantName,
      applicationType
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Email sent successfully',
        emailId: result.id
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send email',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Send custom email error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send email',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Notify team about an application
router.post('/email/notify-team', async (req, res) => {
  try {
    const { applicationId, applicationType, message } = req.body;

    if (!applicationId || !applicationType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: applicationId, applicationType'
      });
    }

    // Get the application details
    let application;
    if (applicationType === 'family') {
      application = await FamilyApplication.findById(applicationId);
    } else if (applicationType === 'nanny') {
      application = await NannyApplication.findById(applicationId);
    }

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const result = await emailService.notifyTeamAboutApplication({
      application,
      applicationType,
      message,
      notifiedBy: req.user.email
    });

    if (result.success) {
      res.json({
        success: true,
        message: 'Team notified successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to notify team',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Notify team error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to notify team',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// PLACEMENT FEES & INVOICING
// ============================================

// Create placement fee checkout session
router.post('/placement-fee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { feeType } = req.body; // 'standard', 'local', or 'livein'

    if (!feeType || !['standard', 'local', 'livein'].includes(feeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fee type. Must be "standard", "local", or "livein"'
      });
    }

    const application = await FamilyApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Create Stripe checkout session
    const session = await stripeService.createPlacementFeeSession({
      applicationId: application._id,
      email: application.email,
      name: application.parentName,
      feeType
    });

    // Create payment record
    const paymentType = feeType === 'standard' ? 'placement_standard' : feeType === 'local' ? 'placement_local' : 'placement_livein';
    const amount = stripeService.getPlacementFee(feeType);

    await Payment.create({
      stripeSessionId: session.id,
      paymentType,
      applicationType: 'family',
      applicationId: application._id,
      applicationModel: 'FamilyApplication',
      applicantEmail: application.email,
      applicantName: application.parentName,
      amount,
      status: 'pending'
    });

    // Update application with placement fee info
    if (!application.placementFees) {
      application.placementFees = [];
    }
    application.placementFees.push({
      type: paymentType,
      stripeSessionId: session.id,
      amount,
      status: 'pending',
      createdAt: new Date(),
      createdBy: req.user.id
    });
    await application.save();

    res.json({
      success: true,
      message: 'Placement fee checkout session created',
      checkoutUrl: session.url,
      sessionId: session.id,
      feeType: paymentType,
      amount
    });
  } catch (error) {
    console.error('Create placement fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create placement fee session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Send invoice email with PDF attachment
router.post('/send-invoice/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { feeType, message } = req.body; // feeType: 'local' or 'livein', message: optional custom message

    if (!feeType || !['standard', 'local', 'livein'].includes(feeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fee type. Must be "standard", "local", or "livein"'
      });
    }

    const application = await FamilyApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Find or create payment record and checkout session
    const paymentType = feeType === 'standard' ? 'placement_standard' : feeType === 'local' ? 'placement_local' : 'placement_livein';
    let payment = await Payment.findOne({
      applicationId: id,
      paymentType,
      status: 'pending'
    });

    let checkoutUrl;

    if (!payment) {
      // Create new checkout session
      const session = await stripeService.createPlacementFeeSession({
        applicationId: application._id,
        email: application.email,
        name: application.parentName,
        feeType
      });

      const amount = stripeService.getPlacementFee(feeType);

      payment = await Payment.create({
        stripeSessionId: session.id,
        paymentType,
        applicationType: 'family',
        applicationId: application._id,
        applicationModel: 'FamilyApplication',
        applicantEmail: application.email,
        applicantName: application.parentName,
        amount,
        status: 'pending'
      });

      // Update application
      if (!application.placementFees) {
        application.placementFees = [];
      }
      application.placementFees.push({
        type: paymentType,
        stripeSessionId: session.id,
        amount,
        status: 'pending',
        createdAt: new Date(),
        createdBy: req.user.id
      });
      await application.save();

      checkoutUrl = session.url;
    } else {
      // Get existing session URL
      const session = await stripeService.getSession(payment.stripeSessionId);
      checkoutUrl = session.url;
    }

    // Generate invoice number and PDF
    const invoiceNumber = pdfService.generateInvoiceNumber(application._id.toString());
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14); // 14 days from now

    const pdfBuffer = await pdfService.generateInvoicePDF({
      invoiceNumber,
      applicantName: application.parentName,
      applicantEmail: application.email,
      feeType: paymentType,
      paymentStatus: 'pending',
      paymentUrl: checkoutUrl,
      issueDate: new Date(),
      dueDate
    });

    // Send email with invoice
    const emailResult = await emailService.sendInvoiceEmail({
      applicantEmail: application.email,
      applicantName: application.parentName,
      invoiceNumber,
      feeType: paymentType,
      amount: payment.amount,
      paymentUrl: checkoutUrl,
      pdfBuffer,
      customMessage: message
    });

    if (emailResult.success) {
      res.json({
        success: true,
        message: 'Invoice email sent successfully',
        invoiceNumber,
        checkoutUrl,
        emailId: emailResult.id
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to send invoice email',
        error: emailResult.error
      });
    }
  } catch (error) {
    console.error('Send invoice error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invoice',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Download/preview invoice PDF
router.get('/invoice/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;
    const { feeType } = req.query; // 'local' or 'livein'

    if (!feeType || !['standard', 'local', 'livein'].includes(feeType)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid fee type. Must be "standard", "local", or "livein"'
      });
    }

    const application = await FamilyApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    const paymentType = feeType === 'standard' ? 'placement_standard' : feeType === 'local' ? 'placement_local' : 'placement_livein';

    // Check for existing payment
    const payment = await Payment.findOne({
      applicationId: id,
      paymentType
    });

    let paymentUrl = null;
    let paymentStatus = 'pending';

    if (payment) {
      paymentStatus = payment.status === 'completed' ? 'completed' : 'pending';
      if (paymentStatus === 'pending') {
        try {
          const session = await stripeService.getSession(payment.stripeSessionId);
          paymentUrl = session.url;
        } catch (e) {
          // Session may have expired, that's ok
        }
      }
    }

    // Generate invoice
    const invoiceNumber = pdfService.generateInvoiceNumber(application._id.toString());
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const pdfBuffer = await pdfService.generateInvoicePDF({
      invoiceNumber,
      applicantName: application.parentName,
      applicantEmail: application.email,
      feeType: paymentType,
      paymentStatus,
      paymentUrl,
      issueDate: payment?.createdAt || new Date(),
      dueDate
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="ClubNanny_Invoice_${invoiceNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Generate PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate invoice PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Verify placement fee payment status from Stripe
router.post('/verify-placement-fee/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    if (!payment.stripeSessionId) {
      return res.status(400).json({
        success: false,
        message: 'No Stripe session found for this payment'
      });
    }

    // Get session from Stripe
    const session = await stripeService.getSession(payment.stripeSessionId);

    if (session.payment_status === 'paid') {
      // Update payment record
      payment.status = 'completed';
      payment.stripePaymentIntentId = session.payment_intent;
      payment.completedAt = new Date();
      await payment.save();

      // Update application placement fee status
      const application = await FamilyApplication.findById(payment.applicationId);
      if (application && application.placementFees) {
        const feeIndex = application.placementFees.findIndex(
          f => f.stripeSessionId === session.id
        );
        if (feeIndex !== -1) {
          application.placementFees[feeIndex].status = 'completed';
          application.placementFees[feeIndex].completedAt = new Date();
          await application.save();
        }
      }

      res.json({
        success: true,
        message: 'Payment verified and status updated',
        paymentStatus: 'completed'
      });
    } else {
      res.json({
        success: true,
        message: `Payment status: ${session.payment_status}`,
        paymentStatus: session.payment_status
      });
    }
  } catch (error) {
    console.error('Verify placement fee error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Mark placement fee as complete (manual override)
router.post('/mark-payment-complete/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { notes } = req.body;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Update payment record
    payment.status = 'completed';
    payment.completedAt = new Date();
    payment.manuallyVerified = true;
    payment.verifiedBy = req.user.id;
    payment.verificationNotes = notes || 'Manually marked as complete by admin';
    await payment.save();

    // Update application if it's a placement fee
    if (payment.paymentType?.startsWith('placement')) {
      const application = await FamilyApplication.findById(payment.applicationId);
      if (application && application.placementFees) {
        const feeIndex = application.placementFees.findIndex(
          f => f.stripeSessionId === payment.stripeSessionId
        );
        if (feeIndex !== -1) {
          application.placementFees[feeIndex].status = 'completed';
          application.placementFees[feeIndex].completedAt = new Date();
          await application.save();
        }
      }
    } else {
      // Application fee
      const Model = payment.applicationType === 'family' ? FamilyApplication : NannyApplication;
      const application = await Model.findById(payment.applicationId);
      if (application) {
        application.paymentStatus = 'paid';
        await application.save();
      }
    }

    res.json({
      success: true,
      message: 'Payment marked as complete',
      payment
    });
  } catch (error) {
    console.error('Mark payment complete error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark payment as complete',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete payment record
router.delete('/payments/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findByIdAndDelete(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      message: 'Payment deleted successfully'
    });
  } catch (error) {
    console.error('Delete payment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payment',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Bulk delete payments
router.post('/payments/bulk-delete', async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No payment IDs provided'
      });
    }

    const result = await Payment.deleteMany({ _id: { $in: ids } });

    res.json({
      success: true,
      message: `${result.deletedCount} payment(s) deleted successfully`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Bulk delete payments error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete payments',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get placement fee status for an application
router.get('/placement-fees/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const application = await FamilyApplication.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Get all placement fee payments for this application
    const payments = await Payment.find({
      applicationId: id,
      paymentType: { $in: ['placement_local', 'placement_livein'] }
    }).sort({ createdAt: -1 });

    res.json({
      success: true,
      placementFees: payments.map(p => ({
        id: p._id,
        type: p.paymentType,
        amount: p.amount,
        formattedAmount: `$${(p.amount / 100).toFixed(2)}`,
        status: p.status,
        createdAt: p.createdAt,
        completedAt: p.completedAt,
        stripeSessionId: p.stripeSessionId
      }))
    });
  } catch (error) {
    console.error('Get placement fees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch placement fees',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

export default router;
