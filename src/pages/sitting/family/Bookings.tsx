import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, User, Phone, Mail, Check, Star, Loader2, List, CalendarDays, RotateCcw, X } from "lucide-react";
import { BookingCalendar } from "@/components/sitting/BookingCalendar";
import { formatHourlyRate, getApplicableHourlyRate, rateContextLabel } from "@/lib/sitterRates";

const API_URL = import.meta.env.VITE_API_URL || '';

interface Booking {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  numberOfChildren: number;
  childrenAges?: number[];
  notes?: string;
  specialInstructions?: string;
  status: string;
  payment?: {
    status: 'unpaid' | 'paid' | 'refunded';
    amountCents?: number;
  };
  confirmedSitterId: {
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    profilePhoto?: string;
    hourlyRate: number;
    hourlyRate1Kid?: number;
    hourlyRate2Kids?: number;
    hourlyRate3PlusKids?: number;
  };
}

const formatCents = (cents?: number) =>
  typeof cents === 'number' ? `$${(cents / 100).toFixed(2)}` : '';

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hover, setHover] = useState(0);
  const active = hover || value;
  return (
    <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
      {[1, 2, 3, 4, 5].map((n) => {
        const on = n <= active;
        return (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className="w-6 h-6 transition-colors"
              style={{ color: on ? '#C77DA3' : '#E8A0BF' }}
              fill={on ? '#C77DA3' : 'none'}
            />
          </button>
        );
      })}
    </div>
  );
}

export default function FamilyBookings() {
  const { token } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleBookAgain = (booking: Booking) => {
    navigate('/sitting/family/request', {
      state: {
        repeat: {
          startTime: booking.startTime,
          endTime: booking.endTime,
          numberOfChildren: booking.numberOfChildren,
          childrenAges: booking.childrenAges?.join(', '),
          notes: booking.notes,
          specialInstructions: booking.specialInstructions,
          address: booking.address,
          city: booking.city,
          state: booking.state,
          postalCode: booking.postalCode,
        },
      },
    });
  };
  const [loading, setLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Review state
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [token]);

  // Returning from Stripe Checkout (booking payment) — show a toast and clean the URL.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payment = params.get('payment');
    if (payment === 'success') {
      toast({ title: 'Payment received', description: 'Thanks! Your sitter has been notified.' });
    } else if (payment === 'cancelled') {
      toast({ title: 'Payment cancelled', description: 'You can pay anytime from this page.', variant: 'destructive' });
    }
    if (payment) {
      window.history.replaceState({}, '', window.location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBookings = async () => {
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        fetch(`${API_URL}/api/sitting/family/bookings?upcoming=true`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/sitting/family/requests?status=completed`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [upcomingData, pastData] = await Promise.all([
        upcomingRes.json(),
        pastRes.json()
      ]);

      if (upcomingData.success) setUpcomingBookings(upcomingData.bookings || []);
      if (pastData.success) {
        const past: Booking[] = pastData.requests || [];
        setPastBookings(past);
        // Determine which completed bookings already have a review
        const checks = await Promise.all(
          past.map(async (b) => {
            try {
              const r = await fetch(`${API_URL}/api/sitting/family/bookings/${b._id}/review`, {
                headers: { Authorization: `Bearer ${token}` }
              });
              const d = await r.json();
              return d.success && d.review ? b._id : null;
            } catch {
              return null;
            }
          })
        );
        setReviewedIds(new Set(checks.filter(Boolean) as string[]));
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (id: string) => {
    setActioningId(id);
    try {
      const res = await fetch(`${API_URL}/api/sitting/family/bookings/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Booking completed', description: 'Please leave a quick review for your sitter.' });
        await fetchBookings();
        setActiveTab('past');
        openReview(id);
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to complete booking', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setActioningId(null);
    }
  };

  const openReview = (id: string) => {
    setReviewingId(id);
    setReviewRating(0);
    setReviewComment('');
  };

  const closeReview = () => {
    setReviewingId(null);
    setReviewRating(0);
    setReviewComment('');
  };

  const submitReview = async (id: string) => {
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/sitting/family/bookings/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Thanks for your review!' });
        setReviewedIds((prev) => new Set(prev).add(id));
        closeReview();
      } else {
        if (data.message?.toLowerCase().includes('already')) {
          setReviewedIds((prev) => new Set(prev).add(id));
          closeReview();
        }
        toast({ title: 'Error', description: data.message || 'Failed to submit review', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isToday = (dateStr: string) => {
    const today = new Date();
    const date = new Date(dateStr);
    return today.toDateString() === date.toDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#C77DA3' }}></div>
      </div>
    );
  }

  const bookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;
  const reviewingBooking = reviewingId
    ? [...upcomingBookings, ...pastBookings].find((booking) => booking._id === reviewingId)
    : null;

  return (
    <div>
      {reviewingBooking && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-[#4A4A4A]">Review your sitter</h2>
                <p className="text-sm text-[#4A4A4A]/60">
                  {reviewingBooking.confirmedSitterId?.firstName} {reviewingBooking.confirmedSitterId?.lastName}
                </p>
              </div>
              <button
                type="button"
                onClick={closeReview}
                aria-label="Close review"
                className="rounded-full p-1 text-[#4A4A4A]/50 hover:bg-gray-100 hover:text-[#4A4A4A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              <StarRating value={reviewRating} onChange={setReviewRating} />
              <Textarea
                placeholder="Share how it went (optional)"
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                rows={4}
              />
              <div className="flex gap-2">
                <Button
                  onClick={() => submitReview(reviewingBooking._id)}
                  disabled={submittingReview || reviewRating === 0}
                  size="sm"
                  style={{ backgroundColor: '#C77DA3' }}
                  className="flex-1 text-white hover:opacity-90"
                >
                  {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                </Button>
                <Button onClick={closeReview} size="sm" variant="outline">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-[#4A4A4A]">My Bookings</h1>
        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-full" style={{ backgroundColor: '#F0F0F0' }}>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'list' ? 'text-white' : 'text-[#4A4A4A]/60'}`}
            style={{ backgroundColor: view === 'list' ? '#C77DA3' : 'transparent' }}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'calendar' ? 'text-white' : 'text-[#4A4A4A]/60'}`}
            style={{ backgroundColor: view === 'calendar' ? '#C77DA3' : 'transparent' }}
          >
            <CalendarDays className="w-4 h-4" /> Calendar
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <BookingCalendar bookings={[...upcomingBookings, ...pastBookings]} viewerRole="family" />
      ) : (
        <>
          {/* Tabs */}
          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'upcoming'
                  ? 'text-white'
                  : 'text-[#4A4A4A]/60 hover:text-[#4A4A4A]'
              }`}
              style={{ backgroundColor: activeTab === 'upcoming' ? '#C77DA3' : '#F0F0F0' }}
            >
              Upcoming ({upcomingBookings.length})
            </button>
            <button
              onClick={() => setActiveTab('past')}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeTab === 'past'
                  ? 'text-white'
                  : 'text-[#4A4A4A]/60 hover:text-[#4A4A4A]'
              }`}
              style={{ backgroundColor: activeTab === 'past' ? '#C77DA3' : '#F0F0F0' }}
            >
              Past ({pastBookings.length})
            </button>
          </div>

          {bookings.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{ backgroundColor: '#F5D5E5' }}
                >
                  <Clock className="w-8 h-8" style={{ color: '#C77DA3' }} />
                </div>
                <h2 className="text-lg font-medium text-[#4A4A4A] mb-2">
                  {activeTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past Bookings'}
                </h2>
                <p className="text-[#4A4A4A]/60">
                  {activeTab === 'upcoming'
                    ? 'Post a request to find a sitter!'
                    : 'Your completed bookings will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking._id} className={isToday(booking.date) ? 'ring-2 ring-[#C77DA3]' : ''}>
                  <CardContent className="p-6">
                    {isToday(booking.date) && (
                      <div className="mb-4 px-3 py-1 rounded-full text-xs font-medium inline-block" style={{ backgroundColor: '#C77DA3', color: 'white' }}>
                        TODAY
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-start gap-6">
                      {/* Booking Info */}
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#4A4A4A] mb-4">
                          {formatDate(booking.date)}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 mt-0.5" style={{ color: '#C77DA3' }} />
                            <div>
                              <p className="font-medium text-[#4A4A4A]">Time</p>
                              <p className="text-sm text-[#4A4A4A]/60">{booking.startTime} - {booking.endTime}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5" style={{ color: '#C77DA3' }} />
                            <div>
                              <p className="font-medium text-[#4A4A4A]">Location</p>
                              <p className="text-sm text-[#4A4A4A]/60">{booking.city}, {booking.state}</p>
                            </div>
                          </div>
                        </div>

                        {/* Mark complete (upcoming/confirmed) */}
                        {activeTab === 'upcoming' && (
                          <Button
                            onClick={() => handleComplete(booking._id)}
                            disabled={actioningId === booking._id}
                            size="sm"
                            style={{ backgroundColor: '#C77DA3' }}
                            className="text-white hover:opacity-90"
                          >
                            {actioningId === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Mark Complete</>}
                          </Button>
                        )}

                        {booking.payment?.status === 'paid' && (
                          <div className="mt-3">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#D4EDDA', color: '#155724' }}>
                              <Check className="w-4 h-4" /> Paid{booking.payment.amountCents ? ` · ${formatCents(booking.payment.amountCents)}` : ''}
                            </span>
                          </div>
                        )}

                        {/* Review (past/completed) */}
                        {activeTab === 'past' && booking.confirmedSitterId && (
                          <div className="mt-2">
                            {reviewedIds.has(booking._id) ? (
                              <span className="inline-flex items-center gap-1 text-sm text-[#4A4A4A]/60">
                                <Check className="w-4 h-4" style={{ color: '#C77DA3' }} /> Review submitted
                              </span>
                            ) : (
                              <Button
                                onClick={() => openReview(booking._id)}
                                size="sm"
                                variant="outline"
                                className="border-[#C77DA3] text-[#C77DA3] hover:bg-[#F5D5E5]"
                              >
                                <Star className="w-4 h-4 mr-1" /> Leave a Review
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Book Again (past bookings) — prefills a new request */}
                        {activeTab === 'past' && (
                          <div className="mt-3">
                            <Button
                              onClick={() => handleBookAgain(booking)}
                              size="sm"
                              variant="outline"
                              className="border-[#C77DA3] text-[#C77DA3] hover:bg-[#F5D5E5]"
                            >
                              <RotateCcw className="w-4 h-4 mr-1" /> Book Again
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Sitter Info */}
                      {booking.confirmedSitterId && (
                        <div className="md:w-72 p-4 rounded-xl" style={{ backgroundColor: '#F5D5E5' }}>
                          <div className="flex items-center gap-3 mb-4">
                            <div
                              className="w-12 h-12 rounded-full flex items-center justify-center"
                              style={{ backgroundColor: 'white' }}
                            >
                              {booking.confirmedSitterId.profilePhoto ? (
                                <img
                                  src={booking.confirmedSitterId.profilePhoto}
                                  alt=""
                                  className="w-full h-full rounded-full object-cover"
                                />
                              ) : (
                                <User className="w-6 h-6" style={{ color: '#C77DA3' }} />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-[#4A4A4A]">
                                {booking.confirmedSitterId.firstName} {booking.confirmedSitterId.lastName}
                              </p>
                              <p className="text-sm text-[#4A4A4A]/60">
                                {formatHourlyRate(getApplicableHourlyRate(booking.confirmedSitterId, booking.numberOfChildren))}/hour {rateContextLabel(booking.numberOfChildren)}
                              </p>
                            </div>
                          </div>

                          {activeTab === 'upcoming' && (
                            <div className="space-y-2">
                              {booking.confirmedSitterId.phone && (
                                <a
                                  href={`tel:${booking.confirmedSitterId.phone}`}
                                  className="flex items-center gap-2 text-sm text-[#4A4A4A] hover:underline"
                                >
                                  <Phone className="w-4 h-4" />
                                  {booking.confirmedSitterId.phone}
                                </a>
                              )}
                              {booking.confirmedSitterId.email && (
                                <a
                                  href={`mailto:${booking.confirmedSitterId.email}`}
                                  className="flex items-center gap-2 text-sm text-[#4A4A4A] hover:underline"
                                >
                                  <Mail className="w-4 h-4" />
                                  {booking.confirmedSitterId.email}
                                </a>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
