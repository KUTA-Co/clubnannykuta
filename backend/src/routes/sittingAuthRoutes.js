import express from 'express';
import jwt from 'jsonwebtoken';
import { User, SitterProfile, SittingFamilyProfile, Payment } from '../models/index.js';
import stripeService from '../services/stripeService.js';
import emailService from '../services/emailService.js';

const router = express.Router();

function calculateValidSitterAge({ age, dateOfBirth }) {
  let computedAge = Number(age);

  if (dateOfBirth) {
    const dob = new Date(dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const today = new Date();
      computedAge = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        computedAge--;
      }
    }
  }

  // Age is optional on the model. If a browser submits an impossible DOB,
  // keep the paid application moving to admin review instead of failing after Stripe.
  if (!Number.isFinite(computedAge) || computedAge < 16 || computedAge > 100) {
    return undefined;
  }

  return computedAge;
}

async function upsertSittingPayment({ session, profile, type, amount, applicantName }) {
  const applicationType = type === 'sitter' ? 'sitter' : 'sitting_family';
  const applicationModel = type === 'sitter' ? 'SitterProfile' : 'SittingFamilyProfile';
  const paymentType = type === 'sitter' ? 'sitter_registration' : 'sitting_family_membership';

  await Payment.findOneAndUpdate(
    { stripeSessionId: session.id },
    {
      $set: {
        stripePaymentIntentId: session.payment_intent,
        stripeCustomerId: session.customer,
        paymentType,
        applicationType,
        applicationId: profile._id,
        applicationModel,
        applicantEmail: profile.email,
        applicantName,
        amount,
        currency: (session.currency || 'usd').toUpperCase(),
        status: 'completed',
        completedAt: new Date(),
        metadata: {
          registrationType: type,
          stripeAmountTotal: session.amount_total
        }
      }
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
}

const normalizeEmail = (email) => String(email || '').trim().toLowerCase();

const hasValue = (value) => value !== undefined && value !== null && value !== '';

function assignIfPresent(target, fields) {
  Object.entries(fields).forEach(([key, value]) => {
    if (hasValue(value)) target[key] = value;
  });
}

function sitterApplicantName(source) {
  return `${source.firstName || ''} ${source.lastName || ''}`.trim() || source.email;
}

function signSittingToken(user) {
  return jwt.sign(
    { id: user._id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function userResponse(user) {
  return {
    id: user._id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role
  };
}

async function ensureSittingUser({ email, password, role, serviceType = 'sitting', firstName, lastName, phone }) {
  const normalizedEmail = normalizeEmail(email);
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return User.create({
      email: normalizedEmail,
      password,
      role,
      serviceType,
      firstName,
      lastName,
      phone
    });
  }

  assignIfPresent(user, { firstName, lastName, phone });
  if (password) user.password = password;
  if (user.role !== 'admin') user.role = role;
  if (user.serviceType === 'nanny' && serviceType === 'sitting') {
    user.serviceType = 'both';
  } else if (serviceType) {
    user.serviceType = serviceType;
  }
  await user.save();
  return user;
}

function applySitterFields(profile, data) {
  const computedAge = calculateValidSitterAge({
    age: data.age ?? profile.age,
    dateOfBirth: data.dateOfBirth ?? profile.dateOfBirth
  });

  assignIfPresent(profile, {
    firstName: data.firstName,
    lastName: data.lastName,
    email: normalizeEmail(data.email || profile.email),
    phone: data.phone,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    dateOfBirth: data.dateOfBirth,
    howDidYouHear: data.howDidYouHear,
    yearsOfExperience: data.yearsOfExperience,
    ageGroupsWorkedWith: data.ageGroupsWorkedWith,
    typesOfExperience: data.typesOfExperience,
    experience: data.experience,
    faithJourney: data.faithJourney,
    whyCalledToServe: data.whyCalledToServe,
    specialSkills: data.specialSkills,
    bio: data.bio,
    hourlyRate: data.hourlyRate || data.hourlyRate1Kid,
    hourlyRate1Kid: data.hourlyRate1Kid || data.hourlyRate,
    hourlyRate2Kids: data.hourlyRate2Kids,
    hourlyRate3PlusKids: data.hourlyRate3PlusKids,
    preferredRadius: data.preferredRadius
  });

  if (computedAge !== undefined) profile.age = computedAge;
}

function applySittingFamilyFields(profile, data) {
  assignIfPresent(profile, {
    householdName: data.householdName,
    email: normalizeEmail(data.email || profile.email),
    phone: data.phone,
    children: data.children,
    numberOfChildren: data.numberOfChildren,
    childrenAges: data.childrenAges,
    specialNeeds: data.specialNeeds,
    howDidYouHear: data.howDidYouHear,
    faithBackground: data.faithBackground,
    familyValues: data.familyValues,
    address: data.address,
    city: data.city,
    state: data.state,
    postalCode: data.postalCode,
    emergencyContact: data.emergencyContact
  });
}

async function findProfileForSittingSession({ session, type, email }) {
  const Model = type === 'sitter' ? SitterProfile : SittingFamilyProfile;
  const normalizedEmail = normalizeEmail(email || session.customer_email || session.customer_details?.email || session.metadata?.applicantEmail);
  const conditions = [{ stripeSessionId: session.id }];

  if (session.payment_intent) {
    conditions.push({ stripePaymentIntentId: session.payment_intent });
  }

  if (normalizedEmail) {
    conditions.push({ email: normalizedEmail, status: 'pending_payment' });
  }

  return Model.findOne({ $or: conditions });
}

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
      password,
      firstName,
      lastName,
      phone,
      city,
      state,
      postalCode
    } = req.body;

    const normalizedEmail = normalizeEmail(email);

    // Validate required fields
    if (!normalizedEmail || !password || !firstName || !lastName || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, first name, last name, city, and state are required'
      });
    }

    let user = await User.findOne({ email: normalizedEmail });
    let profile = user ? await SitterProfile.findOne({ userId: user._id }) : null;

    if (profile) {
      if (profile.applicationFeePaid || profile.status !== 'pending_payment') {
        return res.status(400).json({
          success: false,
          message: 'A sitter account with this email already exists'
        });
      }

      applySitterFields(profile, req.body);
      await profile.save();
    }

    if (profile?.stripeSessionId) {
      try {
        const existingSession = await stripeService.getSession(profile.stripeSessionId);
        if (existingSession.payment_status === 'paid') {
          return res.json({
            success: true,
            paid: true,
            sessionId: existingSession.id,
            message: 'Payment already completed. Finalizing registration now.'
          });
        }
        if (existingSession.url && existingSession.status === 'open') {
          return res.json({
            success: true,
            checkoutUrl: existingSession.url,
            sessionId: existingSession.id
          });
        }
      } catch (sessionError) {
        console.warn('Could not reuse existing sitter checkout session:', sessionError.message);
      }
    }

    const name = `${firstName} ${lastName}`;

    user = await ensureSittingUser({
      email: normalizedEmail,
      password,
      role: 'sitter',
      firstName,
      lastName,
      phone
    });

    if (!profile) {
      profile = new SitterProfile({
        userId: user._id,
        firstName,
        lastName,
        email: normalizedEmail,
        phone,
        city,
        state,
        postalCode: postalCode || '',
        status: 'pending_payment',
        membershipStatus: 'inactive',
        hourlyRate: req.body.hourlyRate || req.body.hourlyRate1Kid || 20,
        hourlyRate1Kid: req.body.hourlyRate1Kid || req.body.hourlyRate || 20,
        hourlyRate2Kids: req.body.hourlyRate2Kids || 25,
        hourlyRate3PlusKids: req.body.hourlyRate3PlusKids || 30
      });
    }

    applySitterFields(profile, req.body);
    await profile.save();

    // Create Stripe checkout session
    const session = await stripeService.createSittingCheckoutSession({
      type: 'sitter',
      email: normalizedEmail,
      name
    });

    profile.stripeSessionId = session.id;
    profile.stripeCustomerId = session.customer;
    await profile.save();

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
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment session. Please contact support; do not submit another payment.'
      });
    }

    const session = await stripeService.getSession(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    if (session.metadata?.registrationType && session.metadata.registrationType !== 'sitter') {
      return res.status(400).json({
        success: false,
        message: 'Payment session does not match sitter registration'
      });
    }

    const sessionEmail = normalizeEmail(session.customer_email || session.customer_details?.email || session.metadata?.applicantEmail);
    const requestEmail = normalizeEmail(req.body.email || sessionEmail);

    if (sessionEmail && requestEmail && sessionEmail !== requestEmail) {
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

    let profile = await findProfileForSittingSession({
      session,
      type: 'sitter',
      email: requestEmail
    });
    let user = profile?.userId ? await User.findById(profile.userId) : null;

    if (!user) {
      const emailForUser = requestEmail || profile?.email;
      const firstNameForUser = req.body.firstName || profile?.firstName;
      const lastNameForUser = req.body.lastName || profile?.lastName;

      if (!emailForUser || !req.body.password || !firstNameForUser || !lastNameForUser) {
        return res.status(409).json({
          success: false,
          message: 'Payment was received, but the registration details could not be restored on this device. Please contact Club Nanny support; do not submit another payment.'
        });
      }

      user = await ensureSittingUser({
        email: emailForUser,
        password: req.body.password,
        role: 'sitter',
        firstName: firstNameForUser,
        lastName: lastNameForUser,
        phone: req.body.phone || profile?.phone
      });
    }

    if (!profile) {
      const requiredFields = ['email', 'password', 'firstName', 'lastName', 'city', 'state'];
      const missingFields = requiredFields.filter((field) => !hasValue(req.body[field]));
      if (missingFields.length) {
        return res.status(409).json({
          success: false,
          message: 'Payment was received, but the registration details could not be restored on this device. Please contact Club Nanny support; do not submit another payment.'
        });
      }

      profile = new SitterProfile({
        userId: user._id,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: requestEmail,
        phone: req.body.phone || '',
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode || '',
        status: 'pending_payment',
        membershipStatus: 'inactive',
        hourlyRate: req.body.hourlyRate || req.body.hourlyRate1Kid || 20,
        hourlyRate1Kid: req.body.hourlyRate1Kid || req.body.hourlyRate || 20,
        hourlyRate2Kids: req.body.hourlyRate2Kids || 25,
        hourlyRate3PlusKids: req.body.hourlyRate3PlusKids || 30
      });
    }

    const wasAlreadyComplete = Boolean(profile.applicationFeePaid);

    if (Object.keys(req.body).length > 1) {
      applySitterFields(profile, {
        ...req.body,
        email: req.body.email || profile.email || sessionEmail
      });
    }

    profile.userId = user._id;
    profile.status = profile.status === 'active' ? 'active' : 'pending_approval';
    profile.membershipStatus = profile.membershipStatus === 'active' ? 'active' : 'inactive';
    profile.stripeSessionId = session.id;
    profile.stripePaymentIntentId = session.payment_intent;
    profile.stripeCustomerId = session.customer;
    profile.applicationFeePaid = true;
    profile.applicationFeePaidAt = profile.applicationFeePaidAt || new Date();
    profile.applicationFeeAmountCents = applicationFeeAmountCents;
    profile.membershipFeeAmountCents = membershipFeeAmountCents;
    profile.membershipFeeChargedAt = profile.membershipFeeChargedAt || membershipFeeChargedAt;
    await profile.save();

    await upsertSittingPayment({
      session,
      profile,
      type: 'sitter',
      amount: applicationFeeAmountCents + membershipFeeAmountCents,
      applicantName: sitterApplicantName(profile)
    });

    if (!wasAlreadyComplete) {
      try {
        const emailResult = await emailService.handleSitterApplicationSubmitted(profile.toObject());
        console.log('Sitter application notification emails processed:', emailResult);
      } catch (emailError) {
        console.error('Failed to send sitter application notification emails:', emailError.message);
      }
    }

    const token = signSittingToken(user);

    res.status(wasAlreadyComplete ? 200 : 201).json({
      success: true,
      message: wasAlreadyComplete
        ? 'Sitter registration already complete.'
        : 'Sitter registration complete. Your account is pending approval.',
      token,
      user: userResponse(user),
      profile
    });
  } catch (error) {
    if (error?.code === 11000) {
      try {
        const sessionId = req.body?.sessionId;
        const session = sessionId ? await stripeService.getSession(sessionId) : null;
        const fallbackProfile = session
          ? await findProfileForSittingSession({ session, type: 'sitter', email: req.body?.email })
          : null;
        const fallbackUser = fallbackProfile?.userId ? await User.findById(fallbackProfile.userId) : null;

        if (fallbackProfile && fallbackUser) {
          await upsertSittingPayment({
            session,
            profile: fallbackProfile,
            type: 'sitter',
            amount: Number(session.amount_total || 0),
            applicantName: sitterApplicantName(fallbackProfile)
          });

          return res.status(200).json({
            success: true,
            message: 'Sitter registration already complete.',
            token: signSittingToken(fallbackUser),
            user: userResponse(fallbackUser),
            profile: fallbackProfile
          });
        }
      } catch (fallbackError) {
        console.error('Complete sitter duplicate recovery error:', fallbackError);
      }
    }

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
      password,
      householdName,
      phone,
      city,
      state,
      postalCode
    } = req.body;
    const normalizedEmail = normalizeEmail(email);

    // Validate required fields
    if (!normalizedEmail || !password || !householdName || !city || !state) {
      return res.status(400).json({
        success: false,
        message: 'Email, password, household name, city, and state are required'
      });
    }

    let user = await User.findOne({ email: normalizedEmail });
    let profile = user ? await SittingFamilyProfile.findOne({ userId: user._id }) : null;

    if (profile) {
      if (profile.membershipStatus === 'active' || profile.status !== 'pending_payment') {
        return res.status(400).json({
          success: false,
          message: 'A Club Nanny family account with this email already exists'
        });
      }

      applySittingFamilyFields(profile, req.body);
      await profile.save();
    }

    if (profile?.stripeSessionId) {
      try {
        const existingSession = await stripeService.getSession(profile.stripeSessionId);
        if (existingSession.payment_status === 'paid') {
          return res.json({
            success: true,
            paid: true,
            sessionId: existingSession.id,
            message: 'Payment already completed. Finalizing registration now.'
          });
        }
        if (existingSession.url && existingSession.status === 'open') {
          return res.json({
            success: true,
            checkoutUrl: existingSession.url,
            sessionId: existingSession.id
          });
        }
      } catch (sessionError) {
        console.warn('Could not reuse existing family checkout session:', sessionError.message);
      }
    }

    user = await ensureSittingUser({
      email: normalizedEmail,
      password,
      role: 'family',
      firstName: householdName,
      phone
    });

    if (!profile) {
      profile = new SittingFamilyProfile({
        userId: user._id,
        householdName,
        email: normalizedEmail,
        phone: phone || '',
        city,
        state,
        postalCode: postalCode || '',
        status: 'pending_payment',
        membershipStatus: 'inactive'
      });
    }

    applySittingFamilyFields(profile, req.body);
    await profile.save();

    // Create Stripe checkout session
    const session = await stripeService.createSittingCheckoutSession({
      type: 'sitting_family',
      email: normalizedEmail,
      name: householdName
    });

    profile.stripeSessionId = session.id;
    profile.stripeCustomerId = session.customer;
    await profile.save();

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
    const { sessionId } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing payment session. Please contact support; do not submit another payment.'
      });
    }

    const session = await stripeService.getSession(sessionId);

    if (session.payment_status !== 'paid') {
      return res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }

    if (session.metadata?.registrationType && session.metadata.registrationType !== 'sitting_family') {
      return res.status(400).json({
        success: false,
        message: 'Payment session does not match family registration'
      });
    }

    const sessionEmail = normalizeEmail(session.customer_email || session.customer_details?.email || session.metadata?.applicantEmail);
    const requestEmail = normalizeEmail(req.body.email || sessionEmail);

    if (sessionEmail && requestEmail && sessionEmail !== requestEmail) {
      return res.status(400).json({
        success: false,
        message: 'Email does not match payment session'
      });
    }

    let profile = await findProfileForSittingSession({
      session,
      type: 'sitting_family',
      email: requestEmail
    });
    let user = profile?.userId ? await User.findById(profile.userId) : null;

    if (!user) {
      const emailForUser = requestEmail || profile?.email;
      const householdNameForUser = req.body.householdName || profile?.householdName;

      if (!emailForUser || !req.body.password || !householdNameForUser) {
        return res.status(409).json({
          success: false,
          message: 'Payment was received, but the registration details could not be restored on this device. Please contact Club Nanny support; do not submit another payment.'
        });
      }

      user = await ensureSittingUser({
        email: emailForUser,
        password: req.body.password,
        role: 'family',
        firstName: householdNameForUser,
        phone: req.body.phone || profile?.phone
      });
    }

    if (!profile) {
      const requiredFields = ['email', 'password', 'householdName', 'city', 'state'];
      const missingFields = requiredFields.filter((field) => !hasValue(req.body[field]));
      if (missingFields.length) {
        return res.status(409).json({
          success: false,
          message: 'Payment was received, but the registration details could not be restored on this device. Please contact Club Nanny support; do not submit another payment.'
        });
      }

      profile = new SittingFamilyProfile({
        userId: user._id,
        householdName: req.body.householdName,
        email: requestEmail,
        phone: req.body.phone || '',
        city: req.body.city,
        state: req.body.state,
        postalCode: req.body.postalCode || '',
        status: 'pending_payment',
        membershipStatus: 'inactive'
      });
    }

    const wasAlreadyComplete = profile.membershipStatus === 'active' || profile.status === 'active';

    if (Object.keys(req.body).length > 1) {
      applySittingFamilyFields(profile, {
        ...req.body,
        email: req.body.email || profile.email || sessionEmail
      });
    }

    profile.userId = user._id;
    profile.status = 'active';
    profile.membershipStatus = 'active';
    profile.membershipExpiresAt = profile.membershipExpiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    profile.stripeSessionId = session.id;
    profile.stripeCustomerId = session.customer;
    await profile.save();

    await upsertSittingPayment({
      session,
      profile,
      type: 'sitting_family',
      amount: Number(session.amount_total || stripeService.getSittingFee('family_membership')),
      applicantName: profile.householdName
    });

    if (!wasAlreadyComplete) {
      try {
        const emailResult = await emailService.handleSittingFamilyApplicationSubmitted(profile.toObject());
        console.log('Sitting family application notification emails processed:', emailResult);
      } catch (emailError) {
        console.error('Failed to send sitting family application notification emails:', emailError.message);
      }
    }

    const token = signSittingToken(user);

    res.status(wasAlreadyComplete ? 200 : 201).json({
      success: true,
      message: wasAlreadyComplete ? 'Family registration already complete!' : 'Family registration complete!',
      token,
      user: userResponse(user),
      profile
    });
  } catch (error) {
    if (error?.code === 11000) {
      try {
        const sessionId = req.body?.sessionId;
        const session = sessionId ? await stripeService.getSession(sessionId) : null;
        const fallbackProfile = session
          ? await findProfileForSittingSession({ session, type: 'sitting_family', email: req.body?.email })
          : null;
        const fallbackUser = fallbackProfile?.userId ? await User.findById(fallbackProfile.userId) : null;

        if (fallbackProfile && fallbackUser) {
          await upsertSittingPayment({
            session,
            profile: fallbackProfile,
            type: 'sitting_family',
            amount: Number(session.amount_total || 0),
            applicantName: fallbackProfile.householdName
          });

          return res.status(200).json({
            success: true,
            message: 'Family registration already complete!',
            token: signSittingToken(fallbackUser),
            user: userResponse(fallbackUser),
            profile: fallbackProfile
          });
        }
      } catch (fallbackError) {
        console.error('Complete family duplicate recovery error:', fallbackError);
      }
    }

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

    const computedAge = calculateValidSitterAge({ dateOfBirth });

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
      ...(computedAge !== undefined ? { age: computedAge } : {}),
      howDidYouHear: howDidYouHear || '',
      yearsOfExperience: yearsOfExperience || '',
      ageGroupsWorkedWith: ageGroupsWorkedWith || '',
      typesOfExperience: typesOfExperience || '',
      experience: experience || '',
      faithJourney: faithJourney || '',
      whyCalledToServe: whyCalledToServe || '',
      specialSkills: specialSkills || '',
      bio: bio || '',
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
        serviceType: 'sitting',
        firstName: householdName,
        phone: phone || ''
      });
    } else {
      // Update existing user
      if (user.serviceType === 'nanny') {
        user.serviceType = 'both';
      }
      if (!user.firstName) user.firstName = householdName;
      if (phone && !user.phone) user.phone = phone;
      await user.save();
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
