import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Globe, Bell, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function NannyNavigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navTabs = [
    { path: "/nanny-dashboard", label: "Overview", icon: null },
    { path: "/nanny-dashboard/points", label: "Club Points", icon: null },
    { path: "/nanny-dashboard/bookings", label: "Bookings", icon: null },
    { path: "/nanny-dashboard/reviews", label: "Reviews", icon: null },
    { path: "/nanny-dashboard/business", label: "Business", icon: null },
    { path: "/nanny-dashboard/clients", label: "Clients", icon: null },
    { path: "/nanny-dashboard/events", label: "Events", icon: null },
    { path: "/nanny-dashboard/subscriptions", label: "Subscriptions", icon: null },
    { path: "/nanny-dashboard/profile", label: "Profile", icon: null },
  ];

  return (
    <div className="bg-white border-b">
      {/* Top Navigation Bar */}
      <nav className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Logo and Role */}
            <div className="flex items-center gap-4">
              <Link to="/nanny-dashboard">
                <img src="/clubnannynobg.png" alt="Club Nanny" className="h-8" />
              </Link>
              <Badge variant="secondary" className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full">
                Nanny
              </Badge>
            </div>

            {/* Right Side - Icons and Sign Out */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                <BookOpen className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900">
                <Globe className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
              </Button>
              <Button variant="ghost" size="icon" className="text-gray-600 hover:text-gray-900 relative">
                <Settings className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-blue-600 rounded-full"></span>
              </Button>
              <Button 
                variant="default" 
                className="bg-blue-600 hover:bg-blue-700 text-white"
                asChild
              >
                <Link to="/">
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Navigation Tabs */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-6">
          <div className="flex items-center gap-1 overflow-x-auto">
            {navTabs.map((tab) => (
              <Link
                key={tab.path}
                to={tab.path}
                className={cn(
                  "px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
                  isActive(tab.path)
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
                )}
              >
                {tab.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

