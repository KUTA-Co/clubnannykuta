import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  User,
  MessageCircle,
  Calendar,
  Star,
  Settings, 
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";

export function NannySidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/nanny-dashboard", label: "Dashboard", icon: LayoutDashboard },
    { path: "/nanny-dashboard/bookings", label: "Bookings", icon: Calendar },
    { path: "/nanny-dashboard/chat", label: "Messaging", icon: MessageCircle },
    { path: "/nanny-dashboard/reviews", label: "Reviews", icon: Star },
    { path: "/nanny-dashboard/profile", label: "My Profile", icon: User },
  ];

  const isActive = (path: string) => {
    if (path === "/nanny-dashboard") {
      return location.pathname === "/nanny-dashboard" || location.pathname === "/nanny-dashboard/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-[#8BA99E] h-[calc(100vh-16px)] fixed left-2 top-2 flex flex-col rounded-2xl shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-[#8BA99E]/50">
        <Link to="/nanny-dashboard" className="flex items-center gap-2">
          <img src="/clubnannynobg.png" alt="Club Nanny" className="h-8" />
        </Link>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-body text-sm",
                isActive(item.path)
                  ? "bg-[#4A4A4A] text-white font-medium"
                  : "text-[#4A4A4A]/70 hover:bg-white/50 hover:text-[#4A4A4A]"
              )}
            >
              <Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-[#8BA99E]/50 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-4 py-3 rounded-xl transition-colors font-body text-sm text-[#4A4A4A]/70 hover:bg-white/50 hover:text-[#4A4A4A] w-full"
        >
          <LogOut className="h-5 w-5" />
          Log out
        </Link>
      </div>
    </div>
  );
}
