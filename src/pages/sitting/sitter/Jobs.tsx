import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Users, AlertCircle, Check, X, Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || '';

interface Job {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  address?: string;
  city: string;
  state: string;
  numberOfChildren: number;
  childrenAges: number[];
  notes?: string;
  specialInstructions?: string;
  familyId: {
    householdName: string;
    city: string;
    state: string;
  };
  isAvailable: boolean;
  hasResponded: boolean;
  responseStatus?: string;
}

export default function SitterJobs() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchJobs();
  }, [token]);

  const fetchJobs = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sitter/jobs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setJobs(data.jobs || []);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (jobId: string) => {
    setRespondingTo(jobId);
    try {
      const response = await fetch(`${API_URL}/api/sitter/jobs/${jobId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: '' })
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Interest Expressed",
          description: "The family has been notified of your interest."
        });
        fetchJobs(); // Refresh jobs
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to respond to job",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const handleWithdraw = async (jobId: string) => {
    setRespondingTo(jobId);
    try {
      const response = await fetch(`${API_URL}/api/sitter/jobs/${jobId}/respond`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Interest Withdrawn",
          description: "Your interest has been withdrawn."
        });
        fetchJobs();
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to withdraw",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setRespondingTo(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E8A0BF' }}></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold font-heading mb-6 text-[#4A4A4A]">Available Jobs</h1>

      {jobs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#F5D5E5' }}
            >
              <MapPin className="w-8 h-8" style={{ color: '#E8A0BF' }} />
            </div>
            <h2 className="text-lg font-medium text-[#4A4A4A] mb-2">No Jobs Available</h2>
            <p className="text-[#4A4A4A]/60">
              There are no babysitting jobs in your area right now. Check back soon!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <Card key={job._id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {/* Job Info */}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-[#4A4A4A]">
                          {job.familyId?.householdName || 'Family'}
                        </h3>
                        <p className="text-sm text-[#4A4A4A]/60 flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {job.city}, {job.state}
                        </p>
                      </div>
                      {/* Status Badge — only for active interest or selection */}
                      {(job.responseStatus === 'interested' || job.responseStatus === 'selected') && (
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium capitalize"
                          style={{
                            backgroundColor: job.responseStatus === 'selected' ? '#D4EDDA' : '#FFF3CD',
                            color: job.responseStatus === 'selected' ? '#155724' : '#856404'
                          }}
                        >
                          {job.responseStatus === 'selected' ? 'Selected!' : 'Interested'}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="flex items-center gap-2 text-sm text-[#4A4A4A]/70">
                        <Clock className="w-4 h-4" style={{ color: '#E8A0BF' }} />
                        <div>
                          <p className="font-medium text-[#4A4A4A]">{formatDate(job.date)}</p>
                          <p>{job.startTime} - {job.endTime}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#4A4A4A]/70">
                        <Users className="w-4 h-4" style={{ color: '#E8A0BF' }} />
                        <div>
                          <p className="font-medium text-[#4A4A4A]">{job.numberOfChildren} {job.numberOfChildren === 1 ? 'Child' : 'Children'}</p>
                          {job.childrenAges?.length > 0 && (
                            <p>Ages: {job.childrenAges.join(', ')}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {job.notes && (
                      <p className="text-sm text-[#4A4A4A]/70 mb-4">
                        {job.notes}
                      </p>
                    )}

                    {/* Availability Warning */}
                    {!job.isAvailable && job.responseStatus !== 'interested' && job.responseStatus !== 'selected' && (
                      <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-yellow-50 text-yellow-700 mb-4">
                        <AlertCircle className="w-4 h-4" />
                        You have a scheduling conflict for this time
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div
                    className="w-full md:w-48 p-6 flex flex-col justify-center gap-3"
                    style={{ backgroundColor: '#F5D5E5' }}
                  >
                    {job.responseStatus === 'selected' ? (
                      <p className="text-center text-sm font-medium text-green-700">
                        You've been selected!
                      </p>
                    ) : job.responseStatus === 'interested' ? (
                      <Button
                        onClick={() => handleWithdraw(job._id)}
                        disabled={respondingTo === job._id}
                        variant="outline"
                        className="w-full"
                      >
                        {respondingTo === job._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-2" /> Withdraw
                          </>
                        )}
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleRespond(job._id)}
                        disabled={!job.isAvailable || respondingTo === job._id}
                        style={{ backgroundColor: '#E8A0BF' }}
                        className="w-full text-white hover:opacity-90"
                      >
                        {respondingTo === job._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" /> I'm Interested
                          </>
                        )}
                      </Button>
                    )}
                    <Link to={`/sitting/sitter/jobs/${job._id}`}>
                      <Button variant="ghost" className="w-full text-[#4A4A4A]">
                        View Details
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
