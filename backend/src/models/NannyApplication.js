import mongoose from 'mongoose';

const nannyApplicationSchema = new mongoose.Schema({
  // Basic Info
  fullName: {
    type: String,
    required: [true, 'Full name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  phone: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    trim: true
  },
  state: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: String,
    trim: true
  },
  university: {
    type: String,
    trim: true
  },

  // Experience
  yearsExperience: {
    type: String,
    trim: true
  },
  ageGroups: {
    type: String,
    trim: true
  },
  experienceTypes: {
    type: String,
    trim: true
  },
  experienceDetails: {
    type: String,
    trim: true
  },

  // Faith
  church: {
    type: String,
    trim: true
  },
  faithJourney: {
    type: String,
    trim: true
  },
  whyCalled: {
    type: String,
    trim: true
  },

  // Availability
  availableStartDate: {
    type: String,
    trim: true
  },
  availableEndDate: {
    type: String,
    trim: true
  },
  hoursAvailable: {
    type: String,
    trim: true
  },
  locationPreferences: {
    type: String,
    trim: true
  },
  ageGroupPreferences: {
    type: String,
    trim: true
  },
  additionalInfo: {
    type: String,
    trim: true
  },

  // Consent
  backgroundCheckConsent: {
    type: Boolean,
    default: false
  },

  // Application Status
  status: {
    type: String,
    enum: ['pending', 'reviewing', 'approved', 'rejected', 'matched', 'inactive'],
    default: 'pending'
  },

  // Payment
  paymentStatus: {
    type: String,
    enum: ['unpaid', 'pending', 'paid', 'refunded'],
    default: 'unpaid'
  },
  stripeSessionId: {
    type: String,
    trim: true
  },
  stripePaymentIntentId: {
    type: String,
    trim: true
  },

  // Background Check Tracking
  backgroundCheckStatus: {
    type: String,
    enum: ['not_requested', 'requested', 'in_progress', 'passed', 'failed'],
    default: 'not_requested'
  },
  backgroundCheckRequestedDate: Date,
  backgroundCheckCompletedDate: Date,
  backgroundCheckNotes: {
    type: String,
    trim: true
  },

  // Placement Tracking
  placementDate: Date,
  placementEndDate: Date,
  matchedFamilyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyApplication'
  },
  matchedFamilyName: {
    type: String,
    trim: true
  },
  matchNotes: {
    type: String,
    trim: true
  },

  // Admin Review
  reviewedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  reviewedAt: Date,
  reviewNotes: {
    type: String,
    trim: true
  },

  // Associated User (if they create an account)
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes
nannyApplicationSchema.index({ email: 1 });
nannyApplicationSchema.index({ status: 1 });
nannyApplicationSchema.index({ paymentStatus: 1 });
nannyApplicationSchema.index({ createdAt: -1 });
nannyApplicationSchema.index({ backgroundCheckStatus: 1 });
nannyApplicationSchema.index({ matchedFamilyId: 1 });

const NannyApplication = mongoose.model('NannyApplication', nannyApplicationSchema);

export default NannyApplication;
