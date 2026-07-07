import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthFetch } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, X, Ban, RotateCcw, Loader2, Star, Mail, Trash2 } from "lucide-react";

interface Sitter {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  bio?: string;
  experience?: string;
  age?: number;
  howDidYouHear?: string;
  hourlyRate?: number;
  hourlyRate1Kid?: number;
  hourlyRate2Kids?: number;
  hourlyRate3PlusKids?: number;
  yearsOfExperience?: string;
  ageGroupsWorkedWith?: string;
  typesOfExperience?: string;
  faithJourney?: string;
  whyCalledToServe?: string;
  specialSkills?: string;
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

interface SitterReview {
  _id: string;
  rating: number;
  comment?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  familyId?: {
    householdName?: string;
    email?: string;
  };
}

export default function SittingSitterDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const authFetch = useAuthFetch();
  const { toast } = useToast();

  const [sitter, setSitter] = useState<Sitter | null>(null);
  const [bookingStats, setBookingStats] = useState<{ _id: string; count: number }[]>([]);
  const [paymentStats, setPaymentStats] = useState<{ paidCount: number; paidAmountCents: number }>({ paidCount: 0, paidAmountCents: 0 });
  const [reviews, setReviews] = useState<SitterReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [sendingConfirmation, setSendingConfirmation] = useState(false);
  const [sendingApproval, setSendingApproval] = useState(false);
  const [deletingReviewId, setDeletingReviewId] = useState<string | null>(null);
  const [approvingReviewId, setApprovingReviewId] = useState<string | null>(null);

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

      const reviewsRes = await authFetch(`/api/admin/sitting/sitters/${id}/reviews`);
      const reviewsData = await reviewsRes.json();
      if (reviewsData.success) {
        setReviews(reviewsData.reviews || []);
      }
    } catch (error) {
      console.error("Fetch sitter error:", error);
    } finally {
      setLoading(false);
    }
  };

  const sendConfirmationEmail = async () => {
    setSendingConfirmation(true);
    try {
      const res = await authFetch(`/api/admin/sitting/sitters/${id}/send-confirmation`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Email Sent", description: data.message || `Email sent to ${sitter?.firstName}` });
      } else {
        toast({ title: "Error", description: data.message || "Failed to send confirmation email", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send confirmation email", variant: "destructive" });
    } finally {
      setSendingConfirmation(false);
    }
  };

  const sendApprovalEmail = async () => {
    setSendingApproval(true);
    try {
      const res = await authFetch(`/api/admin/sitting/sitters/${id}/send-approval`, { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Email Sent", description: data.message || `Approved email sent to ${sitter?.firstName}` });
      } else {
        toast({ title: "Error", description: data.message || "Failed to send approved email", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to send approved email", variant: "destructive" });
    } finally {
      setSendingApproval(false);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm("Delete this review? This will update the sitter's rating.")) return;

    setDeletingReviewId(reviewId);
    try {
      const res = await authFetch(`/api/admin/sitting/sitters/${id}/reviews/${reviewId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Review Deleted", description: "The sitter rating has been updated." });
        fetchSitter();
      } else {
        toast({ title: "Error", description: data.message || "Failed to delete review", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to delete review", variant: "destructive" });
    } finally {
      setDeletingReviewId(null);
    }
  };

  const approveReview = async (reviewId: string) => {
    setApprovingReviewId(reviewId);
    try {
      const res = await authFetch(`/api/admin/sitting/sitters/${id}/reviews/${reviewId}/approve`, { method: "PUT" });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Review Approved", description: "The review is now visible on the sitter profile." });
        fetchReviews();
        fetchSitter();
      } else {
        toast({ title: "Error", description: data.message || "Failed to approve review", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to approve review", variant: "destructive" });
    } finally {
      setApprovingReviewId(null);
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
  const visibleBio = sitter.bio && sitter.bio.trim() !== (sitter.experience || "").trim()
    ? sitter.bio
    : undefined;
  const hasProfileDetails = Boolean(
    visibleBio ||
    sitter.experience ||
    sitter.yearsOfExperience ||
    sitter.ageGroupsWorkedWith ||
    sitter.typesOfExperience ||
    sitter.faithJourney ||
    sitter.whyCalledToServe ||
    sitter.specialSkills
  );

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
        {sitter.status !== "rejected" && (
          <Button onClick={sendConfirmationEmail} disabled={sendingConfirmation} variant="outline" className="border-[#8BA99E] text-[#8BA99E] hover:bg-[#8BA99E]/10">
            {sendingConfirmation ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Send Application Confirmation
          </Button>
        )}
        {sitter.status === "active" && (
          <Button onClick={sendApprovalEmail} disabled={sendingApproval} variant="outline" className="border-green-600 text-green-700 hover:bg-green-50">
            {sendingApproval ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Mail className="w-4 h-4 mr-2" />}
            Send Application Approved Email
          </Button>
        )}
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
          <Row label="Email" value={sitter.email} />
          <Row label="Phone" value={sitter.phone} />
          <Row label="Age" value={sitter.age?.toString()} />
          <Row label="Rate - 1 child" value={sitter.hourlyRate1Kid != null ? `$${sitter.hourlyRate1Kid}/hour` : sitter.hourlyRate != null ? `$${sitter.hourlyRate}/hour` : undefined} />
          <Row label="Rate - 2 children" value={sitter.hourlyRate2Kids != null ? `$${sitter.hourlyRate2Kids}/hour` : undefined} />
          <Row label="Rate - 3+ children" value={sitter.hourlyRate3PlusKids != null ? `$${sitter.hourlyRate3PlusKids}/hour` : undefined} />
          <Row label="Location" value={`${sitter.city}, ${sitter.state} ${sitter.postalCode || ""}`} />
          <Row label="Radius" value={sitter.preferredRadius ? `${sitter.preferredRadius} mi` : undefined} />
          <Row label="Found us through" value={sitter.howDidYouHear} />
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

      {hasProfileDetails && (
        <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-4">
          <h3 className="font-semibold text-[#1A1A1A]">Profile Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Row label="Years experience" value={sitter.yearsOfExperience} />
            <Row label="Age groups" value={sitter.ageGroupsWorkedWith} />
            <Row label="Experience types" value={sitter.typesOfExperience} />
          </div>
          <TextBlock title="Bio" value={visibleBio} />
          <TextBlock title="Experience" value={sitter.experience} />
          <TextBlock title="Faith Journey" value={sitter.faithJourney} />
          <TextBlock title="Why Called to Serve" value={sitter.whyCalledToServe} />
          <TextBlock title="Special Skills" value={sitter.specialSkills} />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-100 p-5 space-y-3">
        <h3 className="font-semibold text-[#1A1A1A]">Reviews</h3>
        {reviews.length === 0 ? (
          <p className="text-sm text-gray-500">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <div key={review._id} className="rounded-lg border border-gray-100 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <Star key={n} className="w-4 h-4" style={{ color: "#C77DA3" }} fill={n <= review.rating ? "#C77DA3" : "none"} />
                      ))}
                      <span className={`ml-2 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                        review.status === "pending"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-green-100 text-green-800"
                      }`}>
                        {review.status || "approved"}
                      </span>
                      <span className="ml-2 text-xs text-gray-500">
                        {review.familyId?.householdName || review.familyId?.email || "Family"} · {new Date(review.createdAt).toLocaleDateString("en-US")}
                      </span>
                    </div>
                    {review.comment && <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{review.comment}</p>}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {review.status === "pending" && (
                      <Button
                        onClick={() => approveReview(review._id)}
                        disabled={approvingReviewId === review._id}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {approvingReviewId === review._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteReview(review._id)}
                      disabled={deletingReviewId === review._id}
                      size="sm"
                      variant="outline"
                      className="text-red-600 border-red-200 hover:bg-red-50"
                    >
                      {deletingReviewId === review._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | number }) {
  if (!value) return null;
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="text-right text-[#1A1A1A] font-medium">{value}</span>
    </div>
  );
}

function TextBlock({ title, value }: { title: string; value?: string }) {
  if (!value) return null;
  return (
    <div>
      <h4 className="font-semibold text-[#1A1A1A] mb-1">{title}</h4>
      <p className="text-sm text-gray-600 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
