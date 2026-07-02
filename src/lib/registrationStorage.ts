export function saveRegistrationData(key: string, data: unknown) {
  const serialized = JSON.stringify(data);

  try {
    sessionStorage.setItem(key, serialized);
    return true;
  } catch (error) {
    console.warn(`Could not save ${key} to sessionStorage`, error);
    return false;
  }
}

export function getRegistrationData(key: string) {
  try {
    return sessionStorage.getItem(key);
  } catch (error) {
    console.warn(`Could not read ${key} from sessionStorage`, error);
    return null;
  }
}

export function clearRegistrationData(key: string) {
  try {
    sessionStorage.removeItem(key);
  } catch (error) {
    console.warn(`Could not clear ${key} from sessionStorage`, error);
  }

  try {
    // Remove any legacy drafts saved before registration storage became session-only.
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(`Could not clear legacy ${key} from localStorage`, error);
  }
}

type CheckoutData = {
  email?: string;
  sessionId?: string;
  checkoutUrl?: string;
  createdAt?: number;
};

const CHECKOUT_TTL_MS = 24 * 60 * 60 * 1000;

export function saveRegistrationCheckout(key: string, data: CheckoutData) {
  return saveRegistrationData(key, {
    ...data,
    createdAt: data.createdAt || Date.now(),
  });
}

export function getRegistrationCheckout(key: string, email?: string): CheckoutData | null {
  const saved = getRegistrationData(key);
  if (!saved) return null;

  try {
    const data = JSON.parse(saved) as CheckoutData;
    if (!data.sessionId || !data.checkoutUrl || !data.createdAt) return null;
    if (Date.now() - data.createdAt > CHECKOUT_TTL_MS) return null;
    if (email && data.email && data.email.toLowerCase() !== email.toLowerCase()) return null;
    return data;
  } catch (error) {
    console.warn(`Could not parse ${key}`, error);
    return null;
  }
}
