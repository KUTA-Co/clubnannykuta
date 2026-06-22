/**
 * Secure authentication utilities
 * Provides AES-256 encrypted localStorage for sensitive data
 */

import CryptoJS from 'crypto-js';

// Encryption key - in production this should be a strong, unique key
// The key is derived from a base key + browser fingerprint for added security
const getEncryptionKey = (): string => {
  const baseKey = import.meta.env.VITE_ENCRYPTION_KEY || 'club-nanny-secure-key-2024';
  // Add some browser-specific entropy
  const browserEntropy = [
    navigator.userAgent.slice(0, 20),
    navigator.language,
    screen.width.toString(),
    screen.height.toString(),
  ].join('|');

  return CryptoJS.SHA256(baseKey + browserEntropy).toString();
};

/**
 * Encrypt data using AES-256
 */
export function encryptData(data: string): string {
  try {
    const key = getEncryptionKey();
    const encrypted = CryptoJS.AES.encrypt(data, key).toString();
    return encrypted;
  } catch {
    console.error('Encryption failed');
    return '';
  }
}

/**
 * Decrypt data using AES-256
 */
export function decryptData(encryptedData: string): string {
  try {
    const key = getEncryptionKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedData, key);
    const result = decrypted.toString(CryptoJS.enc.Utf8);
    return result;
  } catch {
    console.error('Decryption failed');
    return '';
  }
}

/**
 * Secure storage wrapper that encrypts data before storing in localStorage
 */
export const secureStorage = {
  setItem(key: string, value: string): void {
    try {
      const encrypted = encryptData(value);
      if (encrypted) {
        localStorage.setItem(key, encrypted);
      }
    } catch {
      console.error('secureStorage.setItem failed');
    }
  },

  getItem(key: string): string | null {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return null;

      // Check if data looks encrypted (starts with "U2F" which is base64 for "Sal" from "Salted__")
      if (stored.startsWith('U2F') || stored.startsWith('ey')) {
        // Looks encrypted or is a raw JWT, try to decrypt
        const decrypted = decryptData(stored);
        if (decrypted) {
          return decrypted;
        }
        // If decryption failed and it looks like a JWT, return as-is
        if (stored.startsWith('ey')) {
          return stored;
        }
        // Decryption failed on encrypted data - clear it
        localStorage.removeItem(key);
        return null;
      }

      // Not encrypted - could be old plain data, return as-is
      return stored;
    } catch {
      console.error('secureStorage.getItem failed');
      return null;
    }
  },

  removeItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch {
      console.error('secureStorage.removeItem failed');
    }
  },

  clear(): void {
    try {
      localStorage.clear();
    } catch {
      console.error('secureStorage.clear failed');
    }
  }
};

/**
 * Sanitize HTML input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

/**
 * Check if a token is expired (JWT format)
 */
export function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    return Date.now() >= exp;
  } catch {
    return true; // Treat invalid tokens as expired
  }
}

/**
 * Get time until token expires (in milliseconds)
 */
export function getTokenExpiryTime(token: string): number {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp * 1000;
    return Math.max(0, exp - Date.now());
  } catch {
    return 0;
  }
}

export default secureStorage;
