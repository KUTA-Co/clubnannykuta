interface NavigatorStandalone extends Navigator {
  standalone?: boolean;
}

export function isStandaloneApp() {
  if (typeof window === "undefined") return false;

  return window.matchMedia("(display-mode: standalone)").matches
    || (window.navigator as NavigatorStandalone).standalone === true;
}
