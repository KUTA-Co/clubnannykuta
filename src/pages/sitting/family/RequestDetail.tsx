import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Clock, MapPin, Users, User, Check, Loader2, Trash2, Star, Phone, Mail, X } from "lucide-react";
import { formatHourlyRate, getApplicableHourlyRate, rateContextLabel } from "@/lib/sitterRates";

const API_URL = import.meta.env.VITE_API_URL || '';

interface SitterResponse {
  _id: string;
  status: string;
  message?: string;
  respondedAt: string;
  sitterId: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePhoto?: string;
    bio?: string;
    experience?: string;
    age?: number;
    howDidYouHear?: string;
    hourlyRate: number;
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
    averageRating?: number;
    reviewCount?: number;
  };
  sitterReviews?: {
    _id: string;
    rating: number;
    comment?: string;
    createdAt: string;
    familyId?: { householdName?: string };
  }[];
}

interface Request {
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
  responses: SitterResponse[];
  confirmedSitterId?: {
    _id: string;
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

function hasText(value?: string | number | null) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

function ProfileField({ label, value }: { label: string; value?: string | number | null }) {
  if (!hasText(value)) return null;

  return (
    <div className="rounded-xl border border-[#F5D5E5] bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#4A4A4A]/45">{label}</p>
      <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed text-[#4A4A4A]">{value}</p>
    </div>
  );
}

function RateGrid({ sitter, numberOfChildren }: { sitter: SitterResponse['sitterId']; numberOfChildren: number }) {
  const activeCount = Math.max(1, Number(numberOfChildren) || 1);
  const rateItems = [
    { label: '1 child', count: 1 },
    { label: '2 children', count: 2 },
    { label: '3+ children', count: 3 }
  ];

  return (
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      {rateItems.map((item) => {
        const isActive =
          (activeCount === item.count) ||
          (activeCount >= 3 && item.count === 3);

        return (
          <div
            key={item.label}
            className="rounded-lg px-2 py-2"
            style={{ backgroundColor: isActive ? '#F5D5E5' : '#F7F7F7' }}
          >
            <p className="font-semibold text-[#4A4A4A]">{formatHourlyRate(getApplicableHourlyRate(sitter, item.count))}</p>
            <p className="text-[#4A4A4A]/50">{item.label}</p>
          </div>
        );
      })}
    </div>
  );
}

export default function RequestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [request, setRequest] = useState<Request | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<SitterResponse | null>(null);

  useEffect(() => {
    fetchRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, token]);

  const fetchRequest = async () => {
    try {
      const response = await fetch(`${API_URL}/api/sitting/family/requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();

      if (data.success) {
        setRequest(data.request);
      }
    } catch (error) {
      console.error('Error fetching request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSitter = async (sitterId: string) => {
    setConfirmingId(sitterId);
    try {
      const response = await fetch(`${API_URL}/api/sitting/family/requests/${id}/confirm`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ sitterId })
      });

      const result = await response.json();

      if (result.success) {
        if (result.request) {
          setRequest({ ...result.request, responses: result.request.responses || [] });
        }
        toast({
          title: "Sitter Confirmed!",
          description: "You can now see their contact information."
        });
        await fetchRequest();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to confirm sitter",
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
      setConfirmingId(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    setCancelling(true);
    try {
      const response = await fetch(`${API_URL}/api/sitting/family/requests/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Request Cancelled",
          description: "Your request has been cancelled."
        });
        navigate('/sitting/family/requests');
      } else {
        toast({
          title: "Error",
          description: result.message || "Failed to cancel request",
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
      setCancelling(false);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#C77DA3' }}></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="text-center py-12">
        <p className="text-[#4A4A4A]/60">Request not found</p>
      </div>
    );
  }

  const interestedResponses = request.responses?.filter(r => r.status === 'interested') || [];
  const isConfirmed = request.status === 'confirmed';
  const confirmedSitter = request.confirmedSitterId;
  const canCancel = ['open', 'responses_received'].includes(request.status);
  const confirmedRate = getApplicableHourlyRate(confirmedSitter, request.numberOfChildren);

  return (
    <div>
      {selectedResponse && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-white p-5">
              <div className="flex min-w-0 items-center gap-4">
                <div
                  className="h-16 w-16 shrink-0 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: '#F5D5E5' }}
                >
                  {selectedResponse.sitterId.profilePhoto ? (
                    <img
                      src={selectedResponse.sitterId.profilePhoto}
                      alt=""
                      className="h-full w-full rounded-full object-cover"
                    />
                  ) : (
                    <User className="h-8 w-8" style={{ color: '#C77DA3' }} />
                  )}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-bold text-[#4A4A4A]">
                    {selectedResponse.sitterId.firstName} {selectedResponse.sitterId.lastName}
                  </h2>
                  <p className="text-sm text-[#4A4A4A]/60">
                    {selectedResponse.sitterId.age ? `Age ${selectedResponse.sitterId.age} • ` : ''}
                    {selectedResponse.sitterId.city}, {selectedResponse.sitterId.state}
                  </p>
                  {(selectedResponse.sitterId.reviewCount ?? 0) > 0 && (
                    <p className="mt-1 flex items-center gap-1 text-sm text-[#4A4A4A]/70">
                      <Star className="h-4 w-4" style={{ color: '#C77DA3' }} fill="#C77DA3" />
                      {selectedResponse.sitterId.averageRating?.toFixed(1)}
                      <span className="text-[#4A4A4A]/40">({selectedResponse.sitterId.reviewCount} reviews)</span>
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResponse(null)}
                aria-label="Close sitter profile"
                className="rounded-full p-1 text-[#4A4A4A]/50 hover:bg-gray-100 hover:text-[#4A4A4A]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div className="rounded-xl bg-[#F5D5E5]/35 p-4">
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-[#4A4A4A]">Rate for this request</p>
                    <p className="text-xs text-[#4A4A4A]/60">{rateContextLabel(request.numberOfChildren)}</p>
                  </div>
                  <p className="text-2xl font-bold" style={{ color: '#C77DA3' }}>
                    {formatHourlyRate(getApplicableHourlyRate(selectedResponse.sitterId, request.numberOfChildren))}/hour
                  </p>
                </div>
                <RateGrid sitter={selectedResponse.sitterId} numberOfChildren={request.numberOfChildren} />
              </div>

              <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#4A4A4A]/55">About & Experience</h3>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <ProfileField label="Bio" value={selectedResponse.sitterId.bio} />
                  <ProfileField label="Childcare Experience" value={selectedResponse.sitterId.experience} />
                  <ProfileField label="Years of Experience" value={selectedResponse.sitterId.yearsOfExperience} />
                  <ProfileField label="Age Groups Worked With" value={selectedResponse.sitterId.ageGroupsWorkedWith} />
                  <ProfileField label="Types of Experience" value={selectedResponse.sitterId.typesOfExperience} />
                  <ProfileField label="Special Skills" value={selectedResponse.sitterId.specialSkills} />
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#4A4A4A]/55">Faith & Calling</h3>
                <div className="grid grid-cols-1 gap-3">
                  <ProfileField label="Faith Journey" value={selectedResponse.sitterId.faithJourney} />
                  <ProfileField label="Why They Feel Called to Serve" value={selectedResponse.sitterId.whyCalledToServe} />
                </div>
              </section>

              {selectedResponse.message && (
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#4A4A4A]/55">Message to Family</h3>
                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#4A4A4A]/75">"{selectedResponse.message}"</p>
                  </div>
                </section>
              )}

              {selectedResponse.sitterReviews && selectedResponse.sitterReviews.length > 0 && (
                <section>
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-[#4A4A4A]/55">Reviews</h3>
                  <div className="space-y-2">
                    {selectedResponse.sitterReviews.map((rev) => (
                      <div key={rev._id} className="rounded-xl bg-gray-50 p-3">
                        <div className="mb-1 flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((n) => (
                            <Star
                              key={n}
                              className="h-3.5 w-3.5"
                              style={{ color: '#C77DA3' }}
                              fill={n <= rev.rating ? '#C77DA3' : 'none'}
                            />
                          ))}
                          {rev.familyId?.householdName && (
                            <span className="ml-1 text-xs text-[#4A4A4A]/50">- {rev.familyId.householdName}</span>
                          )}
                        </div>
                        {rev.comment && <p className="text-sm text-[#4A4A4A]/70">{rev.comment}</p>}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <div className="flex flex-col gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                <Button
                  onClick={() => setSelectedResponse(null)}
                  variant="outline"
                  className="border-[#C77DA3] text-[#C77DA3] hover:bg-[#F5D5E5]"
                >
                  Close
                </Button>
                <Button
                  onClick={() => handleConfirmSitter(selectedResponse.sitterId._id)}
                  disabled={confirmingId === selectedResponse.sitterId._id}
                  style={{ backgroundColor: '#C77DA3' }}
                  className="text-white hover:opacity-90"
                >
                  {confirmingId === selectedResponse.sitterId._id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-2 h-4 w-4" /> Confirm This Sitter
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold font-heading text-[#4A4A4A]">
            {formatDate(request.date)}
          </h1>
          <p className="text-[#4A4A4A]/60">
            {request.startTime} - {request.endTime}
          </p>
        </div>
        {canCancel && (
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={cancelling}
            className="text-red-500 border-red-200 hover:bg-red-50"
          >
            {cancelling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
            Cancel Request
          </Button>
        )}
      </div>

      {isConfirmed && confirmedSitter && (
        <Card className="mb-6 ring-2" style={{ borderColor: '#D4EDDA' }}>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2" style={{ color: '#155724' }}>
              <Check className="w-5 h-5" /> Sitter Confirmed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: '#F5D5E5' }}
              >
                {confirmedSitter.profilePhoto ? (
                  <img
                    src={confirmedSitter.profilePhoto}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-8 h-8" style={{ color: '#C77DA3' }} />
                )}
              </div>

              <div className="flex-1">
                <p className="font-bold text-[#4A4A4A]">
                  {confirmedSitter.firstName} {confirmedSitter.lastName}
                </p>
                <p className="text-sm text-[#4A4A4A]/60">
                  {formatHourlyRate(confirmedRate)}/hour {rateContextLabel(request.numberOfChildren)}
                </p>
              </div>

              <div className="space-y-2 text-sm">
                {confirmedSitter.phone && (
                  <a
                    href={`tel:${confirmedSitter.phone}`}
                    className="flex items-center gap-2 text-[#4A4A4A] hover:underline"
                  >
                    <Phone className="w-4 h-4" />
                    {confirmedSitter.phone}
                  </a>
                )}
                {confirmedSitter.email && (
                  <a
                    href={`mailto:${confirmedSitter.email}`}
                    className="flex items-center gap-2 text-[#4A4A4A] hover:underline"
                  >
                    <Mail className="w-4 h-4" />
                    {confirmedSitter.email}
                  </a>
                )}
                {!confirmedSitter.phone && !confirmedSitter.email && (
                  <p className="text-sm text-[#4A4A4A]/60">
                    Contact details will appear here once this sitter has added them to their profile.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Request Details */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 mt-0.5" style={{ color: '#C77DA3' }} />
                <div>
                  <p className="font-medium text-[#4A4A4A]">{request.address}</p>
                  <p className="text-sm text-[#4A4A4A]/60">{request.city}, {request.state} {request.postalCode}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users className="w-5 h-5 mt-0.5" style={{ color: '#C77DA3' }} />
                <div>
                  <p className="font-medium text-[#4A4A4A]">
                    {request.numberOfChildren} {request.numberOfChildren === 1 ? 'Child' : 'Children'}
                  </p>
                  {request.childrenAges?.length > 0 && (
                    <p className="text-sm text-[#4A4A4A]/60">Ages: {request.childrenAges.join(', ')}</p>
                  )}
                </div>
              </div>

              {request.notes && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-[#4A4A4A]/60 mb-1">Notes</p>
                  <p className="text-sm text-[#4A4A4A]">{request.notes}</p>
                </div>
              )}

              {request.specialInstructions && (
                <div className="pt-4 border-t">
                  <p className="text-sm font-medium text-[#4A4A4A]/60 mb-1">Special Instructions</p>
                  <p className="text-sm text-[#4A4A4A]">{request.specialInstructions}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sitter Responses */}
        <div className="lg:col-span-2">
          {!isConfirmed && (
            <>
              <h2 className="text-lg font-bold font-heading text-[#4A4A4A] mb-4">
                Interested Sitters ({interestedResponses.length})
              </h2>

              {interestedResponses.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div
                      className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: '#F5D5E5' }}
                    >
                      <Clock className="w-8 h-8" style={{ color: '#C77DA3' }} />
                    </div>
                    <h3 className="text-lg font-medium text-[#4A4A4A] mb-2">Waiting for Responses</h3>
                    <p className="text-[#4A4A4A]/60">
                      Sitters in your area can see your request. Check back soon!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {interestedResponses.map((response) => {
                    const applicableRate = getApplicableHourlyRate(response.sitterId, request.numberOfChildren);
                    return (
                    <Card key={response._id}>
                      <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row md:items-start gap-4">
                          {/* Sitter Photo */}
                          <div
                            className="w-20 h-20 rounded-full flex-shrink-0 flex items-center justify-center"
                            style={{ backgroundColor: '#F5D5E5' }}
                          >
                            {response.sitterId.profilePhoto ? (
                              <img
                                src={response.sitterId.profilePhoto}
                                alt=""
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="w-10 h-10" style={{ color: '#C77DA3' }} />
                            )}
                          </div>

                          {/* Sitter Info */}
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h3 className="text-lg font-bold text-[#4A4A4A]">
                                  {response.sitterId.firstName} {response.sitterId.lastName}
                                </h3>
                                <p className="text-sm text-[#4A4A4A]/60">
                                  {response.sitterId.age ? `Age ${response.sitterId.age} • ` : ''}{response.sitterId.city}, {response.sitterId.state}
                                </p>
                                {(response.sitterId.reviewCount ?? 0) > 0 && (
                                  <p className="flex items-center gap-1 text-sm text-[#4A4A4A]/70 mt-1">
                                    <Star className="w-4 h-4" style={{ color: '#C77DA3' }} fill="#C77DA3" />
                                    {response.sitterId.averageRating?.toFixed(1)}
                                    <span className="text-[#4A4A4A]/40">({response.sitterId.reviewCount} reviews)</span>
                                  </p>
                                )}
                              </div>
                              <div className="text-right">
                                <p className="text-lg font-bold" style={{ color: '#C77DA3' }}>
                                  {formatHourlyRate(applicableRate)}
                                </p>
                                <p className="text-xs text-[#4A4A4A]/60">
                                  per hour {rateContextLabel(request.numberOfChildren)}
                                </p>
                              </div>
                            </div>

                            <div className="mb-3">
                              <RateGrid sitter={response.sitterId} numberOfChildren={request.numberOfChildren} />
                            </div>

                            {response.sitterId.bio && (
                              <p className="text-sm text-[#4A4A4A]/70 mb-3">{response.sitterId.bio}</p>
                            )}

                            {response.sitterId.experience && (
                              <div className="text-sm mb-3">
                                <span className="font-medium text-[#4A4A4A]">Experience: </span>
                                <span className="text-[#4A4A4A]/70">{response.sitterId.experience}</span>
                              </div>
                            )}

                            {response.message && (
                              <div className="p-3 rounded-lg bg-gray-50 mb-4">
                                <p className="text-sm text-[#4A4A4A]/70">"{response.message}"</p>
                              </div>
                            )}

                            {/* Reviews — only shown when this sitter has reviews */}
                            {response.sitterReviews && response.sitterReviews.length > 0 && (
                              <div className="mb-4 space-y-2">
                                <p className="text-sm font-medium text-[#4A4A4A]">Reviews</p>
                                {response.sitterReviews.map((rev) => (
                                  <div key={rev._id} className="p-3 rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-1 mb-1">
                                      {[1, 2, 3, 4, 5].map((n) => (
                                        <Star
                                          key={n}
                                          className="w-3.5 h-3.5"
                                          style={{ color: '#C77DA3' }}
                                          fill={n <= rev.rating ? '#C77DA3' : 'none'}
                                        />
                                      ))}
                                      {rev.familyId?.householdName && (
                                        <span className="text-xs text-[#4A4A4A]/50 ml-1">— {rev.familyId.householdName}</span>
                                      )}
                                    </div>
                                    {rev.comment && <p className="text-sm text-[#4A4A4A]/70">{rev.comment}</p>}
                                  </div>
                                ))}
                              </div>
                            )}

                            <div className="flex flex-col gap-2 sm:flex-row">
                              <Button
                                onClick={() => setSelectedResponse(response)}
                                variant="outline"
                                className="border-[#C77DA3] text-[#C77DA3] hover:bg-[#F5D5E5]"
                              >
                                View Full Profile
                              </Button>
                              <Button
                                onClick={() => handleConfirmSitter(response.sitterId._id)}
                                disabled={confirmingId === response.sitterId._id}
                                style={{ backgroundColor: '#C77DA3' }}
                                className="text-white hover:opacity-90"
                              >
                                {confirmingId === response.sitterId._id ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <>
                                    <Check className="w-4 h-4 mr-2" /> Confirm This Sitter
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )})}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
