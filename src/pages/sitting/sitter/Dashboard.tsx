import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Briefcase, Clock, Calendar, ChevronRight, Star, MapPin } from "lucide-react";
import { formatDateOnly } from "@/lib/dateOnly";
import { formatDisplayTimeRange } from "@/lib/timeFormat";

const API_URL = import.meta.env.VITE_API_URL || '';

interface Job {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  city: string;
  numberOfChildren: number;
  familyId?: { householdName?: string };
  hasResponded?: boolean;
}

interface Booking {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  familyId?: { householdName?: string };
}

export default function SitterDashboard() {
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ availableJobs: 0, upcomingBookings: 0, completedJobs: 0, rating: 0, reviewCount: 0 });
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);

  useEffect(() => {
    if (!token) return;
    fetchDashboard();
  }, [token]);

  const fetchDashboard = async () => {
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [profileRes, jobsRes, upcomingRes, completedRes] = await Promise.all([
        fetch(`${API_URL}/api/sitter/profile`, { headers }),
        fetch(`${API_URL}/api/sitter/jobs`, { headers }),
        fetch(`${API_URL}/api/sitter/bookings?upcoming=true`, { headers }),
        fetch(`${API_URL}/api/sitter/bookings?status=completed`, { headers }),
      ]);

      const [profileData, jobsData, upcomingData, completedData] = await Promise.all([
        profileRes.json(),
        jobsRes.json(),
        upcomingRes.json(),
        completedRes.json(),
      ]);

      const jobs: Job[] = jobsData.success ? (jobsData.jobs || []) : [];
      const upcoming: Booking[] = upcomingData.success ? (upcomingData.bookings || []) : [];
      const completed: Booking[] = completedData.success ? (completedData.bookings || []) : [];

      setRecentJobs(jobs.slice(0, 3));
      setUpcomingBookings(upcoming.slice(0, 3));
      setStats({
        availableJobs: jobs.length,
        upcomingBookings: upcoming.length,
        completedJobs: completed.length,
        rating: profileData.success ? (profileData.profile?.averageRating || 0) : 0,
        reviewCount: profileData.success ? (profileData.profile?.reviewCount || 0) : 0,
      });
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatShort = (dateStr: string) =>
    formatDateOnly(dateStr, { month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E8A0BF' }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="hidden grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-[#E8A0BF] to-[#C77DA3] rounded-2xl p-4 text-white">
          <Briefcase className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{stats.availableJobs}</p>
          <p className="text-sm opacity-80">Available Jobs</p>
        </div>

        <div className="bg-gradient-to-br from-[#C77DA3] to-[#9B5A80] rounded-2xl p-4 text-white">
          <Clock className="w-6 h-6 mb-2 opacity-80" />
          <p className="text-3xl font-bold">{stats.upcomingBookings}</p>
          <p className="text-sm opacity-80">Upcoming</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <Calendar className="w-6 h-6 mb-2" style={{ color: '#E8A0BF' }} />
          <p className="text-3xl font-bold text-[#4A4A4A]">{stats.completedJobs}</p>
          <p className="text-sm text-[#4A4A4A]/60">Completed</p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-gray-100">
          <Star className="w-6 h-6 mb-2 text-yellow-400 fill-yellow-400" />
          <p className="text-3xl font-bold text-[#4A4A4A]">{stats.reviewCount > 0 ? stats.rating.toFixed(1) : '—'}</p>
          {stats.reviewCount > 0 && (
            <p className="text-sm text-[#4A4A4A]/60">Rating ({stats.reviewCount})</p>
          )}
        </div>
      </div>

      {/* Available Jobs */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-[#4A4A4A]">Available Jobs</h2>
          <Link
            to="/sitting/sitter/jobs"
            className="text-sm flex items-center"
            style={{ color: '#E8A0BF' }}
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {recentJobs.length === 0 ? (
          <div className="bg-[#F5D5E5]/30 rounded-xl p-6 text-center">
            <Briefcase className="w-8 h-8 mx-auto mb-2" style={{ color: '#C77DA3' }} />
            <p className="text-[#4A4A4A]/60 text-sm">No open jobs right now</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentJobs.map(job => (
              <Link
                key={job._id}
                to={`/sitting/sitter/jobs/${job._id}`}
                className="block bg-white rounded-xl p-4 border border-gray-100 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[#4A4A4A]">{job.familyId?.householdName || 'Family'}</h3>
                    <p className="text-sm text-[#4A4A4A]/60 mt-1">
                      {formatShort(job.date)} • {formatDisplayTimeRange(job.startTime, job.endTime)}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs px-2 py-1 rounded-full bg-[#F5D5E5] text-[#C77DA3]">
                        {job.numberOfChildren} {job.numberOfChildren === 1 ? 'child' : 'children'}
                      </span>
                      <span className="text-xs text-[#4A4A4A]/50 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {job.city}
                      </span>
                      {job.hasResponded && (
                        <span className="text-xs text-green-600">Responded</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#4A4A4A]/30" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Bookings */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-[#4A4A4A]">Upcoming Bookings</h2>
          <Link
            to="/sitting/sitter/bookings"
            className="text-sm flex items-center"
            style={{ color: '#C77DA3' }}
          >
            See all <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {upcomingBookings.length === 0 ? (
          <div className="bg-[#F5D5E5]/30 rounded-xl p-6 text-center">
            <Clock className="w-8 h-8 mx-auto mb-2" style={{ color: '#C77DA3' }} />
            <p className="text-[#4A4A4A]/60 text-sm">No upcoming bookings</p>
            <Link
              to="/sitting/sitter/jobs"
              className="text-sm mt-2 inline-block"
              style={{ color: '#E8A0BF' }}
            >
              Browse available jobs →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBookings.map(booking => (
              <div
                key={booking._id}
                className="bg-gradient-to-r from-[#F5D5E5] to-white rounded-xl p-4 border-l-4"
                style={{ borderColor: '#C77DA3' }}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-[#4A4A4A]">{booking.familyId?.householdName || 'Family'}</h3>
                    <p className="text-sm text-[#4A4A4A]/60 mt-1">
                      {formatShort(booking.date)} • {formatDisplayTimeRange(booking.startTime, booking.endTime)}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-100 text-green-700 font-medium">
                    Confirmed
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-3">
        <Link
          to="/sitting/sitter/profile"
          className="bg-white rounded-xl p-4 border border-gray-100 text-center hover:shadow-md transition-shadow"
        >
          <Star className="w-6 h-6 mx-auto mb-2" style={{ color: '#C77DA3' }} />
          <p className="text-sm font-medium text-[#4A4A4A]">Edit Profile</p>
        </Link>
      </div>
    </div>
  );
}
