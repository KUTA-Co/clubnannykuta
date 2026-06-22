import mongoose from 'mongoose';

// A review left BY a sitter ABOUT a family, after a completed booking.
// Kept separate from `Review` (family→sitter) so each direction has its own
// one-review-per-booking constraint and rating aggregation.
const familyReviewSchema = new mongoose.Schema({
  // One review per completed booking (per direction)
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BookingRequest',
    required: true,
    unique: true
  },
  // The sitter who wrote the review
  sitterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SitterProfile',
    required: true
  },
  // The family being reviewed
  familyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SittingFamilyProfile',
    required: true
  },

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
  }
}, {
  timestamps: true
});

// Indexes (bookingId already indexed via unique: true)
familyReviewSchema.index({ familyId: 1 });
familyReviewSchema.index({ sitterId: 1 });

const FamilyReview = mongoose.model('FamilyReview', familyReviewSchema);

export default FamilyReview;
