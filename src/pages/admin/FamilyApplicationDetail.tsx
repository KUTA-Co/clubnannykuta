import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuthFetch } from "@/contexts/AuthContext";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
  Users,
  Clock,
  Heart,
  Sparkles,
  Link2,
  Unlink,
  Copy,
  MessageCircle,
  UserX
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface FamilyApplication {
  _id: string;
  parentName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  howDidYouHear?: string;
  numberOfChildren?: string;
  childrenAges?: string;
  startDate?: string;
  endDate?: string;
  hoursPerWeek?: string;
  weeklySchedule?: string;
  specialNeeds?: string;
  church?: string;
  faithBackground?: string;
  familyValues?: string;
  nannyAgeRange?: string;
  experienceLevel?: string;
  personalityPreferences?: string;
  additionalInfo?: string;
  status: string;
  paymentStatus: string;
  reviewNotes?: string;
  reviewedBy?: { firstName?: string; lastName?: string; email: string };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Placement tracking
  placementDate?: string;
  placementEndDate?: string;
  matchedNannyId?: string;
  matchedNannyName?: string;
  matchNotes?: string;
}

interface ApprovedNanny {
  _id: string;
  fullName: string;
  email: string;
  city?: string;
  state?: string;
}

interface Match {
  _id: string;
  nannyId: string;
  familyId: string;
  nannyName: string;
  familyName: string;
  startDate?: string;
  endDate?: string;
  schedule?: string;
  notes?: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
}

export default function FamilyApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authFetch = useAuthFetch();
  const { toast } = useToast();

  const [application, setApplication] = useState<FamilyApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [isSendingConfirmation, setIsSendingConfirmation] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  // Matches state (many-to-many)
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [approvedNannies, setApprovedNannies] = useState<ApprovedNanny[]>([]);
  const [isLoadingNannies, setIsLoadingNannies] = useState(false);
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  // New match form state
  const [newMatchNannyId, setNewMatchNannyId] = useState<string>('');
  const [newMatchStartDate, setNewMatchStartDate] = useState<string>('');
  const [newMatchEndDate, setNewMatchEndDate] = useState<string>('');
  const [newMatchSchedule, setNewMatchSchedule] = useState<string>('');
  const [newMatchNotes, setNewMatchNotes] = useState<string>('');

  const fetchMatches = async () => {
    setIsLoadingMatches(true);
    try {
      const response = await authFetch(`/api/admin/matches/family/${id}`);
      const data = await response.json();
      if (data.success) {
        setMatches(data.matches);
      }
    } catch (error) {
      console.error("Fetch matches error:", error);
    } finally {
      setIsLoadingMatches(false);
    }
  };

  useEffect(() => {
    const fetchApplication = async () => {
      try {
        const response = await authFetch(`/api/admin/applications/family/${id}`);
        const data = await response.json();
        if (data.success) {
          setApplication(data.application);
        }
      } catch (error) {
        console.error("Fetch application error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchApprovedNannies = async () => {
      setIsLoadingNannies(true);
      try {
        // Fetch both approved and matched nannies so we can add matches to nannies already matched elsewhere
        const response = await authFetch('/api/admin/applications/nanny?limit=200');
        const data = await response.json();
        if (data.success) {
          // Filter to only approved or matched nannies
          const eligible = data.applications.filter((n: ApprovedNanny & { status: string }) =>
            n.status === 'approved' || n.status === 'matched'
          );
          setApprovedNannies(eligible);
        }
      } catch (error) {
        console.error("Fetch nannies error:", error);
      } finally {
        setIsLoadingNannies(false);
      }
    };

    fetchApplication();
    fetchApprovedNannies();
    fetchMatches();
  }, [authFetch, id]);

  const updateStatus = async (newStatus: string) => {
    setIsSaving(true);
    try {
      const response = await authFetch(`/api/admin/applications/family/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus, sendEmail })
      });
      const data = await response.json();
      if (data.success) {
        setApplication(data.application);
        toast({
          title: "Status Updated",
          description: `Application marked as ${newStatus}${data.emailSent ? " - Email sent" : ""}`,
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const sendCustomEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({ title: "Missing Fields", description: "Please fill in both subject and message", variant: "destructive" });
      return;
    }
    setIsSendingEmail(true);
    try {
      const response = await authFetch("/api/admin/email/send", {
        method: "POST",
        body: JSON.stringify({
          to: application?.email,
          subject: emailSubject,
          message: emailMessage,
          applicantName: application?.parentName,
          applicationType: "family"
        })
      });
      const data = await response.json();
      if (data.success) {
        toast({ title: "Email Sent", description: `Email sent to ${application?.parentName}` });
        setShowEmailForm(false);
        setEmailSubject("");
        setEmailMessage("");
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send email", variant: "destructive" });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const sendConfirmationEmail = async () => {
    setIsSendingConfirmation(true);
    try {
      const response = await authFetch(`/api/admin/applications/family/${id}/send-confirmation`, {
        method: "POST"
      });
      const data = await response.json();

      if (data.success) {
        toast({ title: "Confirmation Sent", description: `Confirmation email sent to ${application?.parentName}` });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send confirmation email", variant: "destructive" });
    } finally {
      setIsSendingConfirmation(false);
    }
  };

  const verifyPayment = async () => {
    setIsVerifyingPayment(true);
    try {
      const response = await authFetch(`/api/admin/verify-payment/family/${id}`, { method: "POST" });
      const data = await response.json();
      if (data.success && data.paymentStatus === 'paid') {
        toast({ title: "Payment Verified", description: "Payment confirmed and status updated" });
        const appResponse = await authFetch(`/api/admin/applications/family/${id}`);
        const appData = await appResponse.json();
        if (appData.success) setApplication(appData.application);
      } else {
        toast({ title: "Payment Pending", description: `Status: ${data.paymentStatus}` });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to verify payment", variant: "destructive" });
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  const generatePaymentLink = async () => {
    setIsGeneratingLink(true);
    try {
      const response = await authFetch("/api/stripe/create-checkout-session", {
        method: "POST",
        body: JSON.stringify({
          applicationId: id,
          type: "family"
        })
      });
      const data = await response.json();
      if (data.success) {
        setPaymentLink(data.url);
        toast({
          title: "Payment Link Generated",
          description: "Link ready to copy or send",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Generate payment link error:", error);
      toast({
        title: "Error",
        description: "Failed to generate payment link",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const copyPaymentLink = () => {
    if (paymentLink) {
      navigator.clipboard.writeText(paymentLink);
      toast({ title: "Copied!", description: "Payment link copied to clipboard" });
    }
  };

  const sendPaymentLinkEmail = () => {
    if (paymentLink) {
      setShowEmailForm(true);
      setEmailSubject("Complete Your Club Nanny Application Payment");
      setEmailMessage(`Hi ${application?.parentName},\n\nPlease click the link below to complete your $250 application payment:\n\n${paymentLink}\n\nThank you!\nClub Nanny Team`);
      // Scroll to email form
      setTimeout(() => {
        document.getElementById('email-form-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const openWhatsApp = () => {
    if (paymentLink && application?.phone) {
      const message = encodeURIComponent(`Hi ${application.parentName}! Please complete your Club Nanny application payment here: ${paymentLink}`);
      let phone = application.phone.replace(/\D/g, '');
      // Format phone number with country code
      if (phone.length === 10 && phone.startsWith('0')) {
        // South African number - replace leading 0 with 27
        phone = '27' + phone.substring(1);
      } else if (phone.length === 10) {
        // US number - add 1
        phone = '1' + phone;
      }
      window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
    } else if (!application?.phone) {
      toast({ title: "No Phone Number", description: "This applicant has no phone number on file", variant: "destructive" });
    }
  };

  const createMatch = async () => {
    if (!newMatchNannyId) {
      toast({ title: "No Nanny Selected", description: "Please select a nanny to match with", variant: "destructive" });
      return;
    }

    setIsSavingMatch(true);
    try {
      const response = await authFetch('/api/admin/matches', {
        method: "POST",
        body: JSON.stringify({
          nannyId: newMatchNannyId,
          familyId: id,
          startDate: newMatchStartDate || null,
          endDate: newMatchEndDate || null,
          schedule: newMatchSchedule || null,
          notes: newMatchNotes || null
        })
      });

      const data = await response.json();

      if (data.success) {
        // Refresh matches list and application
        await fetchMatches();
        const appResponse = await authFetch(`/api/admin/applications/family/${id}`);
        const appData = await appResponse.json();
        if (appData.success) {
          setApplication(appData.application);
        }
        // Clear form
        setNewMatchNannyId('');
        setNewMatchStartDate('');
        setNewMatchEndDate('');
        setNewMatchSchedule('');
        setNewMatchNotes('');
        toast({ title: "Match Created", description: `Successfully matched with ${data.match.nannyName}` });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Create match error:", error);
      toast({ title: "Error", description: "Failed to create match", variant: "destructive" });
    } finally {
      setIsSavingMatch(false);
    }
  };

  const removeMatch = async (matchId: string) => {
    setIsSavingMatch(true);
    try {
      const response = await authFetch(`/api/admin/matches/${matchId}`, {
        method: "DELETE"
      });

      const data = await response.json();

      if (data.success) {
        // Refresh matches list and application
        await fetchMatches();
        const appResponse = await authFetch(`/api/admin/applications/family/${id}`);
        const appData = await appResponse.json();
        if (appData.success) {
          setApplication(appData.application);
        }
        toast({ title: "Match Removed", description: "The match has been removed" });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Remove match error:", error);
      toast({ title: "Error", description: "Failed to remove match", variant: "destructive" });
    } finally {
      setIsSavingMatch(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="w-8 h-8 text-[#8BA99E] animate-spin" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <p className="text-gray-500 text-lg">Application not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/families")}>
          Back to Applications
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <Link
        to="/admin/families"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#8BA99E] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Nanny Families
      </Link>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2d2d2d] rounded-3xl p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-[#8BA99E] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {application.parentName?.charAt(0) || "F"}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{application.parentName}</h1>
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {application.city && application.state ? `${application.city}, ${application.state}` : "Location not provided"}
                </span>
                <span className="text-gray-500">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Applied {formatDate(application.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge status={application.status} />
            <StatusBadge status={application.paymentStatus} type="payment" />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-4 mt-8">
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Children</p>
                <p className="text-lg font-semibold text-white">{application.numberOfChildren || "—"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Ages</p>
                <p className="text-lg font-semibold text-white">{application.childrenAges || "—"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Hours/Week</p>
                <p className="text-lg font-semibold text-white">{application.hoursPerWeek || "—"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Heart className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Church</p>
                <p className="text-lg font-semibold text-white truncate">{application.church || "—"}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-4 gap-5">
        {/* Main Content */}
        <div className="xl:col-span-4 lg:col-span-3 space-y-5">
          {/* Contact Information */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Mail className="w-5 h-5 text-[#8BA99E]" />
                Contact Information
              </h2>
            </div>
            <div className="p-6 grid grid-cols-2 gap-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Email Address</p>
                  <a href={`mailto:${application.email}`} className="text-[#1A1A1A] hover:text-[#8BA99E] transition-colors">
                    {application.email}
                  </a>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Phone Number</p>
                  <p className="text-[#1A1A1A]">{application.phone || "Not provided"}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Location</p>
                  <p className="text-[#1A1A1A]">
                    {application.city && application.state ? `${application.city}, ${application.state}` : "Not provided"}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">Application Date</p>
                  <p className="text-[#1A1A1A]">{formatDate(application.createdAt)}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-pink-50 flex items-center justify-center flex-shrink-0">
                  <MessageCircle className="w-5 h-5 text-pink-600" />
                </div>
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">How They Heard About Us</p>
                  <p className="text-[#1A1A1A]">{application.howDidYouHear || "Not provided"}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Childcare Schedule */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Clock className="w-5 h-5 text-[#8BA99E]" />
                Childcare Schedule
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Start Date</p>
                  <p className="text-lg font-semibold text-[#1A1A1A]">{application.startDate || "—"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-center">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">End Date</p>
                  <p className="text-lg font-semibold text-[#1A1A1A]">{application.endDate || "—"}</p>
                </div>
                <div className="bg-[#8BA99E]/10 rounded-xl p-4 text-center">
                  <p className="text-xs font-medium text-[#8BA99E] uppercase tracking-wide mb-1">Hours/Week</p>
                  <p className="text-lg font-semibold text-[#1A1A1A]">{application.hoursPerWeek || "—"}</p>
                </div>
              </div>
              {application.weeklySchedule && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Weekly Schedule</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[#1A1A1A] whitespace-pre-wrap">{application.weeklySchedule}</p>
                  </div>
                </div>
              )}
              {application.specialNeeds && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Special Needs / Considerations</p>
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-[#1A1A1A] whitespace-pre-wrap">{application.specialNeeds}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Faith & Values */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#8BA99E]" />
                Faith & Values
              </h2>
            </div>
            <div className="p-6 space-y-5">
              {application.church && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Church / Faith Community</p>
                  <p className="text-[#1A1A1A] font-medium">{application.church}</p>
                </div>
              )}
              {application.faithBackground && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Faith Background</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[#1A1A1A] whitespace-pre-wrap">{application.faithBackground}</p>
                  </div>
                </div>
              )}
              {application.familyValues && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Family Values</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[#1A1A1A] whitespace-pre-wrap">{application.familyValues}</p>
                  </div>
                </div>
              )}
              {!application.church && !application.faithBackground && !application.familyValues && (
                <p className="text-gray-400 text-center py-4">No faith & values information provided</p>
              )}
            </div>
          </div>

          {/* Nanny Preferences */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#8BA99E]" />
                Nanny Preferences
              </h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Preferred Age Range</p>
                  <p className="text-[#1A1A1A] font-medium">{application.nannyAgeRange || "No preference"}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Experience Level</p>
                  <p className="text-[#1A1A1A] font-medium">{application.experienceLevel || "No preference"}</p>
                </div>
              </div>
              {application.personalityPreferences && (
                <div className="mb-4">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Personality & Style Preferences</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="text-[#1A1A1A] whitespace-pre-wrap">{application.personalityPreferences}</p>
                  </div>
                </div>
              )}
              {application.additionalInfo && (
                <div>
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Additional Information</p>
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
                    <p className="text-[#1A1A1A] whitespace-pre-wrap">{application.additionalInfo}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Quick Actions</h2>
            </div>
            <div className="p-6 space-y-3">
              <Button
                onClick={sendConfirmationEmail}
                disabled={isSendingConfirmation}
                variant="outline"
                className="w-full justify-start h-12 border-[#8BA99E] text-[#8BA99E] hover:bg-[#8BA99E]/10"
              >
                {isSendingConfirmation ? <RefreshCw className="w-5 h-5 mr-3 animate-spin" /> : <Mail className="w-5 h-5 mr-3" />}
                Send Confirmation Email
              </Button>
              <Button
                onClick={() => updateStatus("reviewing")}
                disabled={isSaving || application.status === "reviewing"}
                variant="outline"
                className="w-full justify-start h-12 border-blue-200 hover:bg-blue-50 hover:border-blue-300"
              >
                <AlertCircle className="w-5 h-5 mr-3 text-blue-500" />
                Mark as Reviewing
              </Button>
              <Button
                onClick={() => updateStatus("approved")}
                disabled={isSaving || application.status === "approved"}
                className="w-full justify-start h-12 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-5 h-5 mr-3" />
                Approve Application
              </Button>
              <Button
                onClick={() => updateStatus("rejected")}
                disabled={isSaving || application.status === "rejected"}
                variant="destructive"
                className="w-full justify-start h-12"
              >
                <XCircle className="w-5 h-5 mr-3" />
                Reject Application
              </Button>
              <Button
                onClick={() => updateStatus("inactive")}
                disabled={isSaving || application.status === "inactive"}
                variant="outline"
                className="w-full justify-start h-12 border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                <UserX className="w-5 h-5 mr-3" />
                No Longer Interested
              </Button>
              <div className="pt-3 border-t border-gray-100">
                <label className="flex items-center gap-3 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 text-[#8BA99E] focus:ring-[#8BA99E]"
                  />
                  <span className="text-gray-600">Send email notification</span>
                </label>
              </div>
            </div>
          </div>

          {/* Payment Status */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Payment Status</h2>
            </div>
            <div className="p-6">
              {/* Application Fee */}
              <div className={`rounded-xl p-4 mb-4 ${application.paymentStatus === 'paid' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Application Fee</span>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${application.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                    {application.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                  </span>
                </div>
                <p className="text-2xl font-bold text-[#1A1A1A]">$250.00</p>
                {application.paymentStatus !== 'paid' && (
                  <Button
                    onClick={verifyPayment}
                    disabled={isVerifyingPayment}
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isVerifyingPayment ? 'animate-spin' : ''}`} />
                    Verify Payment
                  </Button>
                )}
              </div>

              {application.paymentStatus !== 'paid' && (
                <div className="mt-4 space-y-3">
                  {!paymentLink ? (
                    <Button
                      onClick={generatePaymentLink}
                      disabled={isGeneratingLink}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      <Link2 className={`w-4 h-4 mr-2 ${isGeneratingLink ? 'animate-spin' : ''}`} />
                      {isGeneratingLink ? "Generating..." : "Generate Payment Link"}
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Button onClick={copyPaymentLink} variant="outline" className="flex-1">
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Link
                        </Button>
                        <Button onClick={sendPaymentLinkEmail} variant="outline" className="flex-1">
                          <Mail className="w-4 h-4 mr-2" />
                          Email
                        </Button>
                      </div>
                      {application.phone && (
                        <Button onClick={openWhatsApp} variant="outline" className="w-full bg-green-50 border-green-200 text-green-700 hover:bg-green-100">
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Send via WhatsApp
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Placement & Matching */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-purple-50/50">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-500" />
                  Matched Nannies
                </h2>
                {matches.filter(m => m.status === 'active').length > 0 && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
                    {matches.filter(m => m.status === 'active').length} active
                  </span>
                )}
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Current Matches List */}
              {isLoadingMatches ? (
                <div className="text-center py-4 text-gray-500 text-sm">Loading matches...</div>
              ) : matches.filter(m => m.status === 'active').length > 0 ? (
                <div className="space-y-3">
                  {matches.filter(m => m.status === 'active').map((match) => (
                    <div key={match._id} className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium">
                            {match.nannyName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{match.nannyName}</p>
                            <div className="flex items-center gap-2 text-xs text-purple-600">
                              {match.startDate && (
                                <span>{new Date(match.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              )}
                              {match.startDate && match.endDate && <span>→</span>}
                              {match.endDate && (
                                <span>{new Date(match.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                              )}
                              {match.schedule && <span className="text-purple-500">• {match.schedule}</span>}
                            </div>
                            {match.notes && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{match.notes}</p>
                            )}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMatch(match._id)}
                          disabled={isSavingMatch}
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Unlink className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-400 text-sm">No active matches</div>
              )}

              {/* Add New Match Section */}
              <div className="border-t border-gray-100 pt-4 mt-4">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Add New Match</p>

                {/* Nanny Selector */}
                <div className="mb-3">
                  <Select value={newMatchNannyId} onValueChange={setNewMatchNannyId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingNannies ? "Loading nannies..." : "Select a nanny"} />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedNannies.map((nanny) => (
                        <SelectItem key={nanny._id} value={nanny._id}>
                          {nanny.fullName} {nanny.city && nanny.state ? `(${nanny.city}, ${nanny.state})` : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Dates & Schedule */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={newMatchStartDate}
                      onChange={(e) => setNewMatchStartDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 block mb-1">End Date</label>
                    <Input
                      type="date"
                      value={newMatchEndDate}
                      onChange={(e) => setNewMatchEndDate(e.target.value)}
                      className="text-sm"
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="text-xs text-gray-500 block mb-1">Schedule (optional)</label>
                  <Input
                    value={newMatchSchedule}
                    onChange={(e) => setNewMatchSchedule(e.target.value)}
                    placeholder="e.g., Mon-Wed mornings"
                    className="text-sm"
                  />
                </div>

                <div className="mb-3">
                  <label className="text-xs text-gray-500 block mb-1">Notes (optional)</label>
                  <Textarea
                    value={newMatchNotes}
                    onChange={(e) => setNewMatchNotes(e.target.value)}
                    placeholder="Notes about this placement..."
                    className="min-h-[60px] text-sm"
                  />
                </div>

                <Button
                  onClick={createMatch}
                  disabled={isSavingMatch || !newMatchNannyId}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  {isSavingMatch ? "Adding..." : "Add Match"}
                </Button>
              </div>
            </div>
          </div>

          {/* Email Applicant */}
          <div id="email-form-section" className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-lg font-semibold text-[#1A1A1A]">Email Applicant</h2>
            </div>
            <div className="p-6">
              {!showEmailForm ? (
                <Button onClick={() => setShowEmailForm(true)} variant="outline" className="w-full h-12">
                  <Send className="w-5 h-5 mr-2" />
                  Compose Email
                </Button>
              ) : (
                <div className="space-y-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">To</p>
                    <p className="text-sm font-medium">{application.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Subject</label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 block mb-1">Message</label>
                    <Textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="min-h-[120px]"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={sendCustomEmail} disabled={isSendingEmail} className="flex-1 bg-[#8BA99E] hover:bg-[#7a9a8d]">
                      {isSendingEmail ? "Sending..." : "Send Email"}
                    </Button>
                    <Button variant="outline" onClick={() => { setShowEmailForm(false); setEmailSubject(""); setEmailMessage(""); }}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
