import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Clock, MapPin, Users, ArrowRight } from "lucide-react";
import { formatDateOnly } from "@/lib/dateOnly";

const API_URL = import.meta.env.VITE_API_URL || '';

interface Request {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  city: string;
  state: string;
  numberOfChildren: number;
  status: string;
  responseCount?: number;
  confirmedSitterId?: {
    firstName: string;
    lastName: string;
  };
}

export default function FamilyRequests() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState<Request[]>([]);
  const [filter, setFilter] = useState<'all' | 'active' | 'past'>('all');

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const fetchRequests = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sitting/family/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateOnly(dateStr, {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: '#FFF3CD', text: '#856404' };
      case 'responses_received':
        return { bg: '#CCE5FF', text: '#004085' };
      case 'confirmed':
        return { bg: '#D4EDDA', text: '#155724' };
      case 'completed':
        return { bg: '#E2E8F0', text: '#475569' };
      case 'cancelled':
        return { bg: '#FED7D7', text: '#9B2C2C' };
      default:
        return { bg: '#F0F0F0', text: '#4A4A4A' };
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'open':
        return 'Looking for Sitters';
      case 'responses_received':
        return 'Has Responses';
      case 'confirmed':
        return 'Sitter Confirmed';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const filteredRequests = requests.filter(request => {
    if (filter === 'active') {
      return ['open', 'responses_received', 'confirmed'].includes(request.status);
    }
    if (filter === 'past') {
      return ['completed', 'cancelled'].includes(request.status);
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#C77DA3' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold font-heading text-[#4A4A4A]">My Requests</h1>
        <Link to="/sitting/family/request">
          <Button style={{ backgroundColor: '#C77DA3' }} className="text-white hover:opacity-90">
            <PlusCircle className="w-4 h-4 mr-2" /> New Request
          </Button>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6">
        {(['all', 'active', 'past'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-all ${
              filter === f
                ? 'text-white'
                : 'text-[#4A4A4A]/60 hover:text-[#4A4A4A]'
            }`}
            style={{ backgroundColor: filter === f ? '#C77DA3' : '#F0F0F0' }}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#F5D5E5' }}
            >
              <Clock className="w-8 h-8" style={{ color: '#C77DA3' }} />
            </div>
            <h2 className="text-lg font-medium text-[#4A4A4A] mb-2">No Requests Found</h2>
            <p className="text-[#4A4A4A]/60 mb-6">
              {filter === 'all'
                ? "You haven't posted any babysitting requests yet."
                : filter === 'active'
                ? "No active requests. Post a new one!"
                : "No past requests to show."}
            </p>
            {filter !== 'past' && (
              <Link to="/sitting/family/request">
                <Button variant="outline" style={{ borderColor: '#C77DA3', color: '#C77DA3' }}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Create Request
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredRequests.map((request) => {
            const statusColors = getStatusColor(request.status);
            return (
              <Link key={request._id} to={`/sitting/family/requests/${request._id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-[#4A4A4A]">
                            {formatDate(request.date)}
                          </h3>
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                          >
                            {getStatusLabel(request.status)}
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm text-[#4A4A4A]/70">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {request.startTime} - {request.endTime}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {request.city}, {request.state}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {request.numberOfChildren} {request.numberOfChildren === 1 ? 'child' : 'children'}
                          </div>
                        </div>

                        {request.status === 'confirmed' && request.confirmedSitterId && (
                          <p className="mt-2 text-sm" style={{ color: '#C77DA3' }}>
                            Sitter: {request.confirmedSitterId.firstName} {request.confirmedSitterId.lastName}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-4">
                        {request.responseCount && request.responseCount > 0 && ['open', 'responses_received'].includes(request.status) && (
                          <div className="text-center">
                            <p className="text-2xl font-bold" style={{ color: '#C77DA3' }}>{request.responseCount}</p>
                            <p className="text-xs text-[#4A4A4A]/60">{request.responseCount === 1 ? 'response' : 'responses'}</p>
                          </div>
                        )}
                        <ArrowRight className="w-5 h-5 text-[#4A4A4A]/40" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
