import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Clock, Users, Phone, Mail, Check, X, Loader2, List, CalendarDays, DollarSign, Star } from "lucide-react";
import { BookingCalendar } from "@/components/sitting/BookingCalendar";
import { formatDateOnly, isSameDateOnly } from "@/lib/dateOnly";

const API_URL = import.meta.env.VITE_API_URL || '';

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
            <Star className="w-6 h-6 transition-colors" style={{ color: on ? '#C77DA3' : '#E8A0BF' }} fill={on ? '#C77DA3' : 'none'} />
          </button>
        );
      })}
    </div>
  );
}

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
  childrenAges: number[];
  notes?: string;
  specialInstructions?: string;
  status: string;
  payment?: {
    status: 'unpaid' | 'paid' | 'refunded';
    amountCents?: number;
  };
  familyId: {
    householdName: string;
    phone?: string;
    email?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
  };
}

export default function SitterBookings() {
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<Booking[]>([]);
  const [pastBookings, setPastBookings] = useState<Booking[]>([]);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Review state (sitter reviews the family)
  const [reviewedIds, setReviewedIds] = useState<Set<string>>(new Set());
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, [token]);

  const fetchBookings = async () => {
    try {
      const [upcomingRes, pastRes] = await Promise.all([
        fetch(`${API_URL}/api/sitter/bookings?upcoming=true`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/sitter/bookings?status=completed`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const [upcomingData, pastData] = await Promise.all([
        upcomingRes.json(),
        pastRes.json()
      ]);

      if (upcomingData.success) setUpcomingBookings(upcomingData.bookings || []);
      if (pastData.success) {
        const past: Booking[] = pastData.bookings || [];
        setPastBookings(past);
        // Determine which completed bookings the sitter has already reviewed
        const checks = await Promise.all(
          past.map(async (b) => {
            try {
              const r = await fetch(`${API_URL}/api/sitter/bookings/${b._id}/review`, {
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

  const openReview = (id: string) => {
    setReviewingId(id);
    setReviewRating(0);
    setReviewComment('');
  };

  const submitReview = async (id: string) => {
    setSubmittingReview(true);
    try {
      const res = await fetch(`${API_URL}/api/sitter/bookings/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ rating: reviewRating, comment: reviewComment })
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Thanks for your review!' });
        setReviewedIds((prev) => new Set(prev).add(id));
        setReviewingId(null);
      } else {
        if (data.message?.toLowerCase().includes('already')) {
          setReviewedIds((prev) => new Set(prev).add(id));
          setReviewingId(null);
        }
        toast({ title: 'Error', description: data.message || 'Failed to submit review', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleComplete = async (id: string) => {
    setActioningId(id);
    try {
      const res = await fetch(`${API_URL}/api/sitter/bookings/${id}/complete`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Booking completed', description: 'Moved to your past bookings.' });
        fetchBookings();
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to complete booking', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setActioningId(null);
    }
  };

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this booking? The family will be notified and the request will reopen for other sitters.')) return;
    setActioningId(id);
    try {
      const res = await fetch(`${API_URL}/api/sitter/bookings/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: 'Booking cancelled', description: 'The family has been notified.' });
        fetchBookings();
      } else {
        toast({ title: 'Error', description: data.message || 'Failed to cancel booking', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Error', description: 'Something went wrong. Please try again.', variant: 'destructive' });
    } finally {
      setActioningId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    return formatDateOnly(dateStr, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const isToday = (dateStr: string) => {
    return isSameDateOnly(dateStr, new Date());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#E8A0BF' }}></div>
      </div>
    );
  }

  const bookings = activeTab === 'upcoming' ? upcomingBookings : pastBookings;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-heading text-[#4A4A4A]">My Bookings</h1>
        {/* View toggle */}
        <div className="flex gap-1 p-1 rounded-full" style={{ backgroundColor: '#F0F0F0' }}>
          <button
            onClick={() => setView('list')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'list' ? 'text-white' : 'text-[#4A4A4A]/60'}`}
            style={{ backgroundColor: view === 'list' ? '#E8A0BF' : 'transparent' }}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button
            onClick={() => setView('calendar')}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${view === 'calendar' ? 'text-white' : 'text-[#4A4A4A]/60'}`}
            style={{ backgroundColor: view === 'calendar' ? '#E8A0BF' : 'transparent' }}
          >
            <CalendarDays className="w-4 h-4" /> Calendar
          </button>
        </div>
      </div>

      {view === 'calendar' ? (
        <BookingCalendar bookings={[...upcomingBookings, ...pastBookings]} viewerRole="sitter" />
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
              style={{ backgroundColor: activeTab === 'upcoming' ? '#E8A0BF' : '#F0F0F0' }}
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
              style={{ backgroundColor: activeTab === 'past' ? '#E8A0BF' : '#F0F0F0' }}
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
                  <Clock className="w-8 h-8" style={{ color: '#E8A0BF' }} />
                </div>
                <h2 className="text-lg font-medium text-[#4A4A4A] mb-2">
                  {activeTab === 'upcoming' ? 'No Upcoming Bookings' : 'No Past Bookings'}
                </h2>
                <p className="text-[#4A4A4A]/60">
                  {activeTab === 'upcoming'
                    ? 'Browse available jobs to find your next booking!'
                    : 'Your completed bookings will appear here.'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {bookings.map((booking) => (
                <Card key={booking._id} className={isToday(booking.date) ? 'ring-2 ring-[#E8A0BF]' : ''}>
                  <CardContent className="p-6">
                    {isToday(booking.date) && (
                      <div className="mb-4 px-3 py-1 rounded-full text-xs font-medium inline-block" style={{ backgroundColor: '#E8A0BF', color: 'white' }}>
                        TODAY
                      </div>
                    )}

                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-[#4A4A4A] mb-2">
                          {booking.familyId?.householdName || 'Family'}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-start gap-2">
                            <Clock className="w-4 h-4 mt-0.5" style={{ color: '#E8A0BF' }} />
                            <div>
                              <p className="font-medium text-[#4A4A4A]">{formatDate(booking.date)}</p>
                              <p className="text-sm text-[#4A4A4A]/60">{booking.startTime} - {booking.endTime}</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 mt-0.5" style={{ color: '#E8A0BF' }} />
                            <div>
                              <p className="font-medium text-[#4A4A4A]">{booking.address}</p>
                              <p className="text-sm text-[#4A4A4A]/60">{booking.city}, {booking.state} {booking.postalCode}</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-[#4A4A4A]/70 mb-4">
                          <Users className="w-4 h-4" style={{ color: '#E8A0BF' }} />
                          <span>{booking.numberOfChildren} {booking.numberOfChildren === 1 ? 'child' : 'children'}</span>
                          {booking.childrenAges?.length > 0 && (
                            <span className="text-[#4A4A4A]/40">| Ages: {booking.childrenAges.join(', ')}</span>
                          )}
                        </div>

                        {booking.notes && (
                          <p className="text-sm text-[#4A4A4A]/70 mb-4">
                            <strong>Notes:</strong> {booking.notes}
                          </p>
                        )}

                        {booking.specialInstructions && (
                          <p className="text-sm text-[#4A4A4A]/70 mb-4">
                            <strong>Special Instructions:</strong> {booking.specialInstructions}
                          </p>
                        )}

                        {booking.payment?.status === 'paid' && (
                          <div className="mb-4">
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: '#D4EDDA', color: '#155724' }}>
                              <DollarSign className="w-4 h-4" /> Paid{booking.payment.amountCents ? ` · $${(booking.payment.amountCents / 100).toFixed(2)}` : ''}
                            </span>
                          </div>
                        )}

                        {/* Review the family (past/completed) */}
                        {activeTab === 'past' && (
                          <div className="mt-2">
                            {reviewedIds.has(booking._id) ? (
                              <span className="inline-flex items-center gap-1 text-sm text-[#4A4A4A]/60">
                                <Check className="w-4 h-4" style={{ color: '#E8A0BF' }} /> Review submitted
                              </span>
                            ) : reviewingId === booking._id ? (
                              <div className="p-4 rounded-xl border border-[#F5D5E5] space-y-3">
                                <p className="text-sm font-medium text-[#4A4A4A]">Rate this family</p>
                                <StarRating value={reviewRating} onChange={setReviewRating} />
                                <Textarea
                                  placeholder="Share how it went (optional)"
                                  value={reviewComment}
                                  onChange={(e) => setReviewComment(e.target.value)}
                                  rows={3}
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => submitReview(booking._id)}
                                    disabled={submittingReview || reviewRating === 0}
                                    size="sm"
                                    style={{ backgroundColor: '#E8A0BF' }}
                                    className="text-white hover:opacity-90"
                                  >
                                    {submittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Submit Review'}
                                  </Button>
                                  <Button onClick={() => setReviewingId(null)} size="sm" variant="outline">
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <Button
                                onClick={() => openReview(booking._id)}
                                size="sm"
                                variant="outline"
                                className="border-[#E8A0BF] text-[#C77DA3] hover:bg-[#F5D5E5]"
                              >
                                <Star className="w-4 h-4 mr-1" /> Leave a Review
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Actions - only on upcoming (confirmed) bookings */}
                        {activeTab === 'upcoming' && (
                          <div className="flex flex-wrap gap-2">
                            <Button
                              onClick={() => handleComplete(booking._id)}
                              disabled={actioningId === booking._id}
                              size="sm"
                              style={{ backgroundColor: '#E8A0BF' }}
                              className="text-white hover:opacity-90"
                            >
                              {actioningId === booking._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4 mr-1" /> Mark Complete</>}
                            </Button>
                            <Button
                              onClick={() => handleCancel(booking._id)}
                              disabled={actioningId === booking._id}
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-200 hover:bg-red-50"
                            >
                              <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                          </div>
                        )}
                      </div>

                      {/* Contact Info - Only for confirmed/upcoming */}
                      {activeTab === 'upcoming' && (
                        <div className="md:w-64 p-4 rounded-xl" style={{ backgroundColor: '#F5D5E5' }}>
                          <h4 className="font-medium text-[#4A4A4A] mb-3">Contact Info</h4>
                          {booking.familyId?.phone && (
                            <a
                              href={`tel:${booking.familyId.phone}`}
                              className="flex items-center gap-2 text-sm text-[#4A4A4A]/70 hover:text-[#4A4A4A] mb-2"
                            >
                              <Phone className="w-4 h-4" />
                              {booking.familyId.phone}
                            </a>
                          )}
                          {booking.familyId?.email && (
                            <a
                              href={`mailto:${booking.familyId.email}`}
                              className="flex items-center gap-2 text-sm text-[#4A4A4A]/70 hover:text-[#4A4A4A] mb-4"
                            >
                              <Mail className="w-4 h-4" />
                              {booking.familyId.email}
                            </a>
                          )}

                          {booking.familyId?.emergencyContact && (
                            <div className="pt-3 border-t border-[#E8A0BF]/30">
                              <p className="text-xs font-medium text-[#4A4A4A]/60 mb-1">Emergency Contact</p>
                              <p className="text-sm text-[#4A4A4A]">{booking.familyId.emergencyContact.name}</p>
                              <p className="text-sm text-[#4A4A4A]/70">{booking.familyId.emergencyContact.relationship}</p>
                              <a
                                href={`tel:${booking.familyId.emergencyContact.phone}`}
                                className="text-sm hover:text-[#4A4A4A]"
                                style={{ color: '#C77DA3' }}
                              >
                                {booking.familyId.emergencyContact.phone}
                              </a>
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
