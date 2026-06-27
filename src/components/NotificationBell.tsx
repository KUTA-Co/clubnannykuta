import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthFetch } from "@/contexts/AuthContext";
import { Bell, Check } from "lucide-react";

interface NotificationItem {
  _id: string;
  type?: string;
  title: string;
  body?: string;
  link?: string;
  read: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  /** Icon color (e.g. white when placed on a colored header). Defaults to pink. */
  color?: string;
}

export function NotificationBell({ color = "#C77DA3" }: NotificationBellProps) {
  const authFetch = useAuthFetch();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [popup, setPopup] = useState<NotificationItem | null>(null);
  const unreadRef = useRef(0);
  const initializedRef = useRef(false);

  const playNotificationSound = () => {
    try {
      const AudioContextCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;

      const context = new AudioContextCtor();
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gain.gain.setValueAtTime(0.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.12, context.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.28);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.3);
      setTimeout(() => context.close().catch(() => undefined), 500);
    } catch {
      // Some browsers block audio until the user interacts with the page.
    }
  };

  const showLocalNotification = (notification: NotificationItem) => {
    setPopup(notification);
    playNotificationSound();

    if ("Notification" in window && Notification.permission === "granted") {
      try {
        const browserNotification = new Notification(notification.title || "Club Nanny", {
          body: notification.body || "You have a new notification",
          icon: "/icon-192.png"
        });
        browserNotification.onclick = () => {
          window.focus();
          if (notification.link) navigate(notification.link);
          browserNotification.close();
        };
      } catch {
        // Browser notifications are best-effort.
      }
    }

    window.setTimeout(() => setPopup((current) => current?._id === notification._id ? null : current), 6500);
  };

  const fetchCount = async () => {
    try {
      const res = await authFetch("/api/notifications/unread-count");
      const data = await res.json();
      if (data.success) {
        const nextCount = data.count || 0;
        const previousCount = unreadRef.current;
        setUnread(nextCount);
        unreadRef.current = nextCount;

        if (initializedRef.current && nextCount > previousCount) {
          const listRes = await authFetch("/api/notifications?limit=1");
          const listData = await listRes.json();
          const latest = listData.success ? listData.notifications?.[0] : null;
          if (latest) showLocalNotification(latest);
        }

        initializedRef.current = true;
      }
    } catch {
      // ignore
    }
  };

  const fetchList = async () => {
    try {
      const res = await authFetch("/api/notifications");
      const data = await res.json();
      if (data.success) setItems(data.notifications || []);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchCount();
    const t = setInterval(fetchCount, 15000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (next) fetchList();
  };

  const handleItem = async (n: NotificationItem) => {
    if (!n.read) {
      try {
        await authFetch(`/api/notifications/${n._id}/read`, { method: "PUT" });
      } catch {
        // ignore
      }
    }
    setOpen(false);
    fetchCount();
    if (n.link) navigate(n.link);
  };

  const markAll = async () => {
    try {
      await authFetch("/api/notifications/read-all", { method: "PUT" });
    } catch {
      // ignore
    }
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
  };

  const timeAgo = (s: string) => {
    const diff = Date.now() - new Date(s).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <>
      <button onClick={toggle} className="relative p-2 rounded-full hover:bg-black/5" aria-label="Notifications">
        <Bell className="w-5 h-5" style={{ color }} />
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Click-away backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          {/* Panel */}
          <div className="fixed top-16 right-4 w-80 max-w-[90vw] z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="font-semibold text-[#4A4A4A]">Notifications</p>
              {items.some((i) => !i.read) && (
                <button onClick={markAll} className="text-xs flex items-center gap-1" style={{ color }}>
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-10 text-center text-sm text-[#4A4A4A]/50">No notifications yet</div>
              ) : (
                items.map((n) => (
                  <button
                    key={n._id}
                    onClick={() => handleItem(n)}
                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50 ${n.read ? "" : "bg-[#F5D5E5]/20"}`}
                  >
                    <div className="flex items-start gap-2">
                      {!n.read && <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />}
                      <div className={n.read ? "pl-4" : ""}>
                        <p className="text-sm font-medium text-[#4A4A4A]">{n.title}</p>
                        {n.body && <p className="text-xs text-[#4A4A4A]/60 mt-0.5">{n.body}</p>}
                        <p className="text-[10px] text-[#4A4A4A]/40 mt-1">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {popup && (
        <button
          type="button"
          onClick={() => handleItem(popup)}
          className="fixed right-4 top-20 z-[60] w-80 max-w-[90vw] rounded-2xl border border-[#F5D5E5] bg-white p-4 text-left shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full p-2" style={{ backgroundColor: "#F5D5E5" }}>
              <Bell className="h-4 w-4" style={{ color }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-[#4A4A4A]">{popup.title}</p>
              {popup.body && <p className="mt-1 text-xs text-[#4A4A4A]/65">{popup.body}</p>}
            </div>
          </div>
        </button>
      )}
    </>
  );
}

export default NotificationBell;
