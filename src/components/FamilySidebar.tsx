import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  Search, 
  MessageCircle, 
  Calendar, 
  Star, 
  User,
  Sparkles,
  Megaphone,
  Wallet,
  LogOut 
} from "lucide-react";
import { cn } from "@/lib/utils";

export function FamilySidebar() {
  const location = useLocation();

  const navItems = [
    { path: "/home", label: "Dashboard", icon: LayoutDashboard },
    { path: "/find-nannies", label: "Search Nannies", icon: Search },
    { path: "/chat", label: "Messaging", icon: MessageCircle },
    { path: "/bookings", label: "Bookings", icon: Calendar },
    { path: "/wallet", label: "Wallet", icon: Wallet },
    { path: "/reviews", label: "Reviews", icon: Star },
    { path: "/promotions", label: "Promotions", icon: Megaphone },
    { path: "/profile", label: "Profile", icon: User },
    { path: "/ai-tools", label: "AI Tools", icon: Sparkles },
  ];

  const isActive = (path: string) => {
    if (path === "/home") {
      return location.pathname === "/home" || location.pathname === "/";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="w-64 bg-[#8BA99E] h-[calc(100vh-16px)] fixed left-2 top-2 flex flex-col rounded-2xl shadow-lg">
      {/* Logo */}
      <div className="p-6 border-b border-[#8BA99E]/50">
        <Link to="/home" className="flex items-center gap-2">
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
      <div className="p-4 border-t border-[#8BA99E]/50">
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
