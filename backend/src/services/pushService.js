import webpush from 'web-push';
import dotenv from 'dotenv';
import PushSubscription from '../models/PushSubscription.js';

// Load environment variables (needed for ES module)
dotenv.config();

// Configure web-push with VAPID keys
const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidSubject = process.env.VAPID_SUBJECT || 'mailto:support@clubnanny.com';

let pushEnabled = false;
if (vapidPublicKey && vapidPrivateKey) {
  try {
    webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);
    pushEnabled = true;
  } catch (err) {
    console.warn('Invalid VAPID keys — push disabled:', err.message);
  }
}

/**
 * Send push notification to a single subscription
 */
export async function sendPushNotification(subscription, payload) {
  if (!pushEnabled) {
    console.warn('VAPID keys not configured, skipping push notification');
    return { success: false, error: 'VAPID not configured' };
  }

  const pushSubscription = {
    endpoint: subscription.endpoint,
    keys: subscription.keys,
  };

  const payloadString = JSON.stringify(payload);

  try {
    await webpush.sendNotification(pushSubscription, payloadString);
    return { success: true };
  } catch (error) {
    // If subscription is no longer valid, mark it as inactive
    if (error.statusCode === 410 || error.statusCode === 404) {
      await PushSubscription.findOneAndUpdate(
        { endpoint: subscription.endpoint },
        { isActive: false }
      );
      return { success: false, error: 'Subscription expired', expired: true };
    }
    console.error('Push notification error:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send push notification to a user (all their subscriptions)
 */
export async function sendPushToUser(userId, payload) {
  const subscriptions = await PushSubscription.find({
    userId,
    isActive: true,
  });

  const results = await Promise.all(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  return {
    total: subscriptions.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  };
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(userIds, payload) {
  const subscriptions = await PushSubscription.find({
    userId: { $in: userIds },
    isActive: true,
  });

  const results = await Promise.all(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  return {
    total: subscriptions.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  };
}

/**
 * Send push notification to all active subscriptions (admin broadcast)
 */
export async function sendPushToAll(payload) {
  const subscriptions = await PushSubscription.find({ isActive: true });

  const results = await Promise.all(
    subscriptions.map((sub) => sendPushNotification(sub, payload))
  );

  return {
    total: subscriptions.length,
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  };
}

/**
 * Clean up expired/invalid subscriptions
 */
export async function cleanupExpiredSubscriptions() {
  const result = await PushSubscription.deleteMany({ isActive: false });
  return { deleted: result.deletedCount };
}

export default {
  sendPushNotification,
  sendPushToUser,
  sendPushToUsers,
  sendPushToAll,
  cleanupExpiredSubscriptions,
};
