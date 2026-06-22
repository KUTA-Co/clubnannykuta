import mongoose from 'mongoose';

const familyApplicationSchema = new mongoose.Schema({
  // Basic Info
  parentName: {
    type: String,
    required: [true, 'Parent name is required'],
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

  // Children Info
  numberOfChildren: {
    type: String,
    trim: true
  },
  childrenAges: {
    type: String,
    trim: true
  },

  // Schedule
  startDate: {
    type: String,
    trim: true
  },
  endDate: {
    type: String,
    trim: true
  },
  hoursPerWeek: {
    type: String,
    trim: true
  },
  weeklySchedule: {
    type: String,
    trim: true
  },
  specialNeeds: {
    type: String,
    trim: true
  },

  // Faith & Values
  church: {
    type: String,
    trim: true
  },
  faithBackground: {
    type: String,
    trim: true
  },
  familyValues: {
    type: String,
    trim: true
  },

  // Preferences
  nannyAgeRange: {
    type: String,
    trim: true
  },
  experienceLevel: {
    type: String,
    trim: true
  },
  personalityPreferences: {
    type: String,
    trim: true
  },
  additionalInfo: {
    type: String,
    trim: true
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

  // Placement Fees
  placementFees: [{
    type: {
      type: String,
      enum: ['placement_local', 'placement_livein']
    },
    stripeSessionId: String,
    amount: Number,
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'refunded'],
      default: 'pending'
    },
    createdAt: Date,
    completedAt: Date,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],

  // Placement Tracking
  placementDate: Date,
  placementEndDate: Date,
  matchedNannyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NannyApplication'
  },
  matchedNannyName: {
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
familyApplicationSchema.index({ email: 1 });
familyApplicationSchema.index({ status: 1 });
familyApplicationSchema.index({ paymentStatus: 1 });
familyApplicationSchema.index({ createdAt: -1 });
familyApplicationSchema.index({ matchedNannyId: 1 });

const FamilyApplication = mongoose.model('FamilyApplication', familyApplicationSchema);

export default FamilyApplication;
