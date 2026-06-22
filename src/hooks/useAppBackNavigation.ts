import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function useAppBackNavigation(rootPath: string) {
  const location = useLocation();
  const navigate = useNavigate();
  const storagePrefix = `club_nanny_app_history:${rootPath}`;
  const currentKey = `${storagePrefix}:current`;
  const backKey = `${storagePrefix}:back`;

  useEffect(() => {
    const current = `${location.pathname}${location.search}${location.hash}`;
    const previous = window.sessionStorage.getItem(currentKey);

    if (previous && previous !== current && previous.startsWith(rootPath)) {
      window.sessionStorage.setItem(backKey, previous);
    }

    window.sessionStorage.setItem(currentKey, current);
  }, [backKey, currentKey, location.hash, location.pathname, location.search, rootPath]);

  return () => {
    const current = `${location.pathname}${location.search}${location.hash}`;
    const previous = window.sessionStorage.getItem(backKey);

    if (previous && previous !== current && previous.startsWith(rootPath)) {
      navigate(previous);
      return;
    }

    navigate(rootPath);
  };
}
