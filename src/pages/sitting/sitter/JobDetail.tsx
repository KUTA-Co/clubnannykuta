import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, MapPin, Clock, Users, AlertCircle, Check, X, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || '';

interface Job {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  address?: string;
  city: string;
  state: string;
  postalCode?: string;
  numberOfChildren: number;
  childrenAges: number[];
  notes?: string;
  specialInstructions?: string;
  status: string;
  familyId: {
    householdName: string;
    city: string;
    state: string;
    phone?: string;
    email?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
  isAvailable: boolean;
  hasResponded: boolean;
  responseStatus?: string;
}

export default function JobDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState<Job | null>(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    fetchJob();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const fetchJob = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/sitter/jobs/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setJob(data.job);
    } catch (error) {
      console.error('Error fetching job:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    setActing(true);
    try {
      const res = await fetch(`${API_URL}/api/sitter/jobs/${id}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: '' })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Interest Expressed", description: "The family has been notified." });
        fetchJob();
      } else {
        toast({ title: "Error", description: data.message || "Failed to respond", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const handleWithdraw = async () => {
    setActing(true);
    try {
      const res = await fetch(`${API_URL}/api/sitter/jobs/${id}/respond`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Interest Withdrawn" });
        fetchJob();
      } else {
        toast({ title: "Error", description: data.message || "Failed to withdraw", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Something went wrong. Please try again.", variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E8A0BF' }} />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12">
        <p className="text-[#4A4A4A]/60 mb-4">Job not found</p>
        <Button onClick={() => navigate('/sitting/sitter/jobs')} variant="outline">Back to Jobs</Button>
      </div>
    );
  }

  const isSelected = job.responseStatus === 'selected';

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/sitting/sitter/jobs')} className="flex items-center gap-2 text-sm text-[#4A4A4A]/60 hover:text-[#4A4A4A] mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Jobs
      </button>

      <Card>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-[#4A4A4A]">{job.familyId?.householdName || 'Family'}</h1>
              <p className="text-sm text-[#4A4A4A]/60 flex items-center gap-1 mt-1">
                <MapPin className="w-4 h-4" /> {job.city}, {job.state} {job.postalCode || ''}
              </p>
            </div>
            {(job.responseStatus === 'interested' || isSelected) && (
              <span
                className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                style={{
                  backgroundColor: isSelected ? '#D4EDDA' : '#FFF3CD',
                  color: isSelected ? '#155724' : '#856404'
                }}
              >
                {isSelected ? 'Selected!' : 'Interested'}
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start gap-2">
              <Clock className="w-5 h-5 mt-0.5" style={{ color: '#E8A0BF' }} />
              <div>
                <p className="font-medium text-[#4A4A4A]">{formatDate(job.date)}</p>
                <p className="text-sm text-[#4A4A4A]/60">{job.startTime} - {job.endTime}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 mt-0.5" style={{ color: '#E8A0BF' }} />
              <div>
                <p className="font-medium text-[#4A4A4A]">{job.numberOfChildren} {job.numberOfChildren === 1 ? 'Child' : 'Children'}</p>
                {job.childrenAges?.length > 0 && <p className="text-sm text-[#4A4A4A]/60">Ages: {job.childrenAges.join(', ')}</p>}
              </div>
            </div>
          </div>

          {job.notes && (
            <div>
              <p className="text-sm font-medium text-[#4A4A4A]/60 mb-1">Notes</p>
              <p className="text-sm text-[#4A4A4A]">{job.notes}</p>
            </div>
          )}
          {job.specialInstructions && (
            <div>
              <p className="text-sm font-medium text-[#4A4A4A]/60 mb-1">Special Instructions</p>
              <p className="text-sm text-[#4A4A4A]">{job.specialInstructions}</p>
            </div>
          )}

          {/* Contact info unlocks once selected */}
          {isSelected && (
            <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: '#F5D5E5' }}>
              <div>
                <p className="text-sm font-medium text-[#4A4A4A] mb-1">Booking Address</p>
                <p className="text-sm text-[#4A4A4A]">{job.address}</p>
                <p className="text-sm text-[#4A4A4A]/70">{job.city}, {job.state} {job.postalCode || ''}</p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-[#4A4A4A]">Family Contact</p>
                {job.familyId?.phone && (
                  <a href={`tel:${job.familyId.phone}`} className="block text-sm text-[#4A4A4A] hover:underline">
                    {job.familyId.phone}
                  </a>
                )}
                {job.familyId?.email && (
                  <a href={`mailto:${job.familyId.email}`} className="block text-sm text-[#4A4A4A] hover:underline">
                    {job.familyId.email}
                  </a>
                )}
                {!job.familyId?.phone && !job.familyId?.email && (
                  <p className="text-sm text-[#4A4A4A]/60">No contact details have been added yet.</p>
                )}
              </div>

              {job.familyId?.emergencyContact && (
                <div className="pt-2 border-t border-[#E8A0BF]/30">
                  <p className="text-xs font-medium text-[#4A4A4A]/60 mb-1">Emergency Contact</p>
                  <p className="text-sm text-[#4A4A4A]">{job.familyId.emergencyContact.name}</p>
                  <p className="text-sm text-[#4A4A4A]/70">{job.familyId.emergencyContact.relationship}</p>
                  <a href={`tel:${job.familyId.emergencyContact.phone}`} className="text-sm text-[#4A4A4A] hover:underline">
                    {job.familyId.emergencyContact.phone}
                  </a>
                </div>
              )}
            </div>
          )}

          {!job.isAvailable && job.responseStatus !== 'interested' && !isSelected && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-yellow-50 text-yellow-700">
              <AlertCircle className="w-4 h-4" /> You have a scheduling conflict for this time
            </div>
          )}

          {/* Actions */}
          <div className="pt-2">
            {isSelected ? (
              <p className="text-sm font-medium text-green-700">You've been selected for this booking!</p>
            ) : job.responseStatus === 'interested' ? (
              <Button onClick={handleWithdraw} disabled={acting} variant="outline" className="text-red-500 border-red-200 hover:bg-red-50">
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><X className="w-4 h-4 mr-2" /> Withdraw Interest</>}
              </Button>
            ) : (
              <Button
                onClick={handleRespond}
                disabled={!job.isAvailable || acting}
                style={{ backgroundColor: '#E8A0BF' }}
                className="text-white hover:opacity-90"
              >
                {acting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-2" /> I'm Interested</>}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
