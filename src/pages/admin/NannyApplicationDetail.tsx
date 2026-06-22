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
  GraduationCap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  RefreshCw,
  Clock,
  Church,
  Heart,
  Briefcase,
  User,
  FileCheck,
  CreditCard,
  Sparkles,
  BookOpen,
  Shield,
  Users,
  Link2,
  Unlink,
  UserX,
  Copy,
  MessageCircle
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NannyApplication {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  city?: string;
  state?: string;
  dateOfBirth?: string;
  university?: string;
  yearsExperience?: string;
  ageGroups?: string;
  experienceTypes?: string;
  experienceDetails?: string;
  church?: string;
  faithJourney?: string;
  whyCalled?: string;
  availableStartDate?: string;
  availableEndDate?: string;
  hoursAvailable?: string;
  locationPreferences?: string;
  ageGroupPreferences?: string;
  additionalInfo?: string;
  backgroundCheckConsent?: boolean;
  status: string;
  paymentStatus: string;
  reviewNotes?: string;
  reviewedBy?: { firstName?: string; lastName?: string; email: string };
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  // Background check tracking
  backgroundCheckStatus?: 'not_requested' | 'requested' | 'in_progress' | 'passed' | 'failed';
  backgroundCheckRequestedDate?: string;
  backgroundCheckCompletedDate?: string;
  backgroundCheckNotes?: string;
  // Placement tracking
  placementDate?: string;
  placementEndDate?: string;
  matchedFamilyId?: string;
  matchedFamilyName?: string;
  matchNotes?: string;
}

interface ApprovedFamily {
  _id: string;
  parentName: string;
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

export default function NannyApplicationDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const authFetch = useAuthFetch();
  const { toast } = useToast();

  const [application, setApplication] = useState<NannyApplication | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  // Custom email state
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isSendingEmail, setIsSendingEmail] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  const [paymentLink, setPaymentLink] = useState<string | null>(null);

  // Background check state
  const [bgCheckStatus, setBgCheckStatus] = useState<string>('not_requested');
  const [bgCheckRequestedDate, setBgCheckRequestedDate] = useState<string>('');
  const [bgCheckCompletedDate, setBgCheckCompletedDate] = useState<string>('');
  const [bgCheckNotes, setBgCheckNotes] = useState<string>('');
  const [isSavingBgCheck, setIsSavingBgCheck] = useState(false);

  // Matches state (many-to-many)
  const [matches, setMatches] = useState<Match[]>([]);
  const [isLoadingMatches, setIsLoadingMatches] = useState(false);
  const [approvedFamilies, setApprovedFamilies] = useState<ApprovedFamily[]>([]);
  const [isLoadingFamilies, setIsLoadingFamilies] = useState(false);
  const [isSavingMatch, setIsSavingMatch] = useState(false);

  // New match form state
  const [newMatchFamilyId, setNewMatchFamilyId] = useState<string>('');
  const [newMatchStartDate, setNewMatchStartDate] = useState<string>('');
  const [newMatchEndDate, setNewMatchEndDate] = useState<string>('');
  const [newMatchSchedule, setNewMatchSchedule] = useState<string>('');
  const [newMatchNotes, setNewMatchNotes] = useState<string>('');

  const fetchMatches = async () => {
    setIsLoadingMatches(true);
    try {
      const response = await authFetch(`/api/admin/matches/nanny/${id}`);
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
        const response = await authFetch(`/api/admin/applications/nanny/${id}`);
        const data = await response.json();

        if (data.success) {
          setApplication(data.application);
          // Initialize background check state
          setBgCheckStatus(data.application.backgroundCheckStatus || 'not_requested');
          setBgCheckRequestedDate(data.application.backgroundCheckRequestedDate?.split('T')[0] || '');
          setBgCheckCompletedDate(data.application.backgroundCheckCompletedDate?.split('T')[0] || '');
          setBgCheckNotes(data.application.backgroundCheckNotes || '');
        }
      } catch (error) {
        console.error("Fetch application error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    const fetchApprovedFamilies = async () => {
      setIsLoadingFamilies(true);
      try {
        // Fetch both approved and matched families so we can add matches to families already matched elsewhere
        const response = await authFetch('/api/admin/applications/family?limit=200');
        const data = await response.json();
        if (data.success) {
          // Filter to only approved or matched families
          const eligible = data.applications.filter((f: ApprovedFamily & { status: string }) =>
            f.status === 'approved' || f.status === 'matched'
          );
          setApprovedFamilies(eligible);
        }
      } catch (error) {
        console.error("Fetch families error:", error);
      } finally {
        setIsLoadingFamilies(false);
      }
    };

    fetchApplication();
    fetchApprovedFamilies();
    fetchMatches();
  }, [authFetch, id]);

  const updateStatus = async (newStatus: string) => {
    setIsSaving(true);
    try {
      const response = await authFetch(`/api/admin/applications/nanny/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          status: newStatus,
          sendEmail
        })
      });

      const data = await response.json();

      if (data.success) {
        setApplication(data.application);
        toast({
          title: "Status Updated",
          description: `Application marked as ${newStatus}${data.emailSent ? " - Email sent to applicant" : ""}`,
        });
      }
    } catch (error) {
      console.error("Update status error:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const sendCustomEmail = async () => {
    if (!emailSubject.trim() || !emailMessage.trim()) {
      toast({
        title: "Missing Fields",
        description: "Please fill in both subject and message",
        variant: "destructive",
      });
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
          applicantName: application?.fullName,
          applicationType: "nanny"
        })
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Email Sent",
          description: `Email sent to ${application?.fullName}`,
        });
        setShowEmailForm(false);
        setEmailSubject("");
        setEmailMessage("");
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Send email error:", error);
      toast({
        title: "Error",
        description: "Failed to send email",
        variant: "destructive",
      });
    } finally {
      setIsSendingEmail(false);
    }
  };

  const verifyPayment = async () => {
    setIsVerifyingPayment(true);
    try {
      const response = await authFetch(`/api/admin/verify-payment/nanny/${id}`, {
        method: "POST"
      });

      const data = await response.json();

      if (data.success) {
        if (data.paymentStatus === 'paid') {
          toast({
            title: "Payment Verified",
            description: "Payment has been confirmed and status updated",
          });
          // Refresh application data
          const appResponse = await authFetch(`/api/admin/applications/nanny/${id}`);
          const appData = await appResponse.json();
          if (appData.success) {
            setApplication(appData.application);
          }
        } else {
          toast({
            title: "Payment Pending",
            description: `Payment status: ${data.paymentStatus}`,
          });
        }
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
          type: "nanny"
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
      setEmailMessage(`Hi ${application?.fullName},\n\nPlease click the link below to complete your $75 application payment:\n\n${paymentLink}\n\nThank you!\nClub Nanny Team`);
      // Scroll to email form
      setTimeout(() => {
        document.getElementById('email-form-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  };

  const openWhatsApp = () => {
    if (paymentLink && application?.phone) {
      const message = encodeURIComponent(`Hi ${application.fullName}! Please complete your Club Nanny application payment here: ${paymentLink}`);
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

  const saveBackgroundCheck = async () => {
    setIsSavingBgCheck(true);
    try {
      const response = await authFetch(`/api/admin/applications/nanny/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          backgroundCheckStatus: bgCheckStatus,
          backgroundCheckRequestedDate: bgCheckRequestedDate || null,
          backgroundCheckCompletedDate: bgCheckCompletedDate || null,
          backgroundCheckNotes: bgCheckNotes || null,
          sendEmail: false
        })
      });

      const data = await response.json();

      if (data.success) {
        setApplication(data.application);
        toast({
          title: "Background Check Updated",
          description: "Background check information saved successfully",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Save background check error:", error);
      toast({
        title: "Error",
        description: "Failed to save background check info",
        variant: "destructive",
      });
    } finally {
      setIsSavingBgCheck(false);
    }
  };

  const createMatch = async () => {
    if (!newMatchFamilyId) {
      toast({
        title: "No Family Selected",
        description: "Please select a family to match with",
        variant: "destructive",
      });
      return;
    }

    setIsSavingMatch(true);
    try {
      const response = await authFetch('/api/admin/matches', {
        method: "POST",
        body: JSON.stringify({
          nannyId: id,
          familyId: newMatchFamilyId,
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
        const appResponse = await authFetch(`/api/admin/applications/nanny/${id}`);
        const appData = await appResponse.json();
        if (appData.success) {
          setApplication(appData.application);
        }
        // Clear form
        setNewMatchFamilyId('');
        setNewMatchStartDate('');
        setNewMatchEndDate('');
        setNewMatchSchedule('');
        setNewMatchNotes('');
        toast({
          title: "Match Created",
          description: `Successfully matched with ${data.match.familyName}`,
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Create match error:", error);
      toast({
        title: "Error",
        description: "Failed to create match",
        variant: "destructive",
      });
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
        const appResponse = await authFetch(`/api/admin/applications/nanny/${id}`);
        const appData = await appResponse.json();
        if (appData.success) {
          setApplication(appData.application);
        }
        toast({
          title: "Match Removed",
          description: "The match has been removed",
        });
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      console.error("Remove match error:", error);
      toast({
        title: "Error",
        description: "Failed to remove match",
        variant: "destructive",
      });
    } finally {
      setIsSavingMatch(false);
    }
  };

  const getBgCheckStatusColor = (status: string) => {
    switch (status) {
      case 'passed': return 'bg-green-100 text-green-700 border-green-200';
      case 'failed': return 'bg-red-100 text-red-700 border-red-200';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'requested': return 'bg-amber-100 text-amber-700 border-amber-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "—";
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "2-digit",
      day: "2-digit",
      year: "numeric"
    });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-48 mb-8"></div>
        <div className="h-64 bg-gray-200 rounded-2xl"></div>
      </div>
    );
  }

  if (!application) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Application not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/admin/nannies")}>
          Back to Applications
        </Button>
      </div>
    );
  }

  return (
    <div>
      {/* Back Button */}
      <Link
        to="/admin/nannies"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#8BA99E] transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Nanny Applications
      </Link>

      {/* Header Card */}
      <div className="bg-gradient-to-r from-[#1A1A1A] to-[#2d2d2d] rounded-3xl p-8 mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-[#8BA99E] flex items-center justify-center text-white text-3xl font-bold shadow-lg">
              {getInitials(application.fullName)}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{application.fullName}</h1>
              <div className="flex items-center gap-3 text-gray-300 text-sm">
                <span className="flex items-center gap-1">
                  <Mail className="w-4 h-4" />
                  {application.email}
                </span>
                {application.phone && (
                  <>
                    <span className="text-gray-500">•</span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-4 h-4" />
                      {application.phone}
                    </span>
                  </>
                )}
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
                <GraduationCap className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">University</p>
                <p className="text-lg font-semibold text-white truncate">{application.university || "—"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Experience</p>
                <p className="text-lg font-semibold text-white">{application.yearsExperience || "—"} years</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Hours Available</p>
                <p className="text-lg font-semibold text-white">{application.hoursAvailable || "—"}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <Church className="w-5 h-5 text-emerald-400" />
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
          {/* Personal Information */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100/50 px-6 py-4 border-b border-blue-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">Personal Information</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Email</p>
                    <p className="mt-1 font-medium text-[#1A1A1A]">{application.email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Phone</p>
                    <p className="mt-1 font-medium text-[#1A1A1A]">{application.phone || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                    <p className="mt-1 font-medium text-[#1A1A1A]">
                      {application.city && application.state
                        ? `${application.city}, ${application.state}`
                        : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Date of Birth</p>
                    <p className="mt-1 font-medium text-[#1A1A1A]">{application.dateOfBirth || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GraduationCap className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">University</p>
                    <p className="mt-1 font-medium text-[#1A1A1A]">{application.university || "—"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Applied</p>
                    <p className="mt-1 font-medium text-[#1A1A1A]">{formatDate(application.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Experience */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 px-6 py-4 border-b border-purple-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">Experience</h2>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Years of Experience</p>
                  <p className="mt-1 font-medium text-[#1A1A1A]">{application.yearsExperience || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Age Groups</p>
                  <p className="mt-1 font-medium text-[#1A1A1A]">{application.ageGroups || "—"}</p>
                </div>
              </div>
              {application.experienceTypes && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Types of Experience</p>
                  <p className="mt-1 text-[#1A1A1A]">{application.experienceTypes}</p>
                </div>
              )}
              {application.experienceDetails && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Experience Details</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="whitespace-pre-wrap text-[#1A1A1A]">{application.experienceDetails}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Faith Journey */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#8BA99E]/20 to-[#8BA99E]/10 px-6 py-4 border-b border-[#8BA99E]/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8BA99E] flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">Faith Journey</h2>
              </div>
            </div>
            <div className="p-6 space-y-5">
              {application.church && (
                <div className="flex items-start gap-3">
                  <Church className="w-5 h-5 text-[#8BA99E] mt-0.5" />
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Church / Faith Community</p>
                    <p className="mt-1 font-medium text-[#1A1A1A]">{application.church}</p>
                  </div>
                </div>
              )}
              {application.faithJourney && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Faith Journey</p>
                  <div className="bg-[#8BA99E]/5 rounded-xl p-4 border border-[#8BA99E]/10">
                    <p className="whitespace-pre-wrap text-[#1A1A1A]">{application.faithJourney}</p>
                  </div>
                </div>
              )}
              {application.whyCalled && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Why Called to Serve</p>
                  <div className="bg-[#8BA99E]/5 rounded-xl p-4 border border-[#8BA99E]/10">
                    <p className="whitespace-pre-wrap text-[#1A1A1A]">{application.whyCalled}</p>
                  </div>
                </div>
              )}
              {!application.church && !application.faithJourney && !application.whyCalled && (
                <p className="text-gray-500 italic">No faith information provided</p>
              )}
            </div>
          </div>

          {/* Availability & Preferences */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 px-6 py-4 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center">
                  <Calendar className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">Availability & Preferences</h2>
              </div>
            </div>
            <div className="p-6 space-y-5">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Start Date</p>
                  <p className="mt-1 font-semibold text-[#1A1A1A]">{application.availableStartDate || "—"}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">End Date</p>
                  <p className="mt-1 font-semibold text-[#1A1A1A]">{application.availableEndDate || "—"}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Hours/Week</p>
                  <p className="mt-1 font-semibold text-[#1A1A1A]">{application.hoursAvailable || "—"}</p>
                </div>
              </div>

              {application.locationPreferences && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Location Preferences</p>
                  <p className="mt-1 text-[#1A1A1A]">{application.locationPreferences}</p>
                </div>
              )}
              {application.ageGroupPreferences && (
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Age Group Preferences</p>
                  <p className="mt-1 text-[#1A1A1A]">{application.ageGroupPreferences}</p>
                </div>
              )}
              {application.additionalInfo && (
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Additional Information</p>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <p className="whitespace-pre-wrap text-[#1A1A1A]">{application.additionalInfo}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Consents & Verification */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-50 to-green-100/50 px-6 py-4 border-b border-green-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-green-500 flex items-center justify-center">
                  <FileCheck className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">Consents & Verification</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-gray-50">
                {application.backgroundCheckConsent ? (
                  <>
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A]">Background Check Consent</p>
                      <p className="text-sm text-gray-500">Applicant has consented to background checks</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <p className="font-medium text-[#1A1A1A]">Background Check Consent</p>
                      <p className="text-sm text-gray-500">No consent provided</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Status */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-emerald-50 to-emerald-100/50 px-6 py-4 border-b border-emerald-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">Payment Status</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Application Fee</p>
                  <p className="font-semibold text-[#1A1A1A] mt-1">$75</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full text-xs font-medium ${
                  application.paymentStatus === 'paid'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-amber-100 text-amber-700'
                }`}>
                  {application.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                </div>
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

          {/* Status Actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-gray-100/50 px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">Update Status</h2>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-3">
                <Button
                  onClick={() => updateStatus("reviewing")}
                  disabled={isSaving || application.status === "reviewing"}
                  variant="outline"
                  className="w-full justify-start h-11"
                >
                  <AlertCircle className="w-4 h-4 mr-2 text-blue-500" />
                  Mark as Reviewing
                </Button>

                <Button
                  onClick={() => updateStatus("approved")}
                  disabled={isSaving || application.status === "approved"}
                  className="w-full justify-start h-11 bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Application
                </Button>

                <Button
                  onClick={() => updateStatus("rejected")}
                  disabled={isSaving || application.status === "rejected"}
                  variant="destructive"
                  className="w-full justify-start h-11"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject Application
                </Button>

                <Button
                  onClick={() => updateStatus("inactive")}
                  disabled={isSaving || application.status === "inactive"}
                  variant="outline"
                  className="w-full justify-start h-11 border-gray-300 text-gray-600 hover:bg-gray-100"
                >
                  <UserX className="w-4 h-4 mr-2" />
                  No Longer Interested
                </Button>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sendEmail}
                    onChange={(e) => setSendEmail(e.target.checked)}
                    className="rounded border-gray-300 text-[#8BA99E] focus:ring-[#8BA99E]"
                  />
                  <span className="text-gray-600">Send email notification to applicant</span>
                </label>
              </div>
            </div>
          </div>

          {/* Background Check */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-50 to-indigo-100/50 px-6 py-4 border-b border-indigo-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">Background Check</h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {/* Current Status Badge */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500 uppercase tracking-wide">Current Status</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getBgCheckStatusColor(application.backgroundCheckStatus || 'not_requested')}`}>
                  {(application.backgroundCheckStatus || 'not_requested').replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Update Status</label>
                <Select value={bgCheckStatus} onValueChange={setBgCheckStatus}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="not_requested">Not Requested</SelectItem>
                    <SelectItem value="requested">Requested</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="passed">Passed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Requested Date</label>
                  <Input
                    type="date"
                    value={bgCheckRequestedDate}
                    onChange={(e) => setBgCheckRequestedDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Completed Date</label>
                  <Input
                    type="date"
                    value={bgCheckCompletedDate}
                    onChange={(e) => setBgCheckCompletedDate(e.target.value)}
                    className="text-sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs text-gray-500 uppercase tracking-wide block mb-1">Notes</label>
                <Textarea
                  value={bgCheckNotes}
                  onChange={(e) => setBgCheckNotes(e.target.value)}
                  placeholder="Add notes about background check..."
                  className="min-h-[80px] text-sm"
                />
              </div>

              <Button
                onClick={saveBackgroundCheck}
                disabled={isSavingBgCheck}
                className="w-full bg-indigo-600 hover:bg-indigo-700"
              >
                {isSavingBgCheck ? "Saving..." : "Save Background Check"}
              </Button>
            </div>
          </div>

          {/* Placement & Matching */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-purple-50 to-purple-100/50 px-6 py-4 border-b border-purple-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-500 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>
                  <h2 className="font-semibold text-[#1A1A1A]">Matched Families</h2>
                </div>
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
                            {match.familyName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium text-[#1A1A1A]">{match.familyName}</p>
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

                {/* Family Selector */}
                <div className="mb-3">
                  <Select value={newMatchFamilyId} onValueChange={setNewMatchFamilyId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={isLoadingFamilies ? "Loading families..." : "Select a family"} />
                    </SelectTrigger>
                    <SelectContent>
                      {approvedFamilies.map((family) => (
                        <SelectItem key={family._id} value={family._id}>
                          {family.parentName} {family.city && family.state ? `(${family.city}, ${family.state})` : ''}
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
                  disabled={isSavingMatch || !newMatchFamilyId}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  <Link2 className="w-4 h-4 mr-2" />
                  {isSavingMatch ? "Adding..." : "Add Match"}
                </Button>
              </div>
            </div>
          </div>

          {/* Send Custom Email */}
          <div id="email-form-section" className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-[#8BA99E]/20 to-[#8BA99E]/10 px-6 py-4 border-b border-[#8BA99E]/20">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#8BA99E] flex items-center justify-center">
                  <Mail className="w-4 h-4 text-white" />
                </div>
                <h2 className="font-semibold text-[#1A1A1A]">Email Applicant</h2>
              </div>
            </div>
            <div className="p-6">
              {!showEmailForm ? (
                <Button
                  onClick={() => setShowEmailForm(true)}
                  variant="outline"
                  className="w-full h-11 border-[#8BA99E] text-[#8BA99E] hover:bg-[#8BA99E]/10"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Compose Email
                </Button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">To</label>
                    <p className="text-sm text-[#1A1A1A] mt-1 font-medium">{application.email}</p>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Subject</label>
                    <Input
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      placeholder="Email subject..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Message</label>
                    <Textarea
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="min-h-[120px] mt-1"
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={sendCustomEmail}
                      disabled={isSendingEmail}
                      className="flex-1 bg-[#8BA99E] hover:bg-[#7a9a8d]"
                    >
                      {isSendingEmail ? "Sending..." : "Send Email"}
                    </Button>
                    <Button
                      onClick={() => {
                        setShowEmailForm(false);
                        setEmailSubject("");
                        setEmailMessage("");
                      }}
                      variant="outline"
                    >
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
