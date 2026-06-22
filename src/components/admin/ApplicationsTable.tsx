import { Link } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import {
  Eye,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Application {
  _id: string;
  parentName?: string;
  fullName?: string;
  email: string;
  city?: string;
  state?: string;
  status: string;
  paymentStatus: string;
  createdAt: string;
}

interface ApplicationsTableProps {
  applications: Application[];
  type: "family" | "nanny";
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  onPageChange?: (page: number) => void;
  isLoading?: boolean;
  selectedIds?: string[];
  onToggleSelect?: (id: string) => void;
  onToggleSelectAll?: () => void;
}

export function ApplicationsTable({
  applications,
  type,
  pagination,
  onPageChange,
  isLoading,
  selectedIds,
  onToggleSelect,
  onToggleSelectAll
}: ApplicationsTableProps) {
  const hasSelection = selectedIds !== undefined && onToggleSelect !== undefined && onToggleSelectAll !== undefined;
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });
  };

  // Determine next action for an application
  const getNextAction = (app: Application): { label: string; color: string; urgent: boolean } => {
    // Registration fee not paid
    if (app.paymentStatus !== 'paid') {
      return { label: 'Awaiting Registration Fee', color: 'amber', urgent: true };
    }

    // Check application status
    if (app.status === 'pending') {
      return { label: 'Needs Review', color: 'blue', urgent: false };
    }
    if (app.status === 'reviewing') {
      return { label: 'Under Review', color: 'blue', urgent: false };
    }
    if (app.status === 'approved') {
      return { label: 'Ready for Matching', color: 'green', urgent: false };
    }
    if (app.status === 'matched') {
      return { label: 'Matched', color: 'green', urgent: false };
    }
    if (app.status === 'rejected') {
      return { label: 'Rejected', color: 'gray', urgent: false };
    }
    if (app.status === 'inactive') {
      return { label: 'No Longer Interested', color: 'gray', urgent: false };
    }

    return { label: 'Complete', color: 'gray', urgent: false };
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 text-center text-gray-500">
          <div className="animate-pulse flex flex-col items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
            <div className="h-4 bg-gray-200 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500 font-medium">No applications found</p>
          <p className="text-sm text-gray-400 mt-1">Try adjusting your filters</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50/80 border-b border-gray-100">
                {hasSelection && (
                  <th className="w-12 px-4 py-4">
                    <Checkbox
                      checked={selectedIds.length === applications.length && applications.length > 0}
                      onCheckedChange={onToggleSelectAll}
                    />
                  </th>
                )}
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Applicant
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Location
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Application Status
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Payment Progress
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Next Action
                </th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Applied
                </th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {applications.map((app) => {
                const nextAction = getNextAction(app);

                return (
                  <tr key={app._id} className="hover:bg-gray-50/50 transition-colors group">
                    {/* Checkbox */}
                    {hasSelection && (
                      <td className="w-12 px-4 py-4">
                        <Checkbox
                          checked={selectedIds.includes(app._id)}
                          onCheckedChange={() => onToggleSelect(app._id)}
                        />
                      </td>
                    )}
                    {/* Applicant */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8BA99E] to-[#6b8a7e] flex items-center justify-center text-white text-sm font-medium flex-shrink-0">
                          {(type === "family" ? app.parentName : app.fullName)?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {type === "family" ? app.parentName : app.fullName}
                          </p>
                          <p className="text-sm text-gray-500 truncate">{app.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Location */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {app.city && app.state ? `${app.city}, ${app.state}` : "—"}
                      </p>
                    </td>

                    {/* Application Status */}
                    <td className="px-6 py-4">
                      <StatusBadge status={app.status} />
                    </td>

                    {/* Payment Progress */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {/* Registration Fee */}
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium ${
                              app.paymentStatus === 'paid'
                                ? 'bg-green-50 text-green-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}>
                              {app.paymentStatus === 'paid' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Circle className="w-3.5 h-3.5" />
                              )}
                              <span>{type === 'family' ? '$250' : '$75'}</span>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Registration Fee: {app.paymentStatus === 'paid' ? 'Paid' : 'Pending'}</p>
                          </TooltipContent>
                        </Tooltip>

                      </div>
                    </td>

                    {/* Next Action */}
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                        nextAction.color === 'amber'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : nextAction.color === 'green'
                          ? 'bg-green-50 text-green-700 border border-green-200'
                          : nextAction.color === 'blue'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : 'bg-gray-50 text-gray-600 border border-gray-200'
                      }`}>
                        {nextAction.urgent && (
                          <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                        )}
                        {nextAction.label}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{formatDate(app.createdAt)}</p>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/admin/${type === "family" ? "families" : "nannies"}/${app._id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-white bg-[#8BA99E] hover:bg-[#7a9a8d] rounded-lg font-medium transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
            <p className="text-sm text-gray-500">
              Showing <span className="font-medium text-gray-700">{((pagination.page - 1) * pagination.limit) + 1}</span> to{" "}
              <span className="font-medium text-gray-700">{Math.min(pagination.page * pagination.limit, pagination.total)}</span> of{" "}
              <span className="font-medium text-gray-700">{pagination.total}</span> results
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="h-8"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm text-gray-600 px-2">
                Page {pagination.page} of {pagination.pages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange?.(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="h-8"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
