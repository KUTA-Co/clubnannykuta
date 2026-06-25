import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthFetch } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Ban, RotateCcw, Loader2, Star } from "lucide-react";

interface Sitter {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  experience?: string;
  age?: number;
  hourlyRate?: number;
  city: string;
  state: string;
  postalCode?: string;
  preferredRadius?: number;
  status: string;
  membershipStatus: string;
  applicationFeeAmountCents?: number;
  membershipFeeAmountCents?: number;
  membershipFeeAppliedAt?: string;
  membershipFeeRefundedAt?: string;
  membershipFeeRefundId?: string;
  averageRating?: number;
  reviewCount?: number;
  rejectionReason?: string;
  createdAt: string;
}

export default function SittingSitterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authFetch = useAuthFetch();
  const { toast } = useToast();

  const [sitter, setSitter] = useState<Sitter | null>(null);
  const [bookingStats, setBookingStats] = useState<{ _id: string; count: number }[]>([]);
  const [paymentStats, setPaymentStats] = useState<{ paidCount: number; paidAmountCents: number }>({ paidCount: 0, paidAmountCents: 0 });
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  const fetchSitter = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`/api/admin/sitting/sitters/${id}`);
      const data = await res.json();
      if (data.success) {
        setSitter(data.sitter);
        setBookingStats(data.bookingStats || []);
        setPaymentStats(data.paymentStats || { paidCount: 0, paidAmountCents: 0 });
      }
    } catch (error) {
      console.error("Fetch sitter error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSitter();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const doAction = async (action: "approve" | "reject" | "suspend" | "activate") => {
    if (action === "reject" && !confirm("Reject this sitter?")) return;
    setActing(true);
    try {
      const body = action === "reject" ? JSON.stringify({ reason: "Application rejected" }) : undefined;
      const res = await authFetch(`/api/admin/sitting/sitters/${id}/${action}`, { method: "PUT", body });
      const data = await res.json();
      if (data.success) {
        toast({
          title: `Sitter ${action}d`,
          description: data.message,
        });
        fetchSitter();
      } else {
        toast({ title: "Error", description: data.message || `Failed to ${action}`, variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong.", variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#8BA99E]" />
      </div>
    );
  }

  if (!sitter) {
    return <div className="text-center py-12 text-gray-500">Sitter not found.</div>;
  }

  const completed = bookingStats.find((b) => b._id === "completed")?.count || 0;
  const confirmed = bookingStats.find((b) => b._id === "confirmed")?.count || 0;
  const membershipFeeStatus = sitter.membershipFeeRefundedAt
    ? `Refunded${sitter.membershipFeeRefundId ? ` (${sitter.membershipFeeRefundId})` : ""}`
    : sitter.membershipFeeAppliedAt
      ? "Applied as first month"
      : sitter.membershipFeeAmountCents
        ? "Paid, pending approval decision"
        : undefined;

  return (
    <div className="space-y-6 max-w-3xl">
      <button onClick={() => navigate("/admin/sitters")} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800">
        <ArrowLeft className="w-4 h-4" /> Back to sitters
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#1A1A1A]">{sitter.firstName} {sitter.lastName}</h1>
          <p className="text-gray-500">{sitter.email}{sitter.phone ? ` • ${sitter.phone}` : ""}</p>
        </div>
        <span className="px-3 py-1 rounded-full text-sm font-medium capitalize bg-gray-100 text-gray-700">
          {sitter.status.replace(/_/g, " ")}
        </span>
      </div>

      {/* Action buttons by status */}
      <div className="flex flex-wrap gap-3">
        {sitter.status === "pending_approval" && (
          <>
            <Button onClick={() => doAction("approve")} disabled={acting} className="bg-green-600 hover:bg-green-700">
              {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> Approve</>}
            </Button>
            <Button onClick={() => doAction("reject")} disabled={acting} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
              <X className="w-4 h-4 mr-2" /> Reject
            </Button>
          </>
        )}
        {sitter.status === "active" && (
          <Button onClick={() => doAction("suspend")} disabled={acting} variant="outline" className="text-red-600 border-red-200 hover:bg-red-50">
            <Ban className="w-4 h-4 mr-2" /> Suspend
          </Button>
        )}
        {sitter.status === "suspended" && (
          <Button onClick={() => doAction("activate")} disabled={acting} className="bg-green-600 hover:bg-green-700">
            <RotateCcw className="w-4 h-4 mr-2" /> Reactivate
          </Button>
        )}
      </div>

      {/* Detail cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Profile</h3>
          <Row label="Age" value={sitter.age?.toString()} />
          <Row label="Hourly Rate" value={sitter.hourlyRate != null ? `$${sitter.hourlyRate}` : undefined} />
          <Row label="Location" value={`${sitter.city}, ${sitter.state} ${sitter.postalCode || ""}`} />
          <Row label="Radius" value={sitter.preferredRadius ? `${sitter.preferredRadius} mi` : undefined} />
          <Row label="Membership" value={sitter.membershipStatus} />
          <Row label="Application fee" value={sitter.applicationFeeAmountCents ? `$${(sitter.applicationFeeAmountCents / 100).toFixed(2)} paid` : undefined} />
          <Row label="First month fee" value={sitter.membershipFeeAmountCents ? `$${(sitter.membershipFeeAmountCents / 100).toFixed(2)}` : undefined} />
          <Row label="First month status" value={membershipFeeStatus} />
          <div className="flex items-center gap-1 pt-1 text-sm text-gray-600">
            <Star className="w-4 h-4" style={{ color: "#C77DA3" }} fill={sitter.reviewCount ? "#C77DA3" : "none"} />
            {sitter.reviewCount ? `${sitter.averageRating?.toFixed(1)} (${sitter.reviewCount} reviews)` : "No reviews yet"}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-2">
          <h3 className="font-semibold text-[#1A1A1A] mb-2">Bookings</h3>
          <Row label="Confirmed" value={confirmed.toString()} />
          <Row label="Completed" value={completed.toString()} />
          <Row label="Paid bookings" value={paymentStats.paidCount.toString()} />
          <Row label="Total paid" value={`$${(paymentStats.paidAmountCents / 100).toFixed(2)}`} />
          {sitter.rejectionReason && <Row label="Rejection reason" value={sitter.rejectionReason} />}
        </div>
      </div>

      {(sitter.bio || sitter.experience) && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
          {sitter.bio && (
            <div>
              <h3 className="font-semibold text-[#1A1A1A] mb-1">Bio</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{sitter.bio}</p>
            </div>
          )}
          {sitter.experience && (
            <div>
              <h3 className="font-semibold text-[#1A1A1A] mb-1">Experience</h3>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{sitter.experience}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-[#1A1A1A] font-medium capitalize">{value}</span>
    </div>
  );
}
