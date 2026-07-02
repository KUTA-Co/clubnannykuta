import { Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import {
  LayoutDashboard,
  Users,
  Heart,
  CreditCard,
  MessageSquare,
  Baby,
  Home,
  LogOut,
  Settings
} from "lucide-react";

const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { path: "/admin/families", label: "Nanny Families", icon: Users },
  { path: "/admin/nannies", label: "Nanny Applications", icon: Heart },
  { path: "/admin/sitting-families", label: "Sitter Families", icon: Home },
  { path: "/admin/sitters", label: "Sitters", icon: Baby },
  { path: "/admin/payments", label: "Payments", icon: CreditCard },
  { path: "/admin/contacts", label: "Contact Messages", icon: MessageSquare },
  { path: "/admin/settings", label: "Settings", icon: Settings },
];

export function AdminSidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="w-64 h-screen p-3 fixed top-0 left-0">
      <div className="bg-[#1A1A1A] rounded-2xl h-full flex flex-col overflow-hidden">
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link to="/admin" className="flex items-center justify-center">
            <img src="/FinalLogo.jpg" alt="Club Nanny" className="h-12" />
          </Link>
          <p className="text-xs text-white/40 mt-2 text-center">Admin Portal</p>
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
                        ? "bg-[#8BA99E] text-white"
                        : "text-white/60 hover:bg-white/5 hover:text-white"
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
        <div className="p-4 border-t border-white/10">
          <div className="px-4 py-3 mb-2">
            <p className="text-sm font-medium text-white truncate">
              {user?.firstName || user?.email || "Admin"}
            </p>
            <p className="text-xs text-white/40">Administrator</p>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-white/60 hover:bg-white/5 hover:text-white transition-all"
          >
            <LogOut className="w-5 h-5" />
            <span className="text-sm">Sign Out</span>
          </button>
        </div>
      </div>
    </aside>
  );
}
