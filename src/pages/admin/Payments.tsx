import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthFetch } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronLeft,
  ChevronRight,
  DollarSign,
  RefreshCw,
  ExternalLink,
  CheckCircle,
  CheckCircle2,
  Clock,
  CreditCard,
  Trash2
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Payment {
  _id: string;
  stripeSessionId: string;
  stripePaymentIntentId?: string;
  paymentType?: string;
  applicationType: string;
  applicationId: string;
  applicantEmail: string;
  applicantName?: string;
  amount: number;
  currency: string;
  status: string;
  completedAt?: string;
  createdAt: string;
  isDerived?: boolean;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

type TabType = 'all' | 'completed' | 'pending';

export default function Payments() {
  const authFetch = useAuthFetch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]); // For accurate counts
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('all');

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);

  // Action states
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [markingCompleteId, setMarkingCompleteId] = useState<string | null>(null);

  // Fetch all payments once for accurate tab counts
  const fetchAllPaymentsForCounts = async () => {
    try {
      const response = await authFetch(`/api/admin/payments?limit=1000`);
      const data = await response.json();
      if (data.success) {
        setAllPayments(data.payments);
      }
    } catch (error) {
      console.error("Fetch all payments error:", error);
    }
  };

  const fetchPayments = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      });

      // Apply tab filters
      if (activeTab === 'completed') {
        params.set("status", "completed");
      } else if (activeTab === 'pending') {
        params.set("status", "pending");
      }

      const response = await authFetch(`/api/admin/payments?${params}`);
      const data = await response.json();

      if (data.success) {
        setPayments(data.payments);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error("Fetch payments error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch all payments on mount for accurate counts
  useEffect(() => {
    fetchAllPaymentsForCounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    fetchPayments();
    setSelectedIds(new Set()); // Clear selection when tab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatAmount = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const getPaymentTypeLabel = (payment: Payment) => {
    switch (payment.applicationType) {
      case 'family':
        return 'Nanny Family Application';
      case 'nanny':
        return 'Nanny Application';
      case 'sitter':
        return 'Sitter Application + Membership';
      case 'sitting_family':
        return 'Sitter Family Membership';
      default:
        return 'Payment';
    }
  };

  const getPaymentTypeIcon = () => {
    return <CreditCard className="w-4 h-4" />;
  };

  const getPaymentTypeBadgeStyle = (payment: Payment) => {
    switch (payment.applicationType) {
      case 'family':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'nanny':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'sitter':
        return 'bg-pink-50 text-pink-700 border border-pink-200';
      case 'sitting_family':
        return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const getPaymentApplicationPath = (payment: Payment) => {
    switch (payment.applicationType) {
      case 'family':
        return `/admin/families/${payment.applicationId}`;
      case 'nanny':
        return `/admin/nannies/${payment.applicationId}`;
      case 'sitter':
        return `/admin/sitters/${payment.applicationId}`;
      case 'sitting_family':
        return `/admin/sitting-families`;
      default:
        return null;
    }
  };

  const verifyPayment = async (payment: Payment) => {
    setVerifyingId(payment._id);
    try {
      const response = await authFetch(`/api/admin/verify-placement-fee/${payment._id}`, {
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: data.paymentStatus === 'completed' ? "Payment Verified" : "Payment Status",
          description: data.message,
        });
        fetchPayments(pagination?.page || 1);
        fetchAllPaymentsForCounts(); // Refresh counts
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Verify payment error:", error);
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive",
      });
    } finally {
      setVerifyingId(null);
    }
  };

  const markAsComplete = async (payment: Payment) => {
    setMarkingCompleteId(payment._id);
    try {
      const response = await authFetch(`/api/admin/mark-payment-complete/${payment._id}`, {
        method: "POST",
        body: JSON.stringify({
          notes: "Manually marked as complete by admin"
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Payment Updated",
          description: "Payment marked as complete",
        });
        fetchPayments(pagination?.page || 1);
        fetchAllPaymentsForCounts(); // Refresh counts
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Mark complete error:", error);
      toast({
        title: "Error",
        description: "Failed to mark payment as complete",
        variant: "destructive",
      });
    } finally {
      setMarkingCompleteId(null);
    }
  };

  // Multi-select functions
  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === payments.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(payments.map(p => p._id)));
    }
  };

  const deleteSelected = async () => {
    if (selectedIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedIds.size} payment record(s)? This cannot be undone.`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await authFetch('/api/admin/payments/bulk-delete', {
        method: "POST",
        body: JSON.stringify({ ids: Array.from(selectedIds) })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Payments Deleted",
          description: data.message,
        });
        setSelectedIds(new Set());
        fetchPayments(pagination?.page || 1);
        fetchAllPaymentsForCounts(); // Refresh counts
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Error",
        description: "Failed to delete payments",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  // Calculate stats from ALL payments (always shows overall totals)
  const allCompletedPayments = allPayments.filter(p => p.status === "completed");
  const allPendingPayments = allPayments.filter(p => p.status === "pending");
  const totalRevenue = allCompletedPayments.reduce((sum, p) => sum + p.amount, 0);

  const tabs: { key: TabType; label: string; count?: number }[] = [
    { key: 'all', label: 'All Payments', count: allPayments.length },
    { key: 'completed', label: 'Paid', count: allCompletedPayments.length },
    { key: 'pending', label: 'Pending', count: allPendingPayments.length },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-[#1A1A1A]">Payments</h1>
          <p className="text-gray-500 mt-1">Track all payment transactions and invoices</p>
        </div>
        <Button
          variant="outline"
          onClick={() => fetchPayments(pagination?.page || 1)}
          disabled={isLoading}
          className="border-gray-200"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="bg-gradient-to-br from-[#8BA99E] to-[#7a9a8d] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <p className="text-white/80 text-sm mb-1">Total Revenue</p>
          <p className="text-3xl font-bold">{formatAmount(totalRevenue)}</p>
        </div>

        {/* Completed */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-1">Completed Payments</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{allCompletedPayments.length}</p>
        </div>

        {/* Pending */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-1">Pending Payments</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{allPendingPayments.length}</p>
        </div>

        {/* Total Payments */}
        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-500 text-sm mb-1">Total Payments</p>
          <p className="text-2xl font-bold text-[#1A1A1A]">{allPayments.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="border-b border-gray-100">
          <div className="flex items-center">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.key
                    ? 'border-[#8BA99E] text-[#8BA99E]'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.key
                      ? 'bg-[#8BA99E]/10 text-[#8BA99E]'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-[#8BA99E]/5 border-b border-[#8BA99E]/20 px-6 py-3 flex items-center justify-between">
            <span className="text-sm text-[#8BA99E] font-medium">
              {selectedIds.size} payment{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedIds(new Set())}
                className="text-gray-500"
              >
                Clear Selection
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={deleteSelected}
                disabled={isDeleting}
                className="bg-red-500 hover:bg-red-600"
              >
                {isDeleting ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Delete Selected
              </Button>
            </div>
          </div>
        )}

        {/* Table */}
        {isLoading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 text-gray-300 animate-spin mx-auto mb-3" />
            <p className="text-gray-500">Loading payments...</p>
          </div>
        ) : payments.length === 0 ? (
          <div className="p-12 text-center">
            <CreditCard className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No payments found</p>
            <p className="text-gray-400 text-sm mt-1">Try a different filter</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="text-left px-6 py-4 w-12">
                      <Checkbox
                        checked={selectedIds.size === payments.length && payments.length > 0}
                        onCheckedChange={toggleSelectAll}
                      />
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Fee Type
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="text-left px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="text-right px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {payments.map((payment) => (
                    <tr
                      key={payment._id}
                      className={`hover:bg-gray-50/50 transition-colors ${
                        selectedIds.has(payment._id) ? 'bg-[#8BA99E]/5' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <Checkbox
                          checked={selectedIds.has(payment._id)}
                          onCheckedChange={() => toggleSelect(payment._id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                            payment.applicationType === "family"
                              ? "bg-blue-100 text-blue-600"
                              : "bg-purple-100 text-purple-600"
                          }`}>
                            {payment.applicantName?.charAt(0) || "?"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {payment.applicantName || "Unknown"}
                            </p>
                            <p className="text-sm text-gray-500">{payment.applicantEmail}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${getPaymentTypeBadgeStyle(payment)}`}>
                          {getPaymentTypeIcon()}
                          {getPaymentTypeLabel(payment)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900 text-lg">{formatAmount(payment.amount)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={payment.status} type="payment" />
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm font-medium text-gray-900">{formatDate(payment.completedAt || payment.createdAt)}</p>
                        <p className="text-xs text-gray-400">{formatTime(payment.completedAt || payment.createdAt)}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <TooltipProvider delayDuration={100}>
                            {/* View Application */}
                            {getPaymentApplicationPath(payment) && (
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => navigate(getPaymentApplicationPath(payment)!)}
                                    className="text-gray-500 hover:text-[#8BA99E] hover:bg-[#8BA99E]/10"
                                  >
                                    <ExternalLink className="w-4 h-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent side="top" className="bg-[#1A1A1A] text-white border-0">
                                  <p>View application</p>
                                </TooltipContent>
                              </Tooltip>
                            )}

                            {/* Pending payment actions */}
                            {payment.status === 'pending' && !payment.isDerived && (
                              <>
                                {/* Verify with Stripe */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => verifyPayment(payment)}
                                      disabled={verifyingId === payment._id}
                                      className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                    >
                                      {verifyingId === payment._id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <RefreshCw className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-[#1A1A1A] text-white border-0">
                                    <p>Verify payment with Stripe</p>
                                  </TooltipContent>
                                </Tooltip>

                                {/* Mark as Complete */}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => markAsComplete(payment)}
                                      disabled={markingCompleteId === payment._id}
                                      className="text-gray-500 hover:text-green-600 hover:bg-green-50"
                                    >
                                      {markingCompleteId === payment._id ? (
                                        <RefreshCw className="w-4 h-4 animate-spin" />
                                      ) : (
                                        <CheckCircle2 className="w-4 h-4" />
                                      )}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="bg-[#1A1A1A] text-white border-0">
                                    <p>Mark as complete (manual)</p>
                                  </TooltipContent>
                                </Tooltip>
                              </>
                            )}

                          </TooltipProvider>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing <span className="font-medium text-gray-700">{((pagination.page - 1) * pagination.limit) + 1}</span> to{" "}
                  <span className="font-medium text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
                  <span className="font-medium text-gray-700">{pagination.total}</span> payments
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPayments(pagination.page - 1)}
                    disabled={pagination.page === 1}
                    className="border-gray-200"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                      const pageNum = i + 1;
                      return (
                        <button
                          key={pageNum}
                          onClick={() => fetchPayments(pageNum)}
                          className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                            pagination.page === pageNum
                              ? 'bg-[#8BA99E] text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchPayments(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                    className="border-gray-200"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

    </div>
  );
}
