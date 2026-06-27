import mongoose from 'mongoose';

const bookingRequestSchema = new mongoose.Schema({
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SittingFamilyProfile',
    required: true
  },

  // Date & Time
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  startTime: {
    type: String,
    required: [true, 'Start time is required'],
    trim: true
  },
  endTime: {
    type: String,
    required: [true, 'End time is required'],
    trim: true
  },
  startAt: {
    type: Date
  },
  endAt: {
    type: Date
  },
  timeZone: {
    type: String,
    trim: true
  },

  // Location
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

  // Children Info
  numberOfChildren: {
    type: Number,
    required: [true, 'Number of children is required'],
    min: 1,
    max: 10
  },
  childrenAges: [{
    type: Number,
    min: 0,
    max: 18
  }],

  // Additional Info
  notes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  specialInstructions: {
    type: String,
    trim: true,
    maxlength: 1000
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'open', 'responses_received', 'confirmed', 'cancelled', 'completed', 'expired'],
    default: 'draft'
  },

  // Confirmation
  confirmedSitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SitterProfile'
  },
  confirmedAt: Date,

  // Payment (booking-level, charged to the family after a sitter is confirmed)
  payment: {
    status: {
      type: String,
      enum: ['unpaid', 'paid', 'refunded'],
      default: 'unpaid'
    },
    amountCents: Number,        // total charged (rate × hours), in cents
    currency: {
      type: String,
      default: 'usd'
    },
    ratePerHourCents: Number,   // snapshot of the sitter's hourly rate at pay time
    hours: Number,              // snapshot of computed duration
    stripeSessionId: {
      type: String,
      trim: true
    },
    stripePaymentIntentId: {
      type: String,
      trim: true
    },
    paidAt: Date
  },

  // Timestamps
  expiresAt: Date,
  completedAt: Date,
  reviewReminderSentAt: Date,
  cancelledAt: Date,
  cancellationReason: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
bookingRequestSchema.index({ familyId: 1 });
bookingRequestSchema.index({ status: 1 });
bookingRequestSchema.index({ date: 1 });
bookingRequestSchema.index({ confirmedSitterId: 1 });
bookingRequestSchema.index({ city: 1, state: 1 });
bookingRequestSchema.index({ postalCode: 1 });
bookingRequestSchema.index({ status: 1, endAt: 1, reviewReminderSentAt: 1 });

const BookingRequest = mongoose.model('BookingRequest', bookingRequestSchema);

export default BookingRequest;
