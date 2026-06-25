import express from 'express';
import jwt from 'jsonwebtoken';
import { User, SitterProfile, SittingFamilyProfile } from '../models/index.js';
import stripeService from '../services/stripeService.js';

const router = express.Router();

// ============================================
// SITTER REGISTRATION
// ============================================

/**
 * POST /api/sitting/auth/register/sitter
 * Step 1: Create checkout session for sitter registration
 * User pays first, then completes registration
 */
router.post('/register/sitter', async (req, res) => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      city,
      state,
      postalCode
    } = req.body;

    // Validate required fields
    if (!email || !firstName || !lastName || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Email, first name, last name, city, and state are required'
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      // Check if they already have a sitter profile
      const existingProfile = await SitterProfile.findOne({ userId: existingUser._id });
      if (existingProfile) {
        return res.status(400).json({
          success: false,
          message: 'A sitter account with this email already exists'
        });
      }
    }

    const name = `${firstName} ${lastName}`;

    // Create Stripe checkout session
    const session = await stripeService.createSittingCheckoutSession({
      type: 'sitter',
      email,
      name
    });

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Sitter registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
});

/**
 * POST /api/sitting/auth/complete/sitter
 * Step 2: Complete sitter registration after payment
 */
router.post('/complete/sitter', async (req, res) => {
  try {
    const {
      sessionId,
      email,
      password,
      firstName,
      lastName,
      phone,
      bio,
      age,
      dateOfBirth,
      howDidYouHear,
      yearsOfExperience,
      ageGroupsWorkedWith,
      typesOfExperience,
      experience,
      faithJourney,
      whyCalledToServe,
      specialSkills,
      hourlyRate,
      hourlyRate1Kid,
      hourlyRate2Kids,
      hourlyRate3PlusKids,
      city,
      state,
      postalCode,
      preferredRadius
    } = req.body;

    // Verify payment
    const session = await stripeService.getSession(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Verify email matches (only if Stripe captured an email on the session)
    if (session.customer_email && session.customer_email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email does not match payment session'
      });
    }

    const applicationFeeAmountCents = Number(
      session.metadata?.sitterApplicationFeeCents || stripeService.getSittingFee('sitter_application')
    );
    const membershipFeeAmountCents = Number(session.metadata?.sitterMembershipFeeCents || 0);
    const membershipFeeChargedAt = membershipFeeAmountCents > 0 ? new Date() : undefined;

    // Derive age from date of birth when provided
    let computedAge = age || 18;
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      computedAge = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        computedAge--;
      }
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Create new user
      user = await User.create({
        email: email.toLowerCase(),
        password,
        role: 'sitter',
        serviceType: 'sitting',
        firstName,
        lastName,
        phone
      });
    } else {
      // Update existing user to add sitter role
      if (user.role === 'family') {
        user.serviceType = 'both';
      }
      await user.save();
    }

    // Idempotency: if this user already has a sitter profile (e.g. completion
    // re-submitted after a page refresh), return it instead of creating a duplicate.
    const existingProfile = await SitterProfile.findOne({ userId: user._id });
    if (existingProfile) {
      const existingToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({
        success: true,
        message: 'Sitter registration already complete.',
        token: existingToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        },
        profile: existingProfile
      });
    }

    // Create sitter profile (carries all registration-form fields)
    const profile = await SitterProfile.create({
      userId: user._id,
      firstName,
      lastName,
      email: email.toLowerCase(),
      phone,
      city,
      state,
      postalCode: postalCode || '',
      dateOfBirth: dateOfBirth || null,
      age: computedAge,
      howDidYouHear: howDidYouHear || '',
      yearsOfExperience: yearsOfExperience || '',
      ageGroupsWorkedWith: ageGroupsWorkedWith || '',
      typesOfExperience: typesOfExperience || '',
      experience: experience || '',
      faithJourney: faithJourney || '',
      whyCalledToServe: whyCalledToServe || '',
      specialSkills: specialSkills || '',
      bio: bio || experience || '',
      hourlyRate: hourlyRate || hourlyRate1Kid || 20,
      hourlyRate1Kid: hourlyRate1Kid || hourlyRate || 20,
      hourlyRate2Kids: hourlyRate2Kids || 25,
      hourlyRate3PlusKids: hourlyRate3PlusKids || 30,
      preferredRadius: preferredRadius || 15,
      status: 'pending_approval', // Requires admin approval
      membershipStatus: 'inactive',
      stripeSessionId: sessionId,
      stripePaymentIntentId: session.payment_intent,
      stripeCustomerId: session.customer,
      applicationFeePaid: true,
      applicationFeePaidAt: new Date(),
      applicationFeeAmountCents,
      membershipFeeAmountCents,
      membershipFeeChargedAt
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Sitter registration complete. Your account is pending approval.',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      profile
    });
  } catch (error) {
    console.error('Complete sitter registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// FAMILY REGISTRATION
// ============================================

/**
 * POST /api/sitting/auth/register/family
 * Step 1: Create checkout session for family registration
 */
router.post('/register/family', async (req, res) => {
  try {
    const {
      email,
      householdName,
      city,
      state
    } = req.body;

    // Validate required fields
    if (!email || !householdName || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Email, household name, city, and state are required'
      });
    }

    // Check if email already exists with sitting family profile
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const existingProfile = await SittingFamilyProfile.findOne({ userId: existingUser._id });
      if (existingProfile) {
        return res.status(400).json({
          success: false,
          message: 'A Club Nanny family account with this email already exists'
        });
      }
    }

    // Create Stripe checkout session
    const session = await stripeService.createSittingCheckoutSession({
      type: 'sitting_family',
      email,
      name: householdName
    });

    res.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id
    });
  } catch (error) {
    console.error('Family registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create checkout session'
    });
  }
});

/**
 * POST /api/sitting/auth/complete/family
 * Step 2: Complete family registration after payment
 */
router.post('/complete/family', async (req, res) => {
  try {
    const {
      sessionId,
      email,
      password,
      householdName,
      phone,
      children,
      numberOfChildren,
      childrenAges,
      specialNeeds,
      howDidYouHear,
      faithBackground,
      familyValues,
      address,
      city,
      state,
      postalCode,
      emergencyContact
    } = req.body;

    // Verify payment
    const session = await stripeService.getSession(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    // Verify email matches (only if Stripe captured an email on the session)
    if (session.customer_email && session.customer_email.toLowerCase() !== email.toLowerCase()) {
      return res.status(400).json({
        success: false,
        message: 'Email does not match payment session'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ email: email.toLowerCase() });
    let isNewUser = false;

    if (!user) {
      // Create new user
      user = await User.create({
        email: email.toLowerCase(),
        password,
        role: 'family',
        serviceType: 'sitting'
      });
      isNewUser = true;
    } else {
      // Update existing user
      if (user.serviceType === 'nanny') {
        user.serviceType = 'both';
        await user.save();
      }
    }

    // Idempotency: if this user already has a sitting family profile, return it
    const existingFamilyProfile = await SittingFamilyProfile.findOne({ userId: user._id });
    if (existingFamilyProfile) {
      const existingToken = jwt.sign(
        { id: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
      return res.status(200).json({
        success: true,
        message: 'Family registration already complete!',
        token: existingToken,
        user: { id: user._id, email: user.email, role: user.role },
        profile: existingFamilyProfile
      });
    }

    // Create sitting family profile (carries all registration-form fields)
    const profile = await SittingFamilyProfile.create({
      userId: user._id,
      householdName,
      email: email.toLowerCase(),
      phone: phone || '',
      children: children || [],
      numberOfChildren: numberOfChildren || (children ? children.length : 1),
      childrenAges: childrenAges || '',
      specialNeeds: specialNeeds || '',
      howDidYouHear: howDidYouHear || '',
      faithBackground: faithBackground || '',
      familyValues: familyValues || '',
      address: address || '',
      city,
      state,
      postalCode: postalCode || '',
      emergencyContact: emergencyContact || {},
      status: 'active', // Families auto-activate
      membershipStatus: 'active',
      membershipExpiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      stripeSessionId: sessionId,
      stripeCustomerId: session.customer
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Family registration complete!',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (error) {
    console.error('Complete family registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// CHECK REGISTRATION STATUS
// ============================================

// ============================================
// TEST REGISTRATION (bypass Stripe for testing)
// ============================================

/**
 * POST /api/sitting/auth/register-test/sitter
 * Test mode: Create sitter without Stripe payment
 */
router.post('/register-test/sitter', async (req, res) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      city,
      state,
      postalCode,
      dateOfBirth,
      howDidYouHear,
      yearsOfExperience,
      ageGroupsWorkedWith,
      typesOfExperience,
      experience,
      faithJourney,
      whyCalledToServe,
      specialSkills,
      hourlyRate,
      hourlyRate1Kid,
      hourlyRate2Kids,
      hourlyRate3PlusKids,
      bio
    } = req.body;

    // Validate required fields
    if (!email || !password || !firstName || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, name, city, and state are required'
      });
    }

    // Check if email already exists with sitter profile
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const existingProfile = await SitterProfile.findOne({ userId: existingUser._id });
      if (existingProfile) {
        return res.status(400).json({
          success: false,
          message: 'A sitter account with this email already exists'
        });
      }
    }

    // Calculate age from date of birth
    let age = 18;
    if (dateOfBirth) {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
    }

    // Create or get user
    let user = existingUser;
    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        password,
        role: 'sitter',
        serviceType: 'sitting',
        firstName,
        lastName: lastName || firstName,
        phone
      });
    } else {
      // Update existing user to add sitter role
      if (user.role === 'family') {
        user.serviceType = 'both';
      }
      await user.save();
    }

    // Create sitter profile - auto-activate for testing
    const profile = await SitterProfile.create({
      userId: user._id,
      firstName,
      lastName: lastName || firstName,
      email: email.toLowerCase(),
      phone,
      city,
      state,
      postalCode: postalCode || '',
      dateOfBirth: dateOfBirth || null,
      age,
      howDidYouHear: howDidYouHear || '',
      yearsOfExperience: yearsOfExperience || '',
      ageGroupsWorkedWith: ageGroupsWorkedWith || '',
      typesOfExperience: typesOfExperience || '',
      experience: experience || '',
      faithJourney: faithJourney || '',
      whyCalledToServe: whyCalledToServe || '',
      specialSkills: specialSkills || '',
      bio: bio || experience || '',
      hourlyRate: hourlyRate || hourlyRate1Kid || 20,
      hourlyRate1Kid: hourlyRate1Kid || hourlyRate || 20,
      hourlyRate2Kids: hourlyRate2Kids || 25,
      hourlyRate3PlusKids: hourlyRate3PlusKids || 30,
      preferredRadius: 15,
      status: 'active', // Auto-activate for testing (production would be 'pending_approval')
      membershipStatus: 'active',
      membershipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year for testing
      applicationFeePaid: true,
      applicationFeePaidAt: new Date()
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Sitter registration complete (test mode).',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      },
      profile
    });
  } catch (error) {
    console.error('Test sitter registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * POST /api/sitting/auth/register-test/family
 * Test mode: Create family without Stripe payment
 */
router.post('/register-test/family', async (req, res) => {
  try {
    const {
      email,
      password,
      householdName,
      phone,
      children,
      address,
      city,
      state,
      postalCode,
      numberOfChildren,
      childrenAges,
      specialNeeds,
      howDidYouHear,
      faithBackground,
      familyValues,
      emergencyContact
    } = req.body;

    // Validate required fields
    if (!email || !password || !householdName || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, parent name, city, and state are required'
      });
    }

    // Check if email already exists with sitting family profile
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const existingProfile = await SittingFamilyProfile.findOne({ userId: existingUser._id });
      if (existingProfile) {
        return res.status(400).json({
          success: false,
          message: 'A Club Nanny family account with this email already exists'
        });
      }
    }

    // Create or get user
    let user = existingUser;
    if (!user) {
      user = await User.create({
        email: email.toLowerCase(),
        password,
        role: 'family',
        serviceType: 'sitting'
      });
    } else {
      // Update existing user
      if (user.serviceType === 'nanny') {
        user.serviceType = 'both';
        await user.save();
      }
    }

    // Create sitting family profile
    const profile = await SittingFamilyProfile.create({
      userId: user._id,
      householdName,
      email: email.toLowerCase(),
      phone: phone || '',
      children: children || [],
      address: address || '',
      city,
      state,
      postalCode: postalCode || '',
      numberOfChildren: numberOfChildren || (children ? children.length : 1),
      childrenAges: childrenAges || '',
      specialNeeds: specialNeeds || '',
      howDidYouHear: howDidYouHear || '',
      faithBackground: faithBackground || '',
      familyValues: familyValues || '',
      emergencyContact: emergencyContact || {},
      status: 'active',
      membershipStatus: 'active',
      membershipExpiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year for testing
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Family registration complete (test mode)!',
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role
      },
      profile
    });
  } catch (error) {
    console.error('Test family registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to complete registration',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ============================================
// CHECK REGISTRATION STATUS
// ============================================

/**
 * GET /api/sitting/auth/check-profile
 * Check if user has sitting profiles
 */
router.get('/check-profile', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.json({
        success: true,
        authenticated: false
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.json({
        success: true,
        authenticated: false
      });
    }

    const sitterProfile = await SitterProfile.findOne({ userId: user._id });
    const familyProfile = await SittingFamilyProfile.findOne({ userId: user._id });

    res.json({
      success: true,
      authenticated: true,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        serviceType: user.serviceType
      },
      hasSitterProfile: !!sitterProfile,
      hasFamilyProfile: !!familyProfile,
      sitterStatus: sitterProfile?.status,
      familyStatus: familyProfile?.status
    });
  } catch (error) {
    console.error('Check profile error:', error);
    res.json({
      success: true,
      authenticated: false
    });
  }
});

export default router;
