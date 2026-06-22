import mongoose from 'mongoose';

const blockedSlotSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true
  },
  startTime: {
    type: String,
    trim: true
  },
  endTime: {
    type: String,
    trim: true
  },
  reason: {
    type: String,
    trim: true
  },
  isAllDay: {
    type: Boolean,
    default: false
  }
}, { _id: true });

const dayAvailabilitySchema = new mongoose.Schema({
  available: {
    type: Boolean,
    default: true
  },
  start: {
    type: String,
    trim: true,
    default: '08:00'
  },
  end: {
    type: String,
    trim: true,
    default: '22:00'
  }
}, { _id: false });

const sitterAvailabilitySchema = new mongoose.Schema({
  sitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SitterProfile',
    required: true,
    unique: true
  },

  // Blocked time slots (specific dates/times when unavailable)
  blockedSlots: [blockedSlotSchema],

  // Weekly recurring availability
  weeklyAvailability: {
    monday: { type: dayAvailabilitySchema, default: () => ({}) },
    tuesday: { type: dayAvailabilitySchema, default: () => ({}) },
    wednesday: { type: dayAvailabilitySchema, default: () => ({}) },
    thursday: { type: dayAvailabilitySchema, default: () => ({}) },
    friday: { type: dayAvailabilitySchema, default: () => ({}) },
    saturday: { type: dayAvailabilitySchema, default: () => ({}) },
    sunday: { type: dayAvailabilitySchema, default: () => ({}) }
  }
}, {
  timestamps: true
});

// Indexes
sitterAvailabilitySchema.index({ sitterId: 1 });
sitterAvailabilitySchema.index({ 'blockedSlots.date': 1 });

const SitterAvailability = mongoose.model('SitterAvailability', sitterAvailabilitySchema);

export default SitterAvailability;
