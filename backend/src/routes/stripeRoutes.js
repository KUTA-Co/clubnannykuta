import express from 'express';
import connectDB from '../config/database.js';
import stripeService from '../services/stripeService.js';
import emailService from '../services/emailService.js';
import notificationService from '../services/notificationService.js';
import { FamilyApplication, NannyApplication, Payment, BookingRequest } from '../models/index.js';

const router = express.Router();

// ============================================
// CREATE APPLICATION CHECKOUT (Pay First Flow)
// ============================================
// This endpoint creates a Stripe checkout session WITHOUT saving the application to the database.
// The application will only be saved after successful payment via the /api/forms/complete-application endpoint.
router.post('/create-application-checkout', async (req, res) => {
  try {
    const { type, email, name } = req.body;

    if (!type || !email || !name) {
      return res.status(400).json({
        success: false,
        message: 'Type, email, and name are required'
      });
    }

    if (type !== 'family' && type !== 'nanny') {
      return res.status(400).json({
        success: false,
        message: 'Invalid application type. Must be "family" or "nanny"'
      });
    }

    // Create Stripe checkout session WITHOUT saving application to DB
    // No applicationId is passed - application will be created after payment
    const session = await stripeService.createCheckoutSession({
      type,
      email,
      name
      // No applicationId - this is the key difference
    });

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Create application checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// CREATE CHECKOUT SESSION (Legacy - for existing unpaid applications)
// ============================================
router.post('/create-checkout-session', async (req, res) => {
  try {
    const { applicationId, type } = req.body;

    if (!applicationId || !type) {
      return res.status(400).json({
        success: false,
        message: 'Application ID and type are required'
      });
    }

    // Get the application from database
    const Model = type === 'family' ? FamilyApplication : NannyApplication;
    const application = await Model.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // Check if already paid
    if (application.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Application fee has already been paid'
      });
    }

    const name = type === 'family' ? application.parentName : application.fullName;

    // Create Stripe checkout session
    const session = await stripeService.createCheckoutSession({
      type,
      applicationId: application._id,
      email: application.email,
      name
    });

    // Update application with session ID and pending payment status
    application.stripeSessionId = session.id;
    application.paymentStatus = 'pending';
    await application.save();

    // Create payment record
    await Payment.create({
      stripeSessionId: session.id,
      applicationType: type,
      applicationId: application._id,
      applicationModel: type === 'family' ? 'FamilyApplication' : 'NannyApplication',
      applicantEmail: application.email,
      applicantName: name,
      amount: stripeService.getApplicationFee(type),
      status: 'pending'
    });

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });
  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// WEBHOOK - Handle Stripe events
// ============================================
// Note: Raw body middleware is applied in server.js
router.post('/webhook', async (req, res) => {
  const signature = req.headers['stripe-signature'];

  let event;

  try {
    event = stripeService.verifyWebhook(req.body, signature);
  } catch (error) {
    console.error('Webhook signature verification failed:', error.message);
    return res.status(400).json({ message: 'Webhook signature verification failed' });
  }

  // Handle the event
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;

      if (!stripeService.isManagedSession(session)) {
        console.log(`Ignoring checkout.session.completed for another Stripe integration: ${session.id}`);
        break;
      }

      try {
        const connection = await connectDB();
        if (!connection) {
          throw new Error('Database unavailable for Stripe webhook processing');
        }
        await handlePaymentSuccess(session);
        console.log('Payment processed successfully for session:', session.id);
      } catch (error) {
        console.error('Error processing payment:', error);
        return res.status(500).json({ message: 'Webhook processing failed' });
      }
      break;
    }

    case 'checkout.session.expired': {
      const session = event.data.object;
      if (!stripeService.isManagedSession(session)) {
        console.log(`Ignoring checkout.session.expired for another Stripe integration: ${session.id}`);
        break;
      }
      try {
        const connection = await connectDB();
        if (!connection) {
          throw new Error('Database unavailable for Stripe webhook processing');
        }
        await handlePaymentExpired(session);
      } catch (error) {
        console.error('Error processing expired payment:', error);
        return res.status(500).json({ message: 'Webhook processing failed' });
      }
      break;
    }

    default:
      console.log(`Unhandled event type: ${event.type}`);
  }

  res.json({ received: true });
});

// ============================================
// VERIFY SESSION (for frontend confirmation)
// ============================================
router.get('/verify-session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    const session = await stripeService.getSession(sessionId);

    if (session.payment_status === 'paid') {
      res.json({
        success: true,
        paid: true,
        applicationType: session.metadata.applicationType,
        applicationId: session.metadata.applicationId
      });
    } else {
      res.json({
        success: true,
        paid: false,
        status: session.payment_status,
        applicationType: session.metadata.applicationType,
        applicationId: session.metadata.applicationId
      });
    }
  } catch (error) {
    console.error('Verify session error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to verify session'
    });
  }
});

// ============================================
// RETRY CHECKOUT (create new session for unpaid application)
// ============================================
router.post('/retry-checkout', async (req, res) => {
  try {
    const { sessionId, type } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Session ID is required'
      });
    }

    // Get original session to find application
    let originalSession;
    try {
      originalSession = await stripeService.getSession(sessionId);
    } catch (stripeError) {
      // Session may have expired or be invalid
      console.error('Error retrieving original session:', stripeError.message);
      return res.status(400).json({
        success: false,
        message: 'Original payment session not found or expired'
      });
    }

    const { applicationId, applicationType } = originalSession.metadata;
    const resolvedType = type || applicationType;

    // Check if already paid via Stripe
    if (originalSession.payment_status === 'paid') {
      return res.json({ success: true, paid: true });
    }

    // Get the application
    const Model = resolvedType === 'family' ? FamilyApplication : NannyApplication;
    const application = await Model.findById(applicationId);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found'
      });
    }

    // If already paid in our DB, return success
    if (application.paymentStatus === 'paid') {
      return res.json({ success: true, paid: true });
    }

    const name = resolvedType === 'family' ? application.parentName : application.fullName;

    // Create new checkout session
    const newSession = await stripeService.createCheckoutSession({
      type: resolvedType,
      applicationId: application._id,
      email: application.email,
      name
    });

    // Update application with new session ID
    application.stripeSessionId = newSession.id;
    application.paymentStatus = 'pending';
    await application.save();

    // Create new payment record for the retry
    await Payment.create({
      stripeSessionId: newSession.id,
      applicationType: resolvedType,
      applicationId: application._id,
      applicationModel: resolvedType === 'family' ? 'FamilyApplication' : 'NannyApplication',
      applicantEmail: application.email,
      applicantName: name,
      amount: stripeService.getApplicationFee(resolvedType),
      status: 'pending'
    });

    res.json({
      success: true,
      url: newSession.url
    });
  } catch (error) {
    console.error('Retry checkout error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
});

// ============================================
// HELPER FUNCTIONS
// ============================================

async function handlePaymentSuccess(session) {
  const { applicationType, applicationId, applicantName, applicantEmail, paymentType, registrationType } = session.metadata;

  // Sitter/family PWA registrations are finalized by /api/sitting/auth/complete/*
  // after the Checkout success redirect. Do not treat them as nanny-program applications.
  if (registrationType) {
    console.log(`Sitting registration payment completed for ${registrationType}. Session: ${session.id}`);
    return;
  }

  // Club Nanny booking payment (family paid the sitter for a confirmed booking).
  // Handled entirely here; unrelated to the nanny-program application/placement flow.
  if (paymentType === 'booking_payment') {
    await handleBookingPaymentSuccess(session);
    return;
  }

  // Determine if this is a placement fee or application fee
  const isPlacementFee = paymentType && paymentType.startsWith('placement');

  // For the new "pay first" flow, there's no applicationId in metadata.
  // The application is created by the success page calling /api/forms/complete-application.
  if (!applicationId && !isPlacementFee) {
    console.log(`Pay-first flow: Payment completed for ${applicationType} application. Session: ${session.id}`);
    console.log(`Application will be created via success page. Applicant: ${applicantName} (${applicantEmail})`);
    return;
  }

  // Legacy flow: applicationId exists, update the existing application
  const Model = applicationType === 'family' ? FamilyApplication : NannyApplication;
  const application = applicationId ? await Model.findById(applicationId) : null;

  if (application) {
    if (isPlacementFee) {
      // Update placement fee status in application
      if (application.placementFees && application.placementFees.length > 0) {
        const feeIndex = application.placementFees.findIndex(
          f => f.stripeSessionId === session.id
        );
        if (feeIndex !== -1) {
          application.placementFees[feeIndex].status = 'completed';
          application.placementFees[feeIndex].completedAt = new Date();
        }
      }
    } else {
      // Regular application fee
      application.paymentStatus = 'paid';
      if (application.status === 'pending_payment') {
        application.status = 'pending';
      }
    }
    application.stripePaymentIntentId = session.payment_intent;
    await application.save();
  }

  // Update payment record (or create if missing - fallback for old applications)
  let payment = await Payment.findOne({ stripeSessionId: session.id });
  if (payment) {
    payment.status = 'completed';
    payment.stripePaymentIntentId = session.payment_intent;
    payment.stripeCustomerId = session.customer;
    payment.stripeEventId = session.id;
    payment.completedAt = new Date();
    await payment.save();
  } else if (!isPlacementFee && applicationId) {
    // Create payment record if it doesn't exist (fallback for applications created before fix)
    payment = await Payment.create({
      stripeSessionId: session.id,
      stripePaymentIntentId: session.payment_intent,
      stripeCustomerId: session.customer,
      applicationType,
      applicationId,
      applicationModel: applicationType === 'family' ? 'FamilyApplication' : 'NannyApplication',
      applicantEmail,
      applicantName,
      amount: stripeService.getApplicationFee(applicationType),
      status: 'completed',
      completedAt: new Date()
    });
  }

  // Send confirmation email (only for legacy flow with existing application)
  try {
    if (isPlacementFee) {
      // Send placement fee confirmation
      await emailService.sendPlacementFeeConfirmation({
        email: applicantEmail,
        name: applicantName,
        feeType: paymentType,
        amount: payment?.amount || (paymentType === 'placement_local' ? 50000 : 100000)
      });
    } else if (application) {
      // Send application fee confirmation
      await emailService.sendPaymentConfirmation({
        email: applicantEmail,
        name: applicantName,
        type: applicationType,
        amount: stripeService.getApplicationFee(applicationType)
      });

      // Also trigger the application notification emails now that payment is complete
      if (applicationType === 'family') {
        await emailService.handleFamilyApplication(application.toObject());
      } else if (applicationType === 'nanny') {
        await emailService.handleNannyApplication(application.toObject());
      }
    }
  } catch (emailError) {
    console.error('Failed to send payment confirmation email:', emailError);
  }
}

async function handleBookingPaymentSuccess(session) {
  const { bookingId } = session.metadata;

  const booking = await BookingRequest.findById(bookingId).populate('confirmedSitterId');
  if (!booking) {
    console.warn(`Booking payment webhook: booking ${bookingId} not found (session ${session.id})`);
    return;
  }

  // Idempotency — Stripe can deliver the same event more than once
  if (booking.payment?.status === 'paid') {
    return;
  }

  booking.payment = {
    ...(booking.payment ? booking.payment.toObject?.() ?? booking.payment : {}),
    status: 'paid',
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent,
    paidAt: new Date()
  };
  await booking.save();

  console.log(`Booking ${bookingId} marked paid (session ${session.id})`);

  // Notify the sitter that payment landed before the webhook finishes.
  if (booking.confirmedSitterId) {
    await notificationService.notifyBookingPaid(booking, booking.confirmedSitterId);
  }
}

async function handlePaymentExpired(session) {
  const { applicationType, applicationId, paymentType } = session.metadata;

  // Booking payments simply stay 'unpaid' on the booking if checkout is abandoned — nothing to undo.
  if (paymentType === 'booking_payment') {
    console.log(`Booking payment checkout expired for booking ${session.metadata.bookingId} (session ${session.id})`);
    return;
  }

  // For pay-first flow (no applicationId), there's no application to update
  // Just update/delete any payment record
  if (!applicationId) {
    console.log(`Pay-first flow: Payment expired for ${applicationType}. Session: ${session.id}`);
    const payment = await Payment.findOne({ stripeSessionId: session.id });
    if (payment) {
      payment.status = 'expired';
      await payment.save();
    }
    return;
  }

  // Legacy flow: Update application payment status back to unpaid
  const Model = applicationType === 'family' ? FamilyApplication : NannyApplication;
  const application = await Model.findById(applicationId);

  if (application && application.paymentStatus === 'pending') {
    application.paymentStatus = 'unpaid';
    application.stripeSessionId = null;
    await application.save();
  }

  // Update payment record
  const payment = await Payment.findOne({ stripeSessionId: session.id });
  if (payment) {
    payment.status = 'failed';
    await payment.save();
  }
}

export default router;
