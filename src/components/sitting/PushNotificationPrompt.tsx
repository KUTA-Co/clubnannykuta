import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { usePushNotifications } from "@/hooks/usePushNotifications";

/**
 * Registers the logged-in user for web-push notifications.
 * - If permission is already granted, it re-subscribes silently on mount
 *   (this associates the subscription with the current user on the server).
 * - If permission hasn't been decided yet, it shows a small dismissible
 *   "Enable notifications" button (browsers require a user gesture to prompt).
 * - If unsupported or denied, it renders nothing.
 */
export function PushNotificationPrompt() {
  const { isSupported, permission, subscribe } = usePushNotifications();
  const [dismissed, setDismissed] = useState(false);

  // Silent re-subscribe when already granted
  useEffect(() => {
    if (isSupported && permission === "granted") {
      subscribe();
    }
  }, [isSupported, permission, subscribe]);

  if (!isSupported || permission !== "default" || dismissed) {
    return null;
  }

  return (
    <div className="mb-4 flex items-center justify-between gap-3 rounded-xl p-3" style={{ backgroundColor: "#F5D5E5" }}>
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5" style={{ color: "#C77DA3" }} />
        <p className="text-sm text-[#4A4A4A]">Get notified about new jobs and bookings</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => subscribe()}
          className="text-sm font-medium text-white px-3 py-1.5 rounded-full"
          style={{ backgroundColor: "#C77DA3" }}
        >
          Enable
        </button>
        <button onClick={() => setDismissed(true)} className="text-sm text-[#4A4A4A]/50">
          Not now
        </button>
      </div>
    </div>
  );
}

export default PushNotificationPrompt;
