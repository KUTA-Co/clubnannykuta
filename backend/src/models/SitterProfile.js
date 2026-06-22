import mongoose from 'mongoose';

const sitterProfileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },

  // Basic Info
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
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
  profilePhoto: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  age: {
    type: Number,
    min: 16,
    max: 100
  },
  dateOfBirth: {
    type: Date
  },
  howDidYouHear: {
    type: String,
    trim: true
  },

  // Rate & Experience
  hourlyRate: {
    type: Number,
    min: 0
  },
  hourlyRate1Kid: {
    type: Number,
    min: 0
  },
  hourlyRate2Kids: {
    type: Number,
    min: 0
  },
  hourlyRate3PlusKids: {
    type: Number,
    min: 0
  },
  yearsOfExperience: {
    type: String,
    trim: true
  },
  ageGroupsWorkedWith: {
    type: String,
    trim: true
  },
  typesOfExperience: {
    type: String,
    trim: true
  },
  experience: {
    type: String,
    trim: true
  },

  // Faith & Calling
  faithJourney: {
    type: String,
    trim: true
  },
  whyCalledToServe: {
    type: String,
    trim: true
  },
  specialSkills: {
    type: String,
    trim: true
  },

  // Ratings (denormalized from Review docs)
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

  // Location
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
  preferredRadius: {
    type: Number,
    default: 15, // miles
    min: 1,
    max: 100
  },

  // Status & Membership
  status: {
    type: String,
    enum: ['pending_payment', 'pending_approval', 'active', 'suspended', 'rejected'],
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
  },
  applicationFeePaid: {
    type: Boolean,
    default: false
  },
  applicationFeePaidAt: Date,

  // Approval
  approvedAt: Date,
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  rejectionReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Virtual for full name
sitterProfileSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Indexes
sitterProfileSchema.index({ userId: 1 });
sitterProfileSchema.index({ status: 1 });
sitterProfileSchema.index({ membershipStatus: 1 });
sitterProfileSchema.index({ city: 1, state: 1 });
sitterProfileSchema.index({ postalCode: 1 });

// Ensure virtuals are included in JSON
sitterProfileSchema.set('toJSON', { virtuals: true });
sitterProfileSchema.set('toObject', { virtuals: true });

const SitterProfile = mongoose.model('SitterProfile', sitterProfileSchema);

export default SitterProfile;
