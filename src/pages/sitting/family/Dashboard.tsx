import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { PlusCircle, Clock, Calendar, ArrowRight, Users, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateOnly } from "@/lib/dateOnly";
import { formatDisplayTimeRange } from "@/lib/timeFormat";

const API_URL = import.meta.env.VITE_API_URL || '';

interface Profile {
  householdName: string;
  status: string;
  membershipStatus: string;
  membershipExpiresAt: string;
  children: { name: string; age: number }[];
}

interface Request {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  numberOfChildren: number;
  responseCount?: number;
}

interface Booking {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  confirmedSitterId: {
    firstName: string;
    lastName: string;
    averageRating?: number;
    reviewCount?: number;
  };
}

function SitterRatingSummary({
  averageRating,
  reviewCount
}: {
  averageRating?: number;
  reviewCount?: number;
}) {
  if (!reviewCount) {
    return null;
  }

  return (
    <p className="mt-1 flex items-center gap-1 text-xs text-[#4A4A4A]/70">
      <Star className="h-3.5 w-3.5" style={{ color: '#C77DA3' }} fill="#C77DA3" />
      {(averageRating || 0).toFixed(1)}
      <span className="text-[#4A4A4A]/40">
        ({reviewCount} {reviewCount === 1 ? 'review' : 'reviews'})
      </span>
    </p>
  );
}

export default function FamilyDashboard() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [requests, setRequests] = useState<Request[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [token]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [profileRes, requestsRes, bookingsRes] = await Promise.all([
        fetch(`${API_URL}/api/sitting/family/profile`, { headers }),
        fetch(`${API_URL}/api/sitting/family/requests?upcoming=true`, { headers }),
        fetch(`${API_URL}/api/sitting/family/bookings?upcoming=true`, { headers })
      ]);

      const [profileData, requestsData, bookingsData] = await Promise.all([
        profileRes.json(),
        requestsRes.json(),
        bookingsRes.json()
      ]);

      if (profileData.success) setProfile(profileData.profile);
      if (requestsData.success) setRequests(requestsData.requests?.slice(0, 3) || []);
      if (bookingsData.success) setBookings(bookingsData.bookings?.slice(0, 3) || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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
      default:
        return { bg: '#F0F0F0', text: '#4A4A4A' };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#C77DA3' }}></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between gap-3 mb-6">
        <h1 className="min-w-0 flex-1 text-xl sm:text-2xl font-bold font-heading leading-tight text-[#4A4A4A]">
          Dashboard
        </h1>
        <Link to="/sitting/family/request" className="shrink-0">
          <Button style={{ backgroundColor: '#C77DA3' }} className="h-10 whitespace-nowrap px-3 text-sm text-white hover:opacity-90">
            <PlusCircle className="w-4 h-4 mr-2" /> New Request
          </Button>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="hidden grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4A4A4A]/70 flex items-center gap-2">
              <Clock className="w-4 h-4" style={{ color: '#C77DA3' }} />
              Active Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: '#C77DA3' }}>
              {requests.filter(r => ['open', 'responses_received'].includes(r.status)).length}
            </p>
            <p className="text-xs text-[#4A4A4A]/60">awaiting sitters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4A4A4A]/70 flex items-center gap-2">
              <Calendar className="w-4 h-4" style={{ color: '#E8A0BF' }} />
              Upcoming Bookings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: '#E8A0BF' }}>{bookings.length}</p>
            <p className="text-xs text-[#4A4A4A]/60">confirmed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-[#4A4A4A]/70 flex items-center gap-2">
              <Users className="w-4 h-4" style={{ color: '#8BA99E' }} />
              Children
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold" style={{ color: '#8BA99E' }}>
              {profile?.children?.length || 0}
            </p>
            <p className="text-xs text-[#4A4A4A]/60">registered</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Requests */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-heading text-[#4A4A4A]">Active Requests</h2>
          <Link
            to="/sitting/family/requests"
            className="text-sm flex items-center gap-1 hover:underline"
            style={{ color: '#C77DA3' }}
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {requests.filter(r => ['open', 'responses_received'].includes(r.status)).length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-[#4A4A4A]/60 mb-4">No active requests. Need a sitter?</p>
              <Link to="/sitting/family/request">
                <Button variant="outline" style={{ borderColor: '#C77DA3', color: '#C77DA3' }}>
                  <PlusCircle className="w-4 h-4 mr-2" /> Create Request
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {requests.filter(r => ['open', 'responses_received'].includes(r.status)).map((request) => {
              const statusColors = getStatusColor(request.status);
              return (
                <Link key={request._id} to={`/sitting/family/requests/${request._id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="py-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-[#4A4A4A]">
                            {formatDate(request.date)}
                          </p>
                          <p className="text-sm text-[#4A4A4A]/60">
                            {formatDisplayTimeRange(request.startTime, request.endTime)} | {request.numberOfChildren} {request.numberOfChildren === 1 ? 'child' : 'children'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {request.responseCount && request.responseCount > 0 && (
                            <span className="text-sm font-medium" style={{ color: '#C77DA3' }}>
                              {request.responseCount} {request.responseCount === 1 ? 'response' : 'responses'}
                            </span>
                          )}
                          <span
                            className="px-2 py-1 rounded-full text-xs font-medium capitalize"
                            style={{ backgroundColor: statusColors.bg, color: statusColors.text }}
                          >
                            {request.status.replace('_', ' ')}
                          </span>
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

      {/* Upcoming Bookings */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold font-heading text-[#4A4A4A]">Upcoming Bookings</h2>
          <Link
            to="/sitting/family/bookings"
            className="text-sm flex items-center gap-1 hover:underline"
            style={{ color: '#E8A0BF' }}
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {bookings.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-[#4A4A4A]/60">
              No upcoming bookings yet.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <Card key={booking._id}>
                <CardContent className="py-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-[#4A4A4A]">
                        {formatDate(booking.date)}
                      </p>
                      <p className="text-sm text-[#4A4A4A]/60">
                        {formatDisplayTimeRange(booking.startTime, booking.endTime)}
                      </p>
                      <p className="text-sm" style={{ color: '#C77DA3' }}>
                        Sitter: {booking.confirmedSitterId?.firstName} {booking.confirmedSitterId?.lastName}
                      </p>
                      <SitterRatingSummary
                        averageRating={booking.confirmedSitterId?.averageRating}
                        reviewCount={booking.confirmedSitterId?.reviewCount}
                      />
                    </div>
                    <span
                      className="px-2 py-1 rounded-full text-xs font-medium"
                      style={{ backgroundColor: '#D4EDDA', color: '#155724' }}
                    >
                      Confirmed
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
