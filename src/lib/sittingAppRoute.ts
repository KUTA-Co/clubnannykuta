const API_URL = import.meta.env.VITE_API_URL || "";

type SittingProfileResponse = {
  authenticated?: boolean;
  role?: "family" | "nanny" | "sitter" | "admin";
  hasSitterProfile?: boolean;
  hasFamilyProfile?: boolean;
  user?: {
    role?: "family" | "nanny" | "sitter" | "admin";
  };
};

export async function resolveSittingAppRoute(token: string | null) {
  if (!token) return "/sitting/login";

  let target = "/sitting/login";

  try {
    const response = await fetch(`${API_URL}/api/sitting/auth/check-profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = (await response.json()) as SittingProfileResponse;
    const role = data.role || data.user?.role;

    if (data.authenticated) {
      // The installed PWA is for sitters/families. It shares browser storage
      // with the website, so an admin token can exist on the same device; never
      // auto-launch that token into the admin dashboard from the app icon.
      if (role === "admin") target = "/sitting/login";
      else if (data.hasSitterProfile) target = "/sitting/sitter/jobs";
      else if (data.hasFamilyProfile) target = "/sitting/family";
    }
  } catch {
    // Keep the safe sign-in fallback if the profile check cannot complete.
  }

  return target;
}
