import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuthFetch } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Users, UserCheck, Clock, ChevronRight, Trash2, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Sitter {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  city: string;
  state: string;
  status: string;
  membershipStatus: string;
  averageRating?: number;
  reviewCount?: number;
  createdAt: string;
}

const statusStyles: Record<string, { bg: string; color: string }> = {
  active: { bg: "#D4EDDA", color: "#155724" },
  pending_approval: { bg: "#FFF3CD", color: "#856404" },
  pending_payment: { bg: "#FFF3CD", color: "#856404" },
  suspended: { bg: "#F8D7DA", color: "#721C24" },
  rejected: { bg: "#F8D7DA", color: "#721C24" },
};

export default function SittingSitters() {
  const authFetch = useAuthFetch();
  const { toast } = useToast();
  const [sitters, setSitters] = useState<Sitter[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0, pending: 0 });

  const fetchStats = async () => {
    try {
      const res = await authFetch(`/api/admin/sitting/stats`);
      const data = await res.json();
      if (data.success) setStats(data.stats.sitters);
    } catch (error) {
      console.error("Stats error:", error);
    }
  };

  const fetchSitters = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await authFetch(`/api/admin/sitting/sitters?${params}`);
      const data = await res.json();
      if (data.success) setSitters(data.sitters || []);
    } catch (error) {
      console.error("Fetch sitters error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchSitters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchSitters();
  };

  const removeSitter = async (sitter: Sitter) => {
    if (!confirm(`Remove ${sitter.firstName} ${sitter.lastName}? This will remove their sitter profile and app access.`)) return;

    setDeletingId(sitter._id);
    try {
      const res = await authFetch(`/api/admin/sitting/sitters/${sitter._id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to remove sitter");

      toast({ title: "Sitter Removed", description: `${sitter.firstName} ${sitter.lastName} has been removed.` });
      fetchSitters();
      fetchStats();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove sitter",
        variant: "destructive"
      });
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-[#1A1A1A]">Club Nanny — Sitters</h1>
        <p className="text-gray-500 mt-1">Review and approve sitter accounts</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Users, color: "text-gray-600", bg: "bg-gray-100" },
          { label: "Active", value: stats.active, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
          { label: "Pending Approval", value: stats.pending, icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by name, email, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 h-11 border border-gray-200 rounded-lg text-sm bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending_approval">Pending Approval</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
            <option value="rejected">Rejected</option>
            <option value="pending_payment">Pending Payment</option>
          </select>
          <Button type="submit" className="bg-[#8BA99E] hover:bg-[#7a9a8d] h-11">
            <Filter className="w-4 h-4 mr-2" /> Apply
          </Button>
        </form>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8BA99E]" />
        </div>
      ) : sitters.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          No sitters found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {sitters.map((s) => {
            const style = statusStyles[s.status] || { bg: "#EEE", color: "#555" };
            return (
              <div
                key={s._id}
                className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
              >
                <Link to={`/admin/sitters/${s._id}`} className="flex flex-1 items-center justify-between pr-4">
                  <div>
                    <p className="font-semibold text-[#1A1A1A]">{s.firstName} {s.lastName}</p>
                    <p className="text-sm text-gray-500">{s.email} • {s.city}, {s.state}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-gray-400">{formatDate(s.createdAt)}</span>
                    <span
                      className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                      style={{ backgroundColor: style.bg, color: style.color }}
                    >
                      {s.status.replace(/_/g, " ")}
                    </span>
                    <ChevronRight className="w-5 h-5 text-gray-300" />
                  </div>
                </Link>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => removeSitter(s)}
                  disabled={deletingId === s._id}
                  className="border-red-200 text-red-600 hover:bg-red-50"
                >
                  {deletingId === s._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
