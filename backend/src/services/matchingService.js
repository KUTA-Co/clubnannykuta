import mongoose from 'mongoose';
import { SitterProfile, SittingFamilyProfile, BookingRequest, SitterResponse, Review, FamilyReview } from '../models/index.js';

// Escape a string for safe use inside a RegExp (city names like "St. Louis" contain regex chars)
function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build an array of Mongo conditions that match documents in the same area as `loc`.
 * Area = same city + state (case-insensitive) OR same ZIP first-3-digits (US sectional area).
 * Intended for use inside an `$or`. Returns null if `loc` has no usable location.
 * @param {Object} loc - { city, state, postalCode }
 * @returns {Array|null}
 */
function areaMatchConditions(loc = {}) {
  const conditions = [];

  if (loc.city && loc.state) {
    conditions.push({
      city: { $regex: new RegExp(`^${escapeRegex(loc.city)}$`, 'i') },
      state: { $regex: new RegExp(`^${escapeRegex(loc.state)}$`, 'i') }
    });
  }

  const digits = String(loc.postalCode || '').replace(/\D/g, '');
  if (digits.length >= 3) {
    conditions.push({ postalCode: { $regex: new RegExp(`^${digits.slice(0, 3)}`) } });
  }

  return conditions.length ? conditions : null;
}

/**
 * Service for matching sitters with booking requests based on location and availability
 */
class MatchingService {
  /**
   * Find sitters available for a booking request
   * @param {Object} request - The booking request
   * @returns {Array} Array of matching sitter profiles
   */
  async findAvailableSitters(request) {
    const { city, state, postalCode, date, startTime, endTime } = request;

    // Find active sitters in the same area (city/state OR shared ZIP prefix)
    const areaOr = areaMatchConditions({ city, state, postalCode });
    const query = { status: 'active', membershipStatus: 'active' };
    if (areaOr) query.$or = areaOr;

    const sitters = await SitterProfile.find(query);

    // Filter by availability
    const availableSitters = [];

    for (const sitter of sitters) {
      const isAvailable = await this.checkSitterAvailability(
        sitter._id,
        date,
        startTime,
        endTime
      );

      if (isAvailable) {
        availableSitters.push(sitter);
      }
    }

    return availableSitters;
  }

  /**
   * Check if a sitter is available for a specific date/time
   * @param {ObjectId} sitterId - The sitter's profile ID
   * @param {Date} date - The date to check
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   * @returns {boolean} Whether the sitter is available
   */
  async checkSitterAvailability(sitterId, date, startTime, endTime) {
    // Only confirmed bookings should block a sitter from responding. The sitter
    // availability editor is no longer exposed in the app, so enforcing hidden
    // weekly defaults would create false "scheduling conflict" messages.
    const hasConflictingBooking = await this.hasOverlappingBooking(
      sitterId,
      date,
      startTime,
      endTime
    );
    return !hasConflictingBooking;
  }

  /**
   * Check if a sitter has an overlapping confirmed booking
   * @param {ObjectId} sitterId - The sitter's profile ID
   * @param {Date} date - The date to check
   * @param {string} startTime - Start time (HH:MM)
   * @param {string} endTime - End time (HH:MM)
   * @returns {boolean} Whether there's a conflict
   */
  async hasOverlappingBooking(sitterId, date, startTime, endTime) {
    const dateObj = new Date(date);
    const dateStart = new Date(dateObj);
    dateStart.setHours(0, 0, 0, 0);
    const dateEnd = new Date(dateObj);
    dateEnd.setHours(23, 59, 59, 999);

    // Find confirmed bookings for this sitter on this date
    const confirmedBookings = await BookingRequest.find({
      confirmedSitterId: sitterId,
      status: 'confirmed',
      date: {
        $gte: dateStart,
        $lte: dateEnd
      }
    });

    // Check for time overlap
    for (const booking of confirmedBookings) {
      if (this.timesOverlap(startTime, endTime, booking.startTime, booking.endTime)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Check if two time ranges overlap
   * @param {string} start1 - First range start (HH:MM)
   * @param {string} end1 - First range end (HH:MM)
   * @param {string} start2 - Second range start (HH:MM)
   * @param {string} end2 - Second range end (HH:MM)
   * @returns {boolean} Whether the ranges overlap
   */
  timesOverlap(start1, end1, start2, end2) {
    // Convert times to minutes for easier comparison
    const toMinutes = (time) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    const s1 = toMinutes(start1);
    let e1 = toMinutes(end1);
    const s2 = toMinutes(start2);
    let e2 = toMinutes(end2);

    if (e1 <= s1) e1 += 24 * 60;
    if (e2 <= s2) e2 += 24 * 60;

    // Two ranges overlap if: start1 < end2 AND end1 > start2
    return s1 < e2 && e1 > s2;
  }

  /**
   * Compute the booking charge for a family: duration × the sitter's applicable hourly rate.
   * The rate is chosen by the number of children, falling back to the base hourlyRate.
   * @param {Object} request - The booking request (needs startTime, endTime, numberOfChildren)
   * @param {Object} sitter - The confirmed SitterProfile (hourlyRate* fields)
   * @returns {{ hours: number, ratePerHour: number, ratePerHourCents: number, amountCents: number }}
   */
  computeBookingAmount(request, sitter) {
    const toMinutes = (time) => {
      const [hours, minutes] = String(time).split(':').map(Number);
      return hours * 60 + minutes;
    };

    const startMinutes = toMinutes(request.startTime);
    let endMinutes = toMinutes(request.endTime);
    if (endMinutes <= startMinutes) endMinutes += 24 * 60;

    const minutes = Math.max(0, endMinutes - startMinutes);
    const hours = minutes / 60;

    const n = request.numberOfChildren;
    const ratePerHour =
      (n === 1 && sitter.hourlyRate1Kid) ||
      (n === 2 && sitter.hourlyRate2Kids) ||
      (n >= 3 && sitter.hourlyRate3PlusKids) ||
      sitter.hourlyRate ||
      0;

    const ratePerHourCents = Math.round(ratePerHour * 100);
    const amountCents = Math.round(hours * ratePerHourCents);

    return { hours, ratePerHour, ratePerHourCents, amountCents };
  }

  /**
   * Get sitters who have responded to a request
   * @param {ObjectId} requestId - The booking request ID
   * @returns {Array} Array of sitter responses with profile data
   */
  async getRequestResponses(requestId) {
    const responses = await SitterResponse.find({ requestId })
      .populate(
        'sitterId',
        'firstName lastName profilePhoto bio age howDidYouHear hourlyRate hourlyRate1Kid hourlyRate2Kids hourlyRate3PlusKids yearsOfExperience ageGroupsWorkedWith typesOfExperience experience faithJourney whyCalledToServe specialSkills city state averageRating reviewCount'
      )
      .sort({ respondedAt: -1 });

    // Attach each sitter's recent reviews so the family can read them on the response card
    const withReviews = await Promise.all(
      responses.map(async (r) => {
        const obj = r.toObject();
        if (r.sitterId?._id) {
          obj.sitterReviews = await this.getSitterReviews(r.sitterId._id);
        }
        return obj;
      })
    );

    return withReviews;
  }

  /**
   * Get recent family reviews for a sitter profile.
   * @param {ObjectId} sitterId - The sitter profile ID
   * @param {number} limit - Maximum number of reviews to return
   * @returns {Array} Recent reviews
   */
  async getSitterReviews(sitterId, limit = 5) {
    if (!sitterId) return [];

    return Review.find({ sitterId })
      .populate('familyId', 'householdName')
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();
  }

  /**
   * Auto-complete confirmed bookings whose date has already passed.
   * Called lazily from the bookings GET endpoints (there is no cron scheduler).
   * @returns {number} Number of bookings transitioned to completed
   */
  async autoCompletePastBookings() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const result = await BookingRequest.updateMany(
      { status: 'confirmed', date: { $lt: startOfToday } },
      { status: 'completed', completedAt: new Date() }
    );

    return result.modifiedCount || 0;
  }

  /**
   * Expire open/unconfirmed requests whose date has already passed.
   * Marks the request 'expired' and any still-interested responses 'not_selected'.
   * Called lazily from the jobs/requests GET endpoints (no cron scheduler).
   * @returns {number} Number of requests expired
   */
  async expirePastOpenRequests() {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const expiring = await BookingRequest.find(
      { status: { $in: ['open', 'responses_received'] }, date: { $lt: startOfToday } },
      { _id: 1 }
    );

    if (expiring.length === 0) return 0;

    const ids = expiring.map((r) => r._id);

    await BookingRequest.updateMany(
      { _id: { $in: ids } },
      { status: 'expired' }
    );

    await SitterResponse.updateMany(
      { requestId: { $in: ids }, status: 'interested' },
      { status: 'not_selected' }
    );

    return ids.length;
  }

  /**
   * Recompute a sitter's denormalized rating from their Review docs.
   * @param {ObjectId} sitterId - The sitter's profile ID
   */
  async recomputeSitterRating(sitterId) {
    const sitterObjectId = new mongoose.Types.ObjectId(sitterId);
    const stats = await Review.aggregate([
      { $match: { sitterId: sitterObjectId } },
      {
        $group: {
          _id: '$sitterId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    const { averageRating = 0, reviewCount = 0 } = stats[0] || {};

    await SitterProfile.findByIdAndUpdate(sitterId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount
    });
  }

  /**
   * Recompute a family's denormalized rating from their FamilyReview docs (reviews left by sitters).
   * @param {ObjectId} familyId - The family's profile ID
   */
  async recomputeFamilyRating(familyId) {
    const familyObjectId = new mongoose.Types.ObjectId(familyId);
    const stats = await FamilyReview.aggregate([
      { $match: { familyId: familyObjectId } },
      {
        $group: {
          _id: '$familyId',
          averageRating: { $avg: '$rating' },
          reviewCount: { $sum: 1 }
        }
      }
    ]);

    const { averageRating = 0, reviewCount = 0 } = stats[0] || {};

    await SittingFamilyProfile.findByIdAndUpdate(familyId, {
      averageRating: Math.round(averageRating * 10) / 10,
      reviewCount
    });
  }
}

const matchingService = new MatchingService();

export default matchingService;
export { areaMatchConditions, escapeRegex };
