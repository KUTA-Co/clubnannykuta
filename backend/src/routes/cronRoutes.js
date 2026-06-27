import express from 'express';
import { BookingRequest, Review } from '../models/index.js';
import notificationService from '../services/notificationService.js';

const router = express.Router();

function authorizeCron(req, res, next) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return next();

  const authHeader = req.headers.authorization || '';
  if (authHeader !== `Bearer ${secret}`) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized cron request'
    });
  }

  return next();
}

function timeToMinutes(timeValue) {
  const [hours, minutes] = String(timeValue || '').split(':').map(Number);
  if ([hours, minutes].some((value) => Number.isNaN(value))) return null;
  return (hours * 60) + minutes;
}

function fallbackEndAt(booking) {
  if (booking.endAt) return booking.endAt;
  if (!booking.date || !booking.startTime || !booking.endTime) return null;

  const date = new Date(booking.date);
  if (Number.isNaN(date.getTime())) return null;

  const startMinutes = timeToMinutes(booking.startTime);
  let endMinutes = timeToMinutes(booking.endTime);
  if (startMinutes === null || endMinutes === null) return null;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;

  return new Date(Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    0,
    endMinutes,
    0,
    0
  ));
}

router.get('/review-reminders', authorizeCron, async (req, res) => {
  try {
    const now = new Date();
    const candidates = await BookingRequest.find({
      status: { $in: ['confirmed', 'completed'] },
      confirmedSitterId: { $exists: true, $ne: null },
      reviewReminderSentAt: null,
      $or: [
        { endAt: { $lte: now } },
        { endAt: { $exists: false }, date: { $lte: now } }
      ]
    })
      .limit(100)
      .populate('familyId')
      .populate('confirmedSitterId');

    let notified = 0;
    let completed = 0;
    let skipped = 0;

    for (const booking of candidates) {
      const endAt = fallbackEndAt(booking);
      if (!endAt || endAt > now) {
        skipped += 1;
        continue;
      }

      const existingReview = await Review.findOne({ bookingId: booking._id });
      if (existingReview) {
        booking.reviewReminderSentAt = now;
        await booking.save();
        skipped += 1;
        continue;
      }

      if (booking.status === 'confirmed') {
        booking.status = 'completed';
        booking.completedAt = booking.completedAt || now;
        completed += 1;
      }

      booking.endAt = booking.endAt || endAt;
      await booking.save();

      await notificationService.notifyFamilyReviewReminder(
        booking,
        booking.familyId,
        booking.confirmedSitterId
      );

      booking.reviewReminderSentAt = now;
      await booking.save();
      notified += 1;
    }

    res.json({
      success: true,
      checked: candidates.length,
      notified,
      completed,
      skipped
    });
  } catch (error) {
    console.error('Review reminder cron error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send review reminders'
    });
  }
});

export default router;
