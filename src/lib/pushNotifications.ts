// Push notification utilities

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';
const API_URL = import.meta.env.VITE_API_URL || '';
let cachedVapidPublicKey: string | null = VAPID_PUBLIC_KEY || null;

// Read the stored auth token so subscriptions get associated with the logged-in user
function getAuthToken(): string | null {
  try {
    return localStorage.getItem('club_nanny_token');
  } catch {
    return null;
  }
}

// Convert base64 VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }
  return await Notification.requestPermission();
}

async function getVapidPublicKey(): Promise<string> {
  if (cachedVapidPublicKey) {
    return cachedVapidPublicKey;
  }

  const response = await fetch(`${API_URL}/api/push/vapid-public-key`);
  if (!response.ok) {
    throw new Error('Push notifications are not configured yet');
  }

  const data = await response.json();
  if (!data.success || !data.publicKey) {
    throw new Error(data.message || 'Push notifications are not configured yet');
  }

  cachedVapidPublicKey = data.publicKey;
  return cachedVapidPublicKey;
}

export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  try {
    const vapidPublicKey = await getVapidPublicKey();
    const registration = await navigator.serviceWorker.ready;

    // Check existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      await saveSubscriptionToServer(subscription);
      return subscription;
    }

    // Create new subscription
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    // Send subscription to server
    await saveSubscriptionToServer(subscription);

    return subscription;
  } catch (error) {
    console.error('Failed to subscribe to push:', error);
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      // Remove from server first
      await removeSubscriptionFromServer(subscription);
      // Then unsubscribe locally
      await subscription.unsubscribe();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Failed to unsubscribe from push:', error);
    return false;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    return await registration.pushManager.getSubscription();
  } catch {
    return null;
  }
}

async function saveSubscriptionToServer(subscription: PushSubscription): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/api/push/subscribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      subscription: subscription.toJSON(),
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to save subscription to server');
  }
}

async function removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
  const token = getAuthToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${API_URL}/api/push/unsubscribe`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      endpoint: subscription.endpoint,
    }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to remove subscription from server');
  }
}
