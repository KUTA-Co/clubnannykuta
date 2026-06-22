import { useEffect, useState } from "react";
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

  const fetchCount = async () => {
    try {
      const res = await authFetch("/api/notifications/unread-count");
      const data = await res.json();
      if (data.success) setUnread(data.count);
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
    const t = setInterval(fetchCount, 60000);
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
    </>
  );
}

export default NotificationBell;
