import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema({
  nannyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NannyApplication',
    required: true
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyApplication',
    required: true
  },
  // Denormalized for quick display (no need to populate every time)
  nannyName: {
    type: String,
    required: true,
    trim: true
  },
  familyName: {
    type: String,
    required: true,
    trim: true
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  schedule: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

// Indexes for fast lookups
matchSchema.index({ nannyId: 1, status: 1 });
matchSchema.index({ familyId: 1, status: 1 });
matchSchema.index({ status: 1 });
matchSchema.index({ createdAt: -1 });

// Compound index to prevent exact duplicate active matches
matchSchema.index(
  { nannyId: 1, familyId: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

const Match = mongoose.model('Match', matchSchema);

export default Match;
