import mongoose from 'mongoose';

const sitterResponseSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingRequest',
    required: true
  },
  sitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SitterProfile',
    required: true
  },

  // Response Info
  status: {
    type: String,
    enum: ['interested', 'withdrawn', 'selected', 'not_selected'],
    default: 'interested'
  },
  message: {
    type: String,
    trim: true,
    maxlength: 500
  },

  // Timestamps
  respondedAt: {
    type: Date,
    default: Date.now
  },
  selectedAt: Date,
  withdrawnAt: Date
}, {
  timestamps: true
});

// Compound unique index - one response per sitter per request
sitterResponseSchema.index({ requestId: 1, sitterId: 1 }, { unique: true });

// Individual indexes
sitterResponseSchema.index({ requestId: 1 });
sitterResponseSchema.index({ sitterId: 1 });
sitterResponseSchema.index({ status: 1 });

const SitterResponse = mongoose.model('SitterResponse', sitterResponseSchema);

export default SitterResponse;
