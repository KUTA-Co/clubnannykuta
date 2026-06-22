import express from 'express';
import PushSubscription from '../models/PushSubscription.js';
import { sendPushToUser, sendPushToAll } from '../services/pushService.js';

const router = express.Router();

/**
 * POST /api/push/subscribe
 * Subscribe to push notifications
 */
router.post('/subscribe', async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription data',
      });
    }

    // Extract user ID from JWT if available (optional for anonymous subscriptions)
    let userId = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      try {
        const jwt = await import('jsonwebtoken');
        const token = authHeader.split(' ')[1];
        const decoded = jwt.default.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        // Token invalid or expired, proceed without user association
      }
    }

    // Upsert subscription
    await PushSubscription.findOneAndUpdate(
      { endpoint: subscription.endpoint },
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
        },
        userId,
        userAgent: req.headers['user-agent'],
        isActive: true,
      },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: 'Subscription saved successfully',
    });
  } catch (error) {
    console.error('Push subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save subscription',
    });
  }
});

/**
 * POST /api/push/unsubscribe
 * Unsubscribe from push notifications
 */
router.post('/unsubscribe', async (req, res) => {
  try {
    const { endpoint } = req.body;

    if (!endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Endpoint is required',
      });
    }

    await PushSubscription.findOneAndUpdate(
      { endpoint },
      { isActive: false }
    );

    res.json({
      success: true,
      message: 'Unsubscribed successfully',
    });
  } catch (error) {
    console.error('Push unsubscribe error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unsubscribe',
    });
  }
});

/**
 * POST /api/push/test
 * Send a test notification (for development/admin)
 */
router.post('/test', async (req, res) => {
  try {
    const { endpoint, userId, broadcast } = req.body;

    const payload = {
      title: 'Test Notification',
      body: 'This is a test push notification from Club Nanny.',
      url: '/',
      tag: 'test',
    };

    let result;

    if (broadcast) {
      // Admin only: send to all
      result = await sendPushToAll(payload);
    } else if (userId) {
      // Send to specific user
      result = await sendPushToUser(userId, payload);
    } else if (endpoint) {
      // Send to specific endpoint
      const subscription = await PushSubscription.findOne({ endpoint, isActive: true });
      if (!subscription) {
        return res.status(404).json({
          success: false,
          message: 'Subscription not found',
        });
      }
      const { sendPushNotification } = await import('../services/pushService.js');
      result = await sendPushNotification(subscription, payload);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Must provide endpoint, userId, or broadcast flag',
      });
    }

    res.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Push test error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send test notification',
    });
  }
});

/**
 * GET /api/push/vapid-public-key
 * Get the VAPID public key for client subscription
 */
router.get('/vapid-public-key', (req, res) => {
  const vapidPublicKey = process.env.VAPID_PUBLIC_KEY;

  if (!vapidPublicKey) {
    return res.status(503).json({
      success: false,
      message: 'Push notifications not configured',
    });
  }

  res.json({
    success: true,
    publicKey: vapidPublicKey,
  });
});

export default router;
