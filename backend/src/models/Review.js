import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  // One review per completed booking
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingRequest',
    required: true,
    unique: true
  },
  sitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SitterProfile',
    required: true
  },
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SittingFamilyProfile',
    required: true
  },

  // The rating itself
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
    index: true
  }
}, {
  timestamps: true
});

// Indexes (bookingId already indexed via unique: true)
reviewSchema.index({ sitterId: 1 });
reviewSchema.index({ familyId: 1 });

const Review = mongoose.model('Review', reviewSchema);

export default Review;
