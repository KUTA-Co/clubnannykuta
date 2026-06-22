import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PushNotificationPrompt } from "@/components/sitting/PushNotificationPrompt";
import { NotificationBell } from "@/components/NotificationBell";
import {
  LayoutDashboard,
  Home,
  User,
  PlusCircle,
  List,
  Clock,
  LogOut
} from "lucide-react";

const navItems = [
  { path: "/sitting/family", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/sitting/family/profile", label: "My Household", icon: Home },
  { path: "/sitting/family/request", label: "New Request", icon: PlusCircle },
  { path: "/sitting/family/requests", label: "My Requests", icon: List },
  { path: "/sitting/family/bookings", label: "Bookings", icon: Clock },
];

// Mobile bottom nav items
const mobileNavItems = [
  { path: "/sitting/family", label: "Home", icon: LayoutDashboard, exact: true },
  { path: "/sitting/family/requests", label: "Requests", icon: List },
  { path: "/sitting/family/request", label: "Post", icon: PlusCircle, isCenter: true },
  { path: "/sitting/family/bookings", label: "Bookings", icon: Clock },
  { path: "/sitting/family/profile", label: "Profile", icon: Home },
];

export function FamilyDashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#FAF9F6]">
      {/* Desktop Sidebar - Hidden on mobile */}
      <aside className="hidden lg:block w-64 h-screen p-3 fixed top-0 left-0 z-50">
        <div className="rounded-2xl h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#9B5A80' }}>
          {/* Logo */}
          <div className="p-6 border-b border-white/20 relative">
            <div className="absolute top-3 right-3">
              <NotificationBell color="white" />
            </div>
            <Link to="/sitting/family" className="flex items-center justify-center">
              <img src="/clubnannynobg.png" alt="Club Nanny" className="h-12" />
            </Link>
            <p className="text-xs text-white/60 mt-2 text-center">Family Dashboard</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path, item.exact);

                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        active
                          ? "bg-white text-[#C77DA3]"
                          : "text-white/80 hover:bg-white/10 hover:text-white"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User Info & Actions */}
          <div className="p-4 border-t border-white/20">
            <div className="px-4 py-3 mb-2">
              <p className="text-sm font-medium text-white truncate">
                {user?.firstName || user?.email || "Family"}
              </p>
              <p className="text-xs text-white/60">Family Account</p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/80 hover:bg-white/10 hover:text-white transition-all"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Layout */}
      <div className="lg:hidden min-h-screen flex flex-col bg-white">
        {/* Mobile Header - Clean white */}
        <header className="px-4 pt-3 pb-3 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div className="w-9 h-9" aria-hidden="true" />

            {/* Logo centered */}
            <img src="/clubnannynobg.png" alt="Club Nanny" className="h-8" />

            {/* Bell + profile */}
            <div className="flex items-center gap-1">
              <NotificationBell />
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Sign out"
                title="Sign out"
                className="w-9 h-9 rounded-full flex items-center justify-center text-[#C77DA3] transition-colors hover:bg-[#F5D5E5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C77DA3] focus-visible:ring-offset-2"
              >
                <LogOut className="w-4 h-4" />
              </button>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm"
                style={{ backgroundColor: '#C77DA3' }}
              >
                <User className="w-4 h-4" aria-hidden="true" />
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 px-4 pt-4 pb-28 overflow-auto bg-[#FAF9F6]">
          <PushNotificationPrompt />
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation - Fixed */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          <div className="flex items-center justify-around py-2 px-2">
            {mobileNavItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path, item.exact);

              // Center floating button for "Post"
              if (item.isCenter) {
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="flex flex-col items-center -mt-5"
                  >
                    <div
                      className="p-3 rounded-full shadow-lg"
                      style={{ backgroundColor: '#C77DA3' }}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <span
                      className="text-[10px] font-medium mt-1"
                      style={{ color: '#C77DA3' }}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              }

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="flex flex-col items-center gap-1 px-3 py-1"
                >
                  <div
                    className="p-2 rounded-xl transition-all"
                    style={{ backgroundColor: active ? '#C77DA3' : 'transparent' }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{ color: active ? 'white' : '#9CA3AF' }}
                    />
                  </div>
                  <span
                    className="text-[10px] font-medium"
                    style={{ color: active ? '#C77DA3' : '#9CA3AF' }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
          {/* Safe area for iPhone */}
          <div style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}></div>
        </nav>
      </div>

      {/* Desktop Main Content */}
      <main className="hidden lg:block lg:ml-64 min-h-screen overflow-auto p-1.5">
        <div className="bg-white rounded-xl min-h-full p-5">
          <PushNotificationPrompt />
          <Outlet />
        </div>
      </main>
    </div>
  );
}

export default FamilyDashboardLayout;
