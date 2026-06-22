import mongoose from 'mongoose';

const childSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  age: {
    type: Number,
    min: 0,
    max: 18
  },
  specialNeeds: {
    type: String,
    trim: true
  }
}, { _id: false });

const emergencyContactSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  relationship: {
    type: String,
    trim: true
  }
}, { _id: false });

const sittingFamilyProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Basic Info
  householdName: {
    type: String,
    required: [true, 'Household name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },

  // Children
  children: [childSchema],
  numberOfChildren: {
    type: Number,
    min: 1
  },
  childrenAges: {
    type: String,
    trim: true
  },
  specialNeeds: {
    type: String,
    trim: true
  },

  // How they found us
  howDidYouHear: {
    type: String,
    trim: true
  },

  // Faith & Values
  faithBackground: {
    type: String,
    trim: true
  },
  familyValues: {
    type: String,
    trim: true
  },

  // Profile Photo
  profilePhoto: {
    type: String,
    trim: true
  },

  // Address
  address: {
    type: String,
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true
  },
  postalCode: {
    type: String,
    trim: true
  },

  // Emergency Contact
  emergencyContact: emergencyContactSchema,

  // Ratings (denormalized from FamilyReview docs — reviews left by sitters)
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },

  // Status & Membership
  status: {
    type: String,
    enum: ['pending_payment', 'active', 'suspended'],
    default: 'pending_payment'
  },
  membershipStatus: {
    type: String,
    enum: ['inactive', 'active', 'expired'],
    default: 'inactive'
  },
  membershipExpiresAt: Date,

  // Payment Tracking
  stripeSessionId: {
    type: String,
    trim: true
  },
  stripeCustomerId: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
sittingFamilyProfileSchema.index({ userId: 1 });
sittingFamilyProfileSchema.index({ status: 1 });
sittingFamilyProfileSchema.index({ membershipStatus: 1 });
sittingFamilyProfileSchema.index({ city: 1, state: 1 });
sittingFamilyProfileSchema.index({ postalCode: 1 });

const SittingFamilyProfile = mongoose.model('SittingFamilyProfile', sittingFamilyProfileSchema);

export default SittingFamilyProfile;
