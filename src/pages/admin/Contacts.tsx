import { useState, useEffect } from "react";
import { useAuthFetch } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  X,
  Trash2,
  Download,
  FileSpreadsheet,
  FileText,
  Calendar
} from "lucide-react";

interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: string;
  responseNotes?: string;
  respondedBy?: { firstName?: string; lastName?: string; email: string };
  respondedAt?: string;
  createdAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export default function Contacts() {
  const authFetch = useAuthFetch();

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [responseNotes, setResponseNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | "bulk" | null>(null);

  const fetchContacts = async (page = 1) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "20"
      });

      if (search) params.set("search", search);
      if (statusFilter) params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await authFetch(`/api/admin/contacts?${params}`);
      const data = await response.json();

      if (data.success) {
        setContacts(data.contacts);
        setPagination(data.pagination);
        setSelectedIds([]);
      }
    } catch (error) {
      console.error("Fetch contacts error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContacts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateContactStatus = async (contactId: string, status: string, notes?: string) => {
    setIsSaving(true);
    try {
      const response = await authFetch(`/api/admin/contacts/${contactId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, responseNotes: notes })
      });

      const data = await response.json();

      if (data.success) {
        setContacts(contacts.map(c =>
          c._id === contactId ? data.contact : c
        ));
        if (selectedContact?._id === contactId) {
          setSelectedContact(data.contact);
        }
      }
    } catch (error) {
      console.error("Update contact error:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchContacts(1);
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      if (deleteTarget === "bulk") {
        const response = await authFetch("/api/admin/contacts/bulk-delete", {
          method: "POST",
          body: JSON.stringify({ ids: selectedIds })
        });
        const data = await response.json();
        if (data.success) {
          fetchContacts(pagination?.page || 1);
        }
      } else if (deleteTarget) {
        const response = await authFetch(`/api/admin/contacts/${deleteTarget}`, {
          method: "DELETE"
        });
        const data = await response.json();
        if (data.success) {
          fetchContacts(pagination?.page || 1);
          if (selectedContact?._id === deleteTarget) {
            setSelectedContact(null);
          }
        }
      }
    } catch (error) {
      console.error("Delete error:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
      setDeleteTarget(null);
    }
  };

  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await authFetch(`/api/admin/contacts/export?${params}`);
      const data = await response.json();

      if (data.success && data.contacts) {
        const headers = ["Date", "Name", "Email", "Phone", "Subject", "Message", "Status"];
        const rows = data.contacts.map((c: Contact) => [
          new Date(c.createdAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" }),
          c.name,
          c.email,
          c.phone || "",
          c.subject,
          c.message.replace(/[\n\r]/g, " "),
          c.status
        ]);

        const csvContent = [
          headers.join(","),
          ...rows.map((row: string[]) => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `contacts-${new Date().toISOString().split("T")[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export CSV error:", error);
    }
  };

  const exportToPDF = async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter) params.set("status", statusFilter);
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);

      const response = await authFetch(`/api/admin/contacts/export?${params}`);
      const data = await response.json();

      if (data.success && data.contacts) {
        // Dynamic import jspdf
        const { jsPDF } = await import("jspdf");
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("Contact Messages Report", 20, 20);

        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 30);
        if (startDate || endDate) {
          doc.text(`Date Range: ${startDate || "Start"} to ${endDate || "Present"}`, 20, 36);
        }

        let y = 50;
        doc.setFontSize(12);

        data.contacts.forEach((c: Contact, i: number) => {
          if (y > 270) {
            doc.addPage();
            y = 20;
          }

          doc.setFont("helvetica", "bold");
          doc.text(`${i + 1}. ${c.name}`, 20, y);
          y += 6;

          doc.setFont("helvetica", "normal");
          doc.setFontSize(10);
          doc.text(`Email: ${c.email}`, 25, y);
          y += 5;
          doc.text(`Subject: ${c.subject}`, 25, y);
          y += 5;
          doc.text(`Date: ${new Date(c.createdAt).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })} | Status: ${c.status}`, 25, y);
          y += 5;

          // Message (truncated)
          const msg = c.message.length > 100 ? c.message.substring(0, 100) + "..." : c.message;
          doc.text(`Message: ${msg}`, 25, y);
          y += 10;

          doc.setFontSize(12);
        });

        doc.save(`contacts-${new Date().toISOString().split("T")[0]}.pdf`);
      }
    } catch (error) {
      console.error("Export PDF error:", error);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === contacts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(contacts.map(c => c._id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "read":
        return "bg-yellow-100 text-yellow-800";
      case "replied":
        return "bg-green-100 text-green-800";
      case "archived":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold font-heading text-[#1A1A1A]">Contact Messages</h1>
          <p className="text-gray-500 mt-1">View and respond to contact form submissions</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={exportToCSV}
            className="flex items-center gap-2"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportToPDF}
            className="flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder="Search by name, email, or subject..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#8BA99E]"
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="read">Read</option>
              <option value="replied">Replied</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-500">Date Range:</span>
            </div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
            <span className="text-gray-400">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
            <Button type="submit" className="bg-[#8BA99E] hover:bg-[#7a9a8d]">
              Apply Filters
            </Button>

            {(search || statusFilter || startDate || endDate) && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setStatusFilter("");
                  setStartDate("");
                  setEndDate("");
                  fetchContacts(1);
                }}
              >
                Clear All
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center justify-between">
          <span className="text-red-800">
            {selectedIds.length} message{selectedIds.length > 1 ? "s" : ""} selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              setDeleteTarget("bulk");
              setShowDeleteConfirm(true);
            }}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Selected
          </Button>
        </div>
      )}

      {/* Contacts List */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">Loading messages...</div>
        ) : contacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No messages found</div>
        ) : (
          <>
            {/* Select All Header */}
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-4">
              <Checkbox
                checked={selectedIds.length === contacts.length && contacts.length > 0}
                onCheckedChange={toggleSelectAll}
              />
              <span className="text-sm text-gray-500">Select All</span>
            </div>

            <div className="divide-y divide-gray-100">
              {contacts.map((contact) => (
                <div
                  key={contact._id}
                  className={`p-6 hover:bg-gray-50 transition-colors ${
                    contact.status === "new" ? "bg-blue-50/30" : ""
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <Checkbox
                      checked={selectedIds.includes(contact._id)}
                      onCheckedChange={() => toggleSelect(contact._id)}
                      onClick={(e) => e.stopPropagation()}
                    />

                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        setSelectedContact(contact);
                        setResponseNotes(contact.responseNotes || "");
                        if (contact.status === "new") {
                          updateContactStatus(contact._id, "read");
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-medium text-gray-900">{contact.name}</h3>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(contact.status)}`}>
                          {contact.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-2">{contact.email}</p>
                      <p className="text-sm font-medium text-gray-700">{contact.subject}</p>
                      <p className="text-sm text-gray-500 line-clamp-2 mt-1">{contact.message}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <p className="text-xs text-gray-400">{formatDate(contact.createdAt)}</p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(contact._id);
                          setShowDeleteConfirm(true);
                        }}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.pages > 1 && (
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
                  {pagination.total} results
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchContacts(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-gray-600">
                    Page {pagination.page} of {pagination.pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fetchContacts(pagination.page + 1)}
                    disabled={pagination.page === pagination.pages}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      {selectedContact && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedContact.subject}</h2>
                <p className="text-sm text-gray-500 mt-1">
                  From {selectedContact.name} ({selectedContact.email})
                </p>
              </div>
              <button
                onClick={() => setSelectedContact(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Message</p>
                <p className="text-gray-700 whitespace-pre-wrap">{selectedContact.message}</p>
              </div>

              {selectedContact.phone && (
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Phone</p>
                  <p className="text-gray-700">{selectedContact.phone}</p>
                </div>
              )}

              <div className="mb-6">
                <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Received</p>
                <p className="text-gray-700">{formatDate(selectedContact.createdAt)}</p>
              </div>

              <div className="border-t border-gray-100 pt-6">
                <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">
                  Internal Notes
                </label>
                <Textarea
                  value={responseNotes}
                  onChange={(e) => setResponseNotes(e.target.value)}
                  placeholder="Add notes about this message..."
                  className="mb-4"
                />

                <div className="flex flex-wrap gap-3">
                  <a
                    href={`mailto:${selectedContact.email}?subject=Re: ${selectedContact.subject}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#8BA99E] text-white rounded-lg hover:bg-[#7a9a8d] transition-colors"
                  >
                    <Mail className="w-4 h-4" />
                    Reply via Email
                  </a>

                  <Button
                    variant="outline"
                    onClick={() => updateContactStatus(selectedContact._id, "replied", responseNotes)}
                    disabled={isSaving}
                  >
                    Mark as Replied
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => updateContactStatus(selectedContact._id, "archived", responseNotes)}
                    disabled={isSaving}
                  >
                    Archive
                  </Button>

                  <Button
                    variant="destructive"
                    onClick={() => {
                      setDeleteTarget(selectedContact._id);
                      setShowDeleteConfirm(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              {deleteTarget === "bulk"
                ? `Are you sure you want to delete ${selectedIds.length} message${selectedIds.length > 1 ? "s" : ""}? This action cannot be undone.`
                : "Are you sure you want to delete this message? This action cannot be undone."}
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteTarget(null);
                }}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
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
