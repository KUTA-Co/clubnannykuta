import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Extend Navigator for iOS Safari standalone detection
interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

// Extend Window for MSStream (IE detection)
interface WindowWithMSStream extends Window {
  MSStream?: unknown;
}

type InstallPromptState = {
  canShow: boolean;
  hasInstallPrompt: boolean;
  isInstalled: boolean;
  isIOS: boolean;
};

const subscribers = new Set<() => void>();
let installPrompt: BeforeInstallPromptEvent | null = null;
let isInstalled = false;
let isIOS = false;
let hasStartedListening = false;

function notifySubscribers() {
  subscribers.forEach((subscriber) => subscriber());
}

function detectStandalone() {
  if (typeof window === 'undefined') return false;

  return window.matchMedia('(display-mode: standalone)').matches
    || (window.navigator as NavigatorStandalone).standalone === true;
}

function detectIOS() {
  if (typeof window === 'undefined') return false;

  const userAgent = window.navigator.userAgent.toLowerCase();
  const isIPadDesktopMode = /macintosh/.test(userAgent) && window.navigator.maxTouchPoints > 1;

  return (/iphone|ipad|ipod/.test(userAgent) || isIPadDesktopMode)
    && !(window as WindowWithMSStream).MSStream;
}

function readInstallPromptState(): InstallPromptState {
  if (detectStandalone()) {
    isInstalled = true;
  }

  isIOS = detectIOS();

  return {
    canShow: (installPrompt !== null || isIOS) && !isInstalled,
    hasInstallPrompt: installPrompt !== null,
    isInstalled,
    isIOS,
  };
}

function startInstallPromptListener() {
  if (typeof window === 'undefined' || hasStartedListening) return;

  hasStartedListening = true;
  isInstalled = detectStandalone();
  isIOS = detectIOS();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event as BeforeInstallPromptEvent;
    notifySubscribers();
  });

  window.addEventListener('appinstalled', () => {
    isInstalled = true;
    installPrompt = null;
    notifySubscribers();
  });
}

startInstallPromptListener();

export function useInstallPrompt() {
  const [state, setState] = useState<InstallPromptState>(() => readInstallPromptState());

  useEffect(() => {
    startInstallPromptListener();

    const syncState = () => setState(readInstallPromptState());
    syncState();
    subscribers.add(syncState);

    return () => {
      subscribers.delete(syncState);
    };
  }, []);

  const promptInstall = useCallback(async () => {
    if (!installPrompt) return false;

    const promptEvent = installPrompt;

    try {
      await promptEvent.prompt();
      const { outcome } = await promptEvent.userChoice;
      installPrompt = null;

      if (outcome === 'accepted') {
        isInstalled = true;
        notifySubscribers();
        return true;
      }

      notifySubscribers();
      return false;
    } catch {
      installPrompt = null;
      notifySubscribers();
      return false;
    }
  }, []);

  const dismiss = useCallback(() => {
    // The banner component hides itself for the current page load only.
    // Do not persist dismissal so a fresh browser session can prompt again.
  }, []);

  return {
    canShow: state.canShow,
    hasInstallPrompt: state.hasInstallPrompt,
    isIOS: state.isIOS,
    isInstalled: state.isInstalled,
    promptInstall,
    dismiss,
  };
}
