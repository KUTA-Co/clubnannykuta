import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuthFetch } from "@/contexts/AuthContext";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  Trash2
} from "lucide-react";

interface Application {
  _id: string;
  parentName: string;
  email: string;
  city?: string;
  state?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

interface Stats {
  total: number;
  registrationPaid: number;
  registrationPending: number;
}

export default function FamilyApplications() {
  const authFetch = useAuthFetch();
  const [searchParams, setSearchParams] = useSearchParams();

  const [applications, setApplications] = useState<Application[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");
  const [paymentFilter, setPaymentFilter] = useState(searchParams.get("payment") || "");
  const [stats, setStats] = useState<Stats>({
    total: 0,
    registrationPaid: 0,
    registrationPending: 0
  });
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchApplications = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      });

      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (paymentFilter) params.set("paymentStatus", paymentFilter);

      const response = await authFetch(`/api/admin/applications/family?${params}`);
      const data = await response.json();

      if (data.success) {
        setApplications(data.applications);
        setPagination(data.pagination);
        setSelectedIds([]);

        // Calculate stats from all applications
        const apps = data.applications as Application[];
        const newStats: Stats = {
          total: data.pagination?.total || apps.length,
          registrationPaid: apps.filter(a => a.paymentStatus === 'paid').length,
          registrationPending: apps.filter(a => a.paymentStatus !== 'paid').length
        };
        setStats(newStats);
      }
    } catch (error) {
      console.error("Fetch applications error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter) params.set("status", statusFilter);
    if (paymentFilter) params.set("payment", paymentFilter);
    setSearchParams(params);
    fetchApplications(1);
  };

  const handlePageChange = (page: number) => {
    fetchApplications(page);
  };

  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("");
    setPaymentFilter("");
    setSearchParams({});
    fetchApplications(1);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === applications.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applications.map(a => a._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await authFetch("/api/admin/applications/family/bulk-delete", {
        method: "POST",
        body: JSON.stringify({ ids: selectedIds })
      });
      const data = await response.json();
      if (data.success) {
        fetchApplications(pagination?.page || 1);
      }
    } catch (error) {
      console.error("Bulk delete error:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold font-heading text-[#1A1A1A]">Nanny Families</h1>
        <p className="text-gray-500 mt-1">Manage and review families seeking nanny services</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{stats.total}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.registrationPaid}</p>
              <p className="text-xs text-gray-500">Reg. Paid</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.registrationPending}</p>
              <p className="text-xs text-gray-500">Reg. Pending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Workflow Legend */}
      <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Nanny Family Application Workflow</p>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-amber-50 text-amber-700">
              <Clock className="w-3.5 h-3.5" />
              <span>$250 Pending</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>$250 Paid</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>Review & Approve</span>
            </div>
            <span className="text-gray-400">→</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-green-50 text-green-700">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Ready for Matching</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Search by name, email, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 h-11 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA99E] bg-white"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="reviewing">Reviewing</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="matched">Matched</option>
            <option value="inactive">No Longer Interested</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-2 h-11 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA99E] bg-white"
          >
            <option value="">All Payments</option>
            <option value="unpaid">Registration Unpaid</option>
            <option value="pending">Registration Pending</option>
            <option value="paid">Registration Paid</option>
          </select>

          <Button type="submit" className="bg-[#8BA99E] hover:bg-[#7a9a8d] h-11">
            <Filter className="w-4 h-4 mr-2" />
            Apply Filters
          </Button>

          {(search || statusFilter || paymentFilter) && (
            <Button type="button" variant="outline" onClick={handleClearFilters} className="h-11">
              Clear
            </Button>
          )}
        </form>
      </div>

      {/* Bulk Actions Banner */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center justify-between">
          <span className="text-red-800">
            {selectedIds.length} application{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Applications Table */}
      <ApplicationsTable
        applications={applications}
        type="family"
        pagination={pagination || undefined}
        onPageChange={handlePageChange}
        isLoading={isLoading}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
        onToggleSelectAll={toggleSelectAll}
      />

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete {selectedIds.length} application{selectedIds.length > 1 ? "s" : ""}? This will also delete any associated payment records. This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleBulkDelete}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
