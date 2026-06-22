/**
 * Google Analytics 4 Utility Functions
 *
 * Usage:
 * - Page views are tracked automatically via usePageTracking() hook in App.tsx
 * - Call trackEvent() for custom events (form submissions, sign ups, etc.)
 *
 * Setup:
 * 1. Add VITE_GA4_MEASUREMENT_ID=G-XXXXXXXXXX to your .env file
 * 2. Deploy - data starts flowing automatically
 */

// Type declaration for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_MEASUREMENT_ID = import.meta.env.VITE_GA4_MEASUREMENT_ID;

let isInitialized = false;

/**
 * Initialize Google Analytics 4
 * Called once on app load
 */
export function initGA4(): void {
  if (isInitialized || !GA_MEASUREMENT_ID) {
    if (!GA_MEASUREMENT_ID) {
      console.log('[Analytics] GA4 disabled - no VITE_GA4_MEASUREMENT_ID set');
    }
    return;
  }

  // Load gtag.js script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize dataLayer and gtag function
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };

  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID);

  isInitialized = true;
}

/**
 * Track a page view (called automatically on route changes)
 */
export function trackPageView(path: string, title?: string): void {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', 'page_view', {
    page_path: path,
    page_title: title || document.title,
  });
}

/**
 * Track a custom event
 *
 * @param eventName - Name of the event (e.g., 'form_submit', 'sign_up')
 * @param params - Optional event parameters
 */
export function trackEvent(
  eventName: string,
  params?: Record<string, string | number | boolean>
): void {
  if (typeof window.gtag !== 'function') return;

  window.gtag('event', eventName, params);
}

// ============================================
// Pre-defined Event Tracking Functions
// ============================================

/**
 * Track form submission
 */
export function trackFormSubmit(formType: 'contact' | 'family_application' | 'nanny_application'): void {
  trackEvent('form_submit', {
    form_type: formType,
  });

  // Also track as a conversion
  trackEvent('generate_lead', {
    lead_type: formType,
  });
}

/**
 * Track user registration
 */
export function trackSignUp(userType: 'family' | 'nanny'): void {
  trackEvent('sign_up', {
    method: 'email',
    user_type: userType,
  });
}

/**
 * Track user login
 */
export function trackLogin(userType: 'family' | 'nanny' | 'admin'): void {
  trackEvent('login', {
    method: 'email',
    user_type: userType,
  });
}

/**
 * Track when a user views a nanny profile
 */
export function trackNannyProfileView(nannyId: string): void {
  trackEvent('view_item', {
    item_id: nannyId,
    item_category: 'nanny_profile',
  });
}

/**
 * Track when a user favorites a nanny
 */
export function trackFavorite(nannyId: string): void {
  trackEvent('add_to_wishlist', {
    item_id: nannyId,
    item_category: 'nanny_profile',
  });
}

/**
 * Track when a family sends a message
 */
export function trackMessageSent(conversationId: string): void {
  trackEvent('message_sent', {
    conversation_id: conversationId,
  });
}

/**
 * Track external link clicks (e.g., social media)
 */
export function trackOutboundLink(url: string, linkText?: string): void {
  trackEvent('click', {
    link_url: url,
    link_text: linkText || '',
    outbound: true,
  });
}
