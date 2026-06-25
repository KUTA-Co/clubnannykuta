import express from 'express';
import emailService from '../services/emailService.js';
import stripeService from '../services/stripeService.js';
import { FamilyApplication, NannyApplication, ContactSubmission, Payment } from '../models/index.js';
import { isValidEmail, isValidPhone } from '../middleware/sanitize.js';

const router = express.Router();

// ============================================
// CONTACT FORM
// ============================================

router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, email, subject, message'
      });
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate phone format (if provided)
    if (phone && !isValidPhone(phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Save to database
    const contactSubmission = await ContactSubmission.create({
      name,
      email,
      phone,
      subject,
      message
    });

    // Send emails (don't fail if email service has issues)
    try {
      await emailService.handleContactForm({
        name,
        email,
        phone,
        subject,
        message
      });
    } catch (emailError) {
      console.error('Email service error (non-fatal):', emailError.message);
    }

    res.json({
      success: true,
      message: 'Contact form submitted successfully',
      id: contactSubmission._id
    });
  } catch (error) {
    console.error('Contact form error:', error);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// FAMILY APPLICATION
// ============================================

router.post('/family-application', async (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    const parentName = data.parentName || data.parent_name;

    if (!parentName || !data.email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate phone format (if provided)
    if (data.phone && !isValidPhone(data.phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Save application to database
    const application = await FamilyApplication.create({
      parentName: data.parentName || data.parent_name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      howDidYouHear: data.howDidYouHear || data.how_did_you_hear,
      numberOfChildren: data.numberOfChildren || data.number_of_children,
      childrenAges: data.childrenAges || data.children_ages,
      startDate: data.startDate || data.start_date,
      endDate: data.endDate || data.end_date,
      hoursPerWeek: data.hoursPerWeek || data.hours_per_week,
      weeklySchedule: data.weeklySchedule || data.weekly_schedule,
      specialNeeds: data.specialNeeds || data.special_needs,
      church: data.church || data.churchName,
      faithBackground: data.faithBackground || data.faith_background,
      familyValues: data.familyValues || data.family_values,
      nannyAgeRange: data.nannyAgeRange || data.nanny_age_range,
      experienceLevel: data.experienceLevel || data.experience_level,
      personalityPreferences: data.personalityPreferences || data.personality_preferences,
      additionalInfo: data.additionalInfo || data.additional_info,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    // Send immediate notification emails (don't block on this)
    emailService.handleApplicationSubmitted({
      type: 'family',
      application: application.toObject()
    }).catch(err => console.error('Failed to send application notification emails:', err));

    // Create Stripe checkout session
    try {
      const session = await stripeService.createCheckoutSession({
        type: 'family',
        applicationId: application._id,
        email: application.email,
        name: application.parentName
      });

      // Update application with session ID
      application.stripeSessionId = session.id;
      application.paymentStatus = 'pending';
      await application.save();

      // Create payment record
      await Payment.create({
        stripeSessionId: session.id,
        applicationType: 'family',
        applicationId: application._id,
        applicationModel: 'FamilyApplication',
        applicantEmail: application.email,
        applicantName: application.parentName,
        amount: stripeService.getApplicationFee('family'),
        status: 'pending'
      });

      res.json({
        success: true,
        message: 'Application saved. Redirecting to payment.',
        applicationId: application._id,
        checkoutUrl: session.url,
        sessionId: session.id
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      // If Stripe fails, still save the application but notify about payment
      res.json({
        success: true,
        message: 'Application saved. Payment processing unavailable.',
        applicationId: application._id,
        paymentRequired: true
      });
    }
  } catch (error) {
    console.error('Family application error:', error);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// NANNY APPLICATION
// ============================================

router.post('/nanny-application', async (req, res) => {
  try {
    const data = req.body;

    // Validate required fields
    const fullName = data.fullName || data.full_name;

    if (!fullName || !data.email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    // Validate email format
    if (!isValidEmail(data.email)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid email format'
      });
    }

    // Validate phone format (if provided)
    if (data.phone && !isValidPhone(data.phone)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid phone number format'
      });
    }

    // Save application to database
    const application = await NannyApplication.create({
      fullName: data.fullName || data.full_name,
      email: data.email,
      phone: data.phone,
      city: data.city,
      state: data.state,
      howDidYouHear: data.howDidYouHear || data.how_did_you_hear,
      dateOfBirth: data.dateOfBirth || data.date_of_birth,
      university: data.university,
      yearsExperience: data.yearsExperience || data.years_experience,
      ageGroups: data.ageGroups || data.age_groups,
      experienceTypes: data.experienceTypes || data.experience_types,
      experienceDetails: data.experienceDetails || data.experience_details,
      church: data.church || data.churchName,
      faithJourney: data.faithJourney || data.faith_journey,
      whyCalled: data.whyCalled || data.why_called,
      availableStartDate: data.availableStartDate || data.available_start_date,
      availableEndDate: data.availableEndDate || data.available_end_date,
      hoursAvailable: data.hoursAvailable || data.hours_available,
      locationPreferences: data.locationPreferences || data.location_preferences,
      ageGroupPreferences: data.ageGroupPreferences || data.age_group_preferences,
      additionalInfo: data.additionalInfo || data.additional_info,
      backgroundCheckConsent: true,
      status: 'pending',
      paymentStatus: 'unpaid'
    });

    // Send immediate notification emails (don't block on this)
    emailService.handleApplicationSubmitted({
      type: 'nanny',
      application: application.toObject()
    }).catch(err => console.error('Failed to send application notification emails:', err));

    // Create Stripe checkout session
    try {
      const session = await stripeService.createCheckoutSession({
        type: 'nanny',
        applicationId: application._id,
        email: application.email,
        name: application.fullName
      });

      // Update application with session ID
      application.stripeSessionId = session.id;
      application.paymentStatus = 'pending';
      await application.save();

      // Create payment record
      await Payment.create({
        stripeSessionId: session.id,
        applicationType: 'nanny',
        applicationId: application._id,
        applicationModel: 'NannyApplication',
        applicantEmail: application.email,
        applicantName: application.fullName,
        amount: stripeService.getApplicationFee('nanny'),
        status: 'pending'
      });

      res.json({
        success: true,
        message: 'Application saved. Redirecting to payment.',
        applicationId: application._id,
        checkoutUrl: session.url,
        sessionId: session.id
      });
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);
      // If Stripe fails, still save the application but notify about payment
      res.json({
        success: true,
        message: 'Application saved. Payment processing unavailable.',
        applicationId: application._id,
        paymentRequired: true
      });
    }
  } catch (error) {
    console.error('Nanny application error:', error);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// COMPLETE APPLICATION (After Payment)
// ============================================
// This endpoint saves the application to the database ONLY after payment is verified.
// Called from the success page after Stripe redirects back.
router.post('/complete-application', async (req, res) => {
  try {
    const { sessionId, type, formData } = req.body;

    // Validate required fields
    if (!sessionId || !type || !formData) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: sessionId, type, formData'
      });
    }

    if (type !== 'family' && type !== 'nanny') {
      return res.status(400).json({
        success: false,
        error: 'Invalid application type'
      });
    }

    // 1. Verify payment with Stripe
    let session;
    try {
      session = await stripeService.getSession(sessionId);
    } catch (stripeError) {
      console.error('Error retrieving Stripe session:', stripeError.message);
      return res.status(400).json({
        success: false,
        error: 'Invalid or expired payment session'
      });
    }

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Payment not completed',
        paymentStatus: session.payment_status
      });
    }

    // 2. Check if already processed (prevent duplicates)
    const existingPayment = await Payment.findOne({ stripeSessionId: sessionId });
    if (existingPayment && existingPayment.status === 'completed' && existingPayment.applicationId) {
      // Already processed - return success
      return res.json({
        success: true,
        message: 'Application already processed',
        applicationId: existingPayment.applicationId
      });
    }

    // 3. NOW save application to database
    let application;
    if (type === 'family') {
      // Validate required family fields
      const parentName = formData.parentName || formData.parent_name;
      if (!parentName || !formData.email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: parentName, email'
        });
      }

      // Validate email format
      if (!isValidEmail(formData.email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      application = await FamilyApplication.create({
        parentName: formData.parentName || formData.parent_name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        howDidYouHear: formData.howDidYouHear || formData.how_did_you_hear,
        numberOfChildren: formData.numberOfChildren || formData.number_of_children,
        childrenAges: formData.childrenAges || formData.children_ages,
        startDate: formData.startDate || formData.start_date,
        endDate: formData.endDate || formData.end_date,
        hoursPerWeek: formData.hoursPerWeek || formData.hours_per_week,
        weeklySchedule: formData.weeklySchedule || formData.weekly_schedule,
        specialNeeds: formData.specialNeeds || formData.special_needs,
        church: formData.church || formData.churchName,
        faithBackground: formData.faithBackground || formData.faith_background,
        familyValues: formData.familyValues || formData.family_values,
        nannyAgeRange: formData.nannyAgeRange || formData.nanny_age_range,
        experienceLevel: formData.experienceLevel || formData.experience_level,
        personalityPreferences: formData.personalityPreferences || formData.personality_preferences,
        additionalInfo: formData.additionalInfo || formData.additional_info,
        status: 'pending',
        paymentStatus: 'paid',  // Already paid!
        stripeSessionId: sessionId,
        stripePaymentIntentId: session.payment_intent
      });
    } else {
      // Nanny application
      const fullName = formData.fullName || formData.full_name;
      if (!fullName || !formData.email) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: fullName, email'
        });
      }

      // Validate email format
      if (!isValidEmail(formData.email)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email format'
        });
      }

      application = await NannyApplication.create({
        fullName: formData.fullName || formData.full_name,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        howDidYouHear: formData.howDidYouHear || formData.how_did_you_hear,
        dateOfBirth: formData.dateOfBirth || formData.date_of_birth,
        university: formData.university,
        yearsExperience: formData.yearsExperience || formData.years_experience,
        ageGroups: formData.ageGroups || formData.age_groups,
        experienceTypes: formData.experienceTypes || formData.experience_types,
        experienceDetails: formData.experienceDetails || formData.experience_details,
        church: formData.church || formData.churchName,
        faithJourney: formData.faithJourney || formData.faith_journey,
        whyCalled: formData.whyCalled || formData.why_called,
        availableStartDate: formData.availableStartDate || formData.available_start_date,
        availableEndDate: formData.availableEndDate || formData.available_end_date,
        hoursAvailable: formData.hoursAvailable || formData.hours_available,
        locationPreferences: formData.locationPreferences || formData.location_preferences,
        ageGroupPreferences: formData.ageGroupPreferences || formData.age_group_preferences,
        additionalInfo: formData.additionalInfo || formData.additional_info,
        backgroundCheckConsent: true,
        status: 'pending',
        paymentStatus: 'paid',  // Already paid!
        stripeSessionId: sessionId,
        stripePaymentIntentId: session.payment_intent
      });
    }

    // 4. Create/update Payment record
    const applicantName = type === 'family' ? application.parentName : application.fullName;
    if (existingPayment) {
      existingPayment.status = 'completed';
      existingPayment.applicationId = application._id;
      existingPayment.applicationModel = type === 'family' ? 'FamilyApplication' : 'NannyApplication';
      existingPayment.stripePaymentIntentId = session.payment_intent;
      existingPayment.stripeCustomerId = session.customer;
      existingPayment.completedAt = new Date();
      await existingPayment.save();
    } else {
      await Payment.create({
        stripeSessionId: sessionId,
        stripePaymentIntentId: session.payment_intent,
        stripeCustomerId: session.customer,
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

    // 5. Send notification emails (admin + user confirmation)
    try {
      // Send admin notification
      await emailService.handleApplicationSubmitted({
        type,
        application: application.toObject()
      });

      // Send payment confirmation to user
      await emailService.sendPaymentConfirmation({
        email: application.email,
        name: applicantName,
        type,
        amount: stripeService.getApplicationFee(type)
      });
    } catch (emailError) {
      console.error('Failed to send notification emails (non-fatal):', emailError.message);
      // Don't fail the request if emails fail
    }

    res.json({
      success: true,
      message: 'Application submitted successfully',
      applicationId: application._id
    });
  } catch (error) {
    console.error('Complete application error:', error);
    res.status(500).json({
      success: false,
      error: process.env.NODE_ENV === 'development' ? error.message : 'Failed to complete application'
    });
  }
});

export default router;
