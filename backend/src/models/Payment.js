import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  // Stripe IDs
  stripeSessionId: {
    type: String,
    required: true,
    unique: true
  },
  stripePaymentIntentId: {
    type: String,
    trim: true
  },

  // Payment Type
  paymentType: {
    type: String,
    enum: ['application', 'placement_standard', 'placement_local', 'placement_livein'],
    default: 'application'
  },

  // Application Reference
  applicationType: {
    type: String,
    enum: ['family', 'nanny'],
    required: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    refPath: 'applicationModel'
  },
  applicationModel: {
    type: String,
    enum: ['FamilyApplication', 'NannyApplication'],
    required: true
  },

  // Applicant Info
  applicantEmail: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  applicantName: {
    type: String,
    trim: true
  },

  // Payment Details
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    default: 'usd',
    uppercase: true
  },

  // Status
  status: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },

  // Timestamps
  completedAt: Date,
  refundedAt: Date,

  // Stripe webhook data
  stripeEventId: String,
  stripeCustomerId: String,

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes (stripeSessionId index already created by unique: true)
paymentSchema.index({ stripePaymentIntentId: 1 });
paymentSchema.index({ applicationType: 1, applicationId: 1 });
paymentSchema.index({ applicantEmail: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function() {
  return `$${(this.amount / 100).toFixed(2)}`;
});

paymentSchema.set('toJSON', { virtuals: true });
paymentSchema.set('toObject', { virtuals: true });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
