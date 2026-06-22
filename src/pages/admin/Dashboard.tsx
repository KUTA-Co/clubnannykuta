import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthFetch } from "@/contexts/AuthContext";
import { StatCard } from "@/components/admin/StatCard";
import { StatusBadge } from "@/components/admin/StatusBadge";
import {
  Users,
  Heart,
  CreditCard,
  MessageSquare,
  ArrowRight
} from "lucide-react";

interface DashboardStats {
  familyApplications: { total: number; pending: number };
  nannyApplications: { total: number; pending: number };
  users: number;
  payments: { total: number; revenue: number; formattedRevenue: string };
  contacts: { new: number };
}

interface RecentApplication {
  _id: string;
  parentName?: string;
  fullName?: string;
  email: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

export default function Dashboard() {
  const authFetch = useAuthFetch();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentFamilies, setRecentFamilies] = useState<RecentApplication[]>([]);
  const [recentNannies, setRecentNannies] = useState<RecentApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await authFetch("/api/admin/dashboard/stats");
        const data = await response.json();

        if (data.success) {
          setStats(data.stats);
          setRecentFamilies(data.recentActivity.familyApplications);
          setRecentNannies(data.recentActivity.nannyApplications);
        }
      } catch (error) {
        console.error("Dashboard fetch error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit"
    });
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-gray-200 rounded-2xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold font-heading text-[#1A1A1A]">Dashboard</h1>
        <p className="text-gray-500 mt-1">Welcome to the Club Nanny admin portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Family Applications"
          value={stats?.familyApplications.total || 0}
          subtitle={`${stats?.familyApplications.pending || 0} pending`}
          icon={Users}
          color="sage"
        />
        <StatCard
          title="Nanny Applications"
          value={stats?.nannyApplications.total || 0}
          subtitle={`${stats?.nannyApplications.pending || 0} pending`}
          icon={Heart}
          color="dark"
        />
        <StatCard
          title="Total Revenue"
          value={stats?.payments.formattedRevenue || "$0"}
          subtitle={`${stats?.payments.total || 0} payments`}
          icon={CreditCard}
        />
        <StatCard
          title="Contact Messages"
          value={stats?.contacts.new || 0}
          subtitle="new inquiries"
          icon={MessageSquare}
        />
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Family Applications */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Recent Family Applications</h2>
            <Link
              to="/admin/families"
              className="text-sm text-[#8BA99E] hover:text-[#7a9a8d] flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentFamilies.length > 0 ? (
              recentFamilies.map((app) => (
                <Link
                  key={app._id}
                  to={`/admin/families/${app._id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{app.parentName}</p>
                    <p className="text-sm text-gray-500">{app.email}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={app.status} />
                    <p className="text-xs text-gray-400 mt-1">{formatDate(app.createdAt)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-6 py-8 text-center text-gray-500">No applications yet</p>
            )}
          </div>
        </div>

        {/* Recent Nanny Applications */}
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#1A1A1A]">Recent Nanny Applications</h2>
            <Link
              to="/admin/nannies"
              className="text-sm text-[#8BA99E] hover:text-[#7a9a8d] flex items-center gap-1"
            >
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {recentNannies.length > 0 ? (
              recentNannies.map((app) => (
                <Link
                  key={app._id}
                  to={`/admin/nannies/${app._id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
                >
                  <div>
                    <p className="font-medium text-gray-900">{app.fullName}</p>
                    <p className="text-sm text-gray-500">{app.email}</p>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={app.status} />
                    <p className="text-xs text-gray-400 mt-1">{formatDate(app.createdAt)}</p>
                  </div>
                </Link>
              ))
            ) : (
              <p className="px-6 py-8 text-center text-gray-500">No applications yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
