import Stripe from 'stripe';

// Initialize Stripe with the secret key
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

if (!stripe) {
  console.warn('⚠️  STRIPE_SECRET_KEY not set — payment endpoints will be unavailable until Stripe is configured.');
}

// Application fee amounts in cents
const APPLICATION_FEES = {
  family: 25000, // $250
  nanny: 7500    // $75
};

// Placement fee amounts in cents
const PLACEMENT_FEES = {
  local: 50000,   // $500 - Local nanny placement
  livein: 100000  // $1,000 - Live-in nanny placement
};

// Club Nanny sitter-side fees in cents
const SITTING_FEES = {
  sitter_application: 4500,  // $45 one-time application fee
  sitter_membership: 1200,   // $12/month membership
  family_membership: 2000    // $20/month membership
};

// Platform's cut of a booking charge, as a percent (Stage 1: 0% — full amount passes to the sitter,
// paid out manually off-platform). Bump this when Stripe Connect payouts are added in Stage 2.
const BOOKING_PLATFORM_FEE_PERCENT = 0;

class StripeService {
  constructor() {
    this.stripe = stripe;
  }

  ensureConfigured() {
    if (!this.stripe) {
      throw new Error('Stripe is not configured. Set STRIPE_SECRET_KEY to enable payments.');
    }

    return this.stripe;
  }

  /**
   * Create a Stripe Checkout session for application payment
   * @param {Object} options - Session options
   * @param {string} options.type - 'family' or 'nanny'
   * @param {string} options.applicationId - MongoDB application ID (optional for pre-payment flow)
   * @param {string} options.email - Applicant email
   * @param {string} options.name - Applicant name
   * @returns {Object} Stripe checkout session
   */
  async createCheckoutSession({ type, applicationId, email, name }) {
    const amount = APPLICATION_FEES[type];

    if (!amount) {
      throw new Error(`Invalid application type: ${type}`);
    }

    const productName = type === 'family'
      ? 'Club Nanny Family Application Fee'
      : 'Club Nanny Nanny Application Fee';

    const description = type === 'family'
      ? 'Non-refundable application fee to begin the family matching process'
      : 'Non-refundable application fee to join the Club Nanny nanny network';

    // Build metadata - applicationId is optional for pre-payment flow
    const metadata = {
      applicationType: type,
      applicantName: name,
      applicantEmail: email
    };

    // Only include applicationId if provided (legacy flow)
    if (applicationId) {
      metadata.applicationId = applicationId.toString();
    }

    const session = await this.ensureConfigured().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      metadata,
      success_url: `${process.env.FRONTEND_URL}/application-submitted?type=${type}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/apply-${type}?payment=cancelled`,
    });

    return session;
  }

  /**
   * Create a Stripe Checkout session for placement fee
   * @param {Object} options - Session options
   * @param {string} options.applicationId - MongoDB application ID
   * @param {string} options.email - Applicant email
   * @param {string} options.name - Applicant name
   * @param {string} options.feeType - 'local' ($500) or 'livein' ($1,000)
   * @returns {Object} Stripe checkout session
   */
  async createPlacementFeeSession({ applicationId, email, name, feeType }) {
    const amount = PLACEMENT_FEES[feeType];

    if (!amount) {
      throw new Error(`Invalid placement fee type: ${feeType}. Must be 'local' or 'livein'`);
    }

    const isLiveIn = feeType === 'livein';
    const productName = isLiveIn
      ? 'Club Nanny Live-In Placement Fee'
      : 'Club Nanny Local Placement Fee';

    const description = isLiveIn
      ? 'Ideal for families who prefer a nanny residing in their home for added flexibility and support.'
      : 'Perfect for families seeking a part-time or full-time nanny who lives locally.';

    const session = await this.ensureConfigured().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: description,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      customer_email: email,
      metadata: {
        paymentType: `placement_${feeType}`,
        applicationType: 'family',
        applicationId: applicationId.toString(),
        applicantName: name,
        applicantEmail: email
      },
      success_url: `${process.env.FRONTEND_URL}/admin/families/${applicationId}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/admin/families/${applicationId}?payment=cancelled`,
    });

    return session;
  }

  /**
   * Retrieve a checkout session
   * @param {string} sessionId - Stripe session ID
   * @returns {Object} Stripe session
   */
  async getSession(sessionId) {
    return this.ensureConfigured().checkout.sessions.retrieve(sessionId);
  }

  /**
   * Verify webhook signature
   * @param {string} payload - Raw request body
   * @param {string} signature - Stripe-Signature header
   * @returns {Object} Stripe event
   */
  verifyWebhook(payload, signature) {
    return this.ensureConfigured().webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  }

  /**
   * Get application fee amount
   * @param {string} type - 'family' or 'nanny'
   * @returns {number} Fee in cents
   */
  getApplicationFee(type) {
    return APPLICATION_FEES[type];
  }

  /**
   * Format amount from cents to dollars
   * @param {number} cents - Amount in cents
   * @returns {string} Formatted amount
   */
  formatAmount(cents) {
    return `$${(cents / 100).toFixed(2)}`;
  }

  /**
   * Get placement fee amount
   * @param {string} feeType - 'local' ($500) or 'livein' ($1,000)
   * @returns {number} Fee in cents
   */
  getPlacementFee(feeType) {
    return PLACEMENT_FEES[feeType];
  }

  /**
   * Create a Stripe Checkout session for Club Nanny sitter-side registration
   * @param {Object} options - Session options
   * @param {string} options.type - 'sitter' or 'sitting_family'
   * @param {string} options.email - User email
   * @param {string} options.name - User name
   * @returns {Object} Stripe checkout session
   */
  async createSittingCheckoutSession({ type, email, name }) {
    let lineItems = [];
    let productName, description;

    if (type === 'sitter') {
      // Sitter: $45 application fee + first month $12 membership
      productName = 'Club Nanny Sitter Registration';
      description = 'Application fee ($45) plus first month membership ($12)';
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Club Nanny Application Fee',
              description: 'One-time non-refundable application fee'
            },
            unit_amount: SITTING_FEES.sitter_application
          },
          quantity: 1
        },
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Club Nanny Monthly Membership',
              description: 'First month membership fee'
            },
            unit_amount: SITTING_FEES.sitter_membership
          },
          quantity: 1
        }
      ];
    } else if (type === 'sitting_family') {
      // Family: $20/month membership
      productName = 'Club Nanny Family Registration';
      description = 'First month membership ($20)';
      lineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Club Nanny Family Membership',
              description: 'First month membership fee'
            },
            unit_amount: SITTING_FEES.family_membership
          },
          quantity: 1
        }
      ];
    } else {
      throw new Error(`Invalid sitting registration type: ${type}`);
    }

    const session = await this.ensureConfigured().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      customer_email: email,
      metadata: {
        registrationType: type,
        applicantName: name,
        applicantEmail: email
      },
      success_url: `${process.env.FRONTEND_URL}/sitting/registration-complete?type=${type}&payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/sitting/register/${type === 'sitter' ? 'sitter' : 'family'}?payment=cancelled`
    });

    return session;
  }

  /**
   * Get sitting fee amount
   * @param {string} feeType - 'sitter_application', 'sitter_membership', or 'family_membership'
   * @returns {number} Fee in cents
   */
  getSittingFee(feeType) {
    return SITTING_FEES[feeType];
  }

  /**
   * Create a Stripe Checkout session for a Club Nanny booking payment (family pays per booking).
   * Stage 1: charges the family the full amount; sitter is paid out off-platform.
   * @param {Object} options
   * @param {string} options.bookingId - The BookingRequest _id
   * @param {string} options.email - Family contact email (prefilled on checkout)
   * @param {string} options.name - Family/household name
   * @param {number} options.amountCents - Total to charge, in cents
   * @param {string} [options.description] - Line-item description (e.g. "4h × $20/hr")
   * @returns {Object} Stripe checkout session
   */
  async createBookingPaymentSession({ bookingId, email, name, amountCents, description }) {
    if (!bookingId) {
      throw new Error('bookingId is required for a booking payment');
    }
    if (!amountCents || amountCents < 50) {
      // Stripe's minimum charge is $0.50
      throw new Error('Booking amount is below the minimum chargeable amount');
    }

    const session = await this.ensureConfigured().checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Club Nanny Booking',
              description: description || 'Babysitting booking payment'
            },
            unit_amount: amountCents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      customer_email: email,
      metadata: {
        paymentType: 'booking_payment',
        bookingId: bookingId.toString(),
        familyName: name || ''
      },
      success_url: `${process.env.FRONTEND_URL}/sitting/family/bookings?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/sitting/family/bookings?payment=cancelled`
    });

    return session;
  }
}

const stripeService = new StripeService();

export default stripeService;
export { APPLICATION_FEES, PLACEMENT_FEES, SITTING_FEES, BOOKING_PLATFORM_FEE_PERCENT };
