import { useEffect, useState } from "react";
import { useAuthFetch } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Home, UserCheck, MapPin, Mail, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface SittingFamily {
  _id: string;
  householdName: string;
  email: string;
  phone?: string;
  city: string;
  state: string;
  numberOfChildren?: number;
  membershipStatus: string;
  status: string;
  createdAt: string;
}

const statusStyles: Record<string, { bg: string; color: string }> = {
  active: { bg: "#D4EDDA", color: "#155724" },
  pending_payment: { bg: "#FFF3CD", color: "#856404" },
  suspended: { bg: "#F8D7DA", color: "#721C24" },
};

export default function SittingFamilies() {
  const authFetch = useAuthFetch();
  const { toast } = useToast();
  const [families, setFamilies] = useState<SittingFamily[]>([]);
  const [loading, setLoading] = useState(true);
  const [sendingConfirmationId, setSendingConfirmationId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [stats, setStats] = useState({ total: 0, active: 0 });

  const fetchStats = async () => {
    try {
      const res = await authFetch(`/api/admin/sitting/stats`);
      const data = await res.json();
      if (data.success) setStats(data.stats.families);
    } catch (error) {
      console.error("Sitter family stats error:", error);
    }
  };

  const fetchFamilies = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "50" });
      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);

      const res = await authFetch(`/api/admin/sitting/families?${params}`);
      const data = await res.json();
      if (data.success) setFamilies(data.families || []);
    } catch (error) {
      console.error("Fetch sitter families error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchFamilies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFamilies();
  };

  const formatDate = (s: string) => new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  const sendConfirmationEmail = async (family: SittingFamily) => {
    setSendingConfirmationId(family._id);
    try {
      const res = await authFetch(`/api/admin/sitting/families/${family._id}/send-confirmation`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Confirmation Sent", description: `Confirmation email sent to ${family.householdName}` });
      } else {
        throw new Error(data.message);
      }
    } catch {
      toast({ title: "Error", description: "Failed to send confirmation email", variant: "destructive" });
    } finally {
      setSendingConfirmationId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-heading text-[#1A1A1A]">Sitter Families</h1>
        <p className="text-gray-500 mt-1">Families registered for sitter services and app membership</p>
      </div>

      <div className="grid grid-cols-2 gap-4 max-w-2xl">
        {[
          { label: "Total", value: stats.total, icon: Home, color: "text-gray-600", bg: "bg-gray-100" },
          { label: "Active", value: stats.active, icon: UserCheck, color: "text-green-600", bg: "bg-green-50" },
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[220px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search by household, email, or city..."
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
            <option value="active">Active</option>
            <option value="pending_payment">Pending Payment</option>
            <option value="suspended">Suspended</option>
          </select>
          <Button type="submit" className="bg-[#8BA99E] hover:bg-[#7a9a8d] h-11">
            <Filter className="w-4 h-4 mr-2" /> Apply
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8BA99E]" />
        </div>
      ) : families.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          No sitter families found.
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden divide-y divide-gray-100">
          {families.map((family) => {
            const style = statusStyles[family.status] || { bg: "#EEE", color: "#555" };
            return (
              <div key={family._id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                <div>
                  <p className="font-semibold text-[#1A1A1A]">{family.householdName}</p>
                  <p className="text-sm text-gray-500">{family.email}</p>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" />
                    {family.city}, {family.state}
                    {family.numberOfChildren ? ` • ${family.numberOfChildren} children` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400">{formatDate(family.createdAt)}</span>
                  <span
                    className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                    style={{ backgroundColor: style.bg, color: style.color }}
                  >
                    {family.status.replace(/_/g, " ")}
                  </span>
                  <span className="px-3 py-1 rounded-full text-xs font-medium capitalize bg-[#F5D5E5] text-[#9B5A80]">
                    {family.membershipStatus}
                  </span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => sendConfirmationEmail(family)}
                    disabled={sendingConfirmationId === family._id}
                    className="border-[#8BA99E] text-[#8BA99E] hover:bg-[#8BA99E]/10"
                  >
                    {sendingConfirmationId === family._id ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Mail className="w-4 h-4 mr-1" />}
                    Send Confirmation Email
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
