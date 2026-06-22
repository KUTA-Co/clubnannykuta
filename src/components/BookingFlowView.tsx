import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CheckCircle2, ArrowLeft, Calendar, Clock } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

export function BookingFlowView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingComplete, setBookingComplete] = useState(false);

  const steps = ["Date & Time", "Child Info", "Review", "Payment"];
  const progress = ((currentStep + 1) / steps.length) * 100;

  // Mock nanny data
  const nanny = {
    name: "Sarah Martinez",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
    hourlyRate: 25,
    rating: 4.9
  };

  const [bookingDetails, setBookingDetails] = useState({
    bookingType: "short-term", // "short-term" or "long-term"
    date: "",
    startTime: "",
    endTime: "",
    hours: 0,
    totalCost: 0,
    endDate: "", // for long-term bookings
    contractDuration: "" // for long-term: "3-months", "6-months", "1-year", "ongoing"
  });

  const [numChildren, setNumChildren] = useState(1);
  const [childrenAges, setChildrenAges] = useState<string[]>([""]);

  const calculateCost = (start: string, end: string) => {
    if (start && end) {
      const startHour = parseInt(start.split(":")[0]);
      const endHour = parseInt(end.split(":")[0]);
      const hours = endHour - startHour;
      const total = hours * nanny.hourlyRate;
      setBookingDetails(prev => ({ ...prev, hours, totalCost: total }));
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setBookingComplete(true);
      setTimeout(() => {
        navigate(-1);
      }, 2000);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (bookingComplete) {
    return (
      <div className="space-y-4">
        <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
          <CardContent className="p-6 text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="h-10 w-10 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold font-heading text-[#4A4A4A] mb-3">Booking Confirmed!</h1>
            <p className="text-[#4A4A4A]/60 font-body mb-8">
              Your booking with {nanny.name} has been successfully confirmed.
            </p>

            <div className="bg-[#F5F2EB] rounded-xl p-6 mb-4 text-left max-w-md mx-auto">
              <h3 className="font-semibold text-[#4A4A4A] mb-4 font-heading">Booking Details</h3>
              <div className="space-y-3 text-sm font-body">
                <div className="flex justify-between">
                  <span className="text-[#4A4A4A]/60">Date:</span>
                  <span className="font-medium text-[#4A4A4A]">{bookingDetails.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#4A4A4A]/60">Time:</span>
                  <span className="font-medium text-[#4A4A4A]">{bookingDetails.startTime} - {bookingDetails.endTime}</span>
                </div>
                <div className="flex justify-between border-t border-[#E8E5DF] pt-3">
                  <span className="text-[#4A4A4A]/60">Total Paid:</span>
                  <span className="font-bold text-[#4A4A4A] text-lg">
                    ${(bookingDetails.totalCost * 1.1).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-sm text-[#4A4A4A]/60 font-body">
              Redirecting back...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="hover:bg-[#F5F2EB]"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold font-heading text-[#4A4A4A]">Book Nanny</h1>
          <p className="text-[#4A4A4A]/60 font-body text-sm">Complete your booking in {steps.length} easy steps</p>
        </div>
        <Badge className="bg-[#8BA99E] text-[#4A4A4A] font-body">
          Step {currentStep + 1} of {steps.length}
        </Badge>
      </div>

      <Progress value={progress} className="h-2 [&>div]:bg-red-600" style={{ '--progress-background': '#dc2626' } as React.CSSProperties} />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2">
          <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold font-heading text-[#4A4A4A]">
                {steps[currentStep]}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Step 1: Date & Time */}
              {currentStep === 0 && (
                <div className="space-y-5">
                  {/* Booking Type Selection */}
                  <div>
                    <Label className="text-sm font-semibold text-[#4A4A4A] font-body mb-3 block">Booking Type *</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div
                        onClick={() => setBookingDetails({ ...bookingDetails, bookingType: "short-term" })}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          bookingDetails.bookingType === "short-term"
                            ? "border-[#8BA99E] bg-[#8BA99E]/10"
                            : "border-[#E8E5DF] bg-white hover:border-[#8BA99E]/50"
                        }`}
                      >
                        <h3 className="font-semibold text-[#4A4A4A] mb-1">Short-Term</h3>
                        <p className="text-xs text-[#4A4A4A]/60">For a day or specific hours</p>
                      </div>
                      <div
                        onClick={() => setBookingDetails({ ...bookingDetails, bookingType: "long-term" })}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          bookingDetails.bookingType === "long-term"
                            ? "border-[#8BA99E] bg-[#8BA99E]/10"
                            : "border-[#E8E5DF] bg-white hover:border-[#8BA99E]/50"
                        }`}
                      >
                        <h3 className="font-semibold text-[#4A4A4A] mb-1">Long-Term</h3>
                        <p className="text-xs text-[#4A4A4A]/60">Ongoing contract (months/year)</p>
                      </div>
                    </div>
                  </div>

                  {bookingDetails.bookingType === "short-term" ? (
                    <>
                      <div>
                        <Label htmlFor="date" className="text-sm font-semibold text-[#4A4A4A] font-body mb-2 block">Date *</Label>
                    <DatePicker
                      value={bookingDetails.date}
                      onChange={(value) => setBookingDetails({ ...bookingDetails, date: value })}
                      minDate={new Date()}
                      placeholder="Select a date"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime" className="text-sm font-semibold text-[#4A4A4A] font-body mb-2 block">Start Time *</Label>
                      <TimePicker
                        value={bookingDetails.startTime}
                        onChange={(value) => {
                          setBookingDetails({ ...bookingDetails, startTime: value });
                          calculateCost(value, bookingDetails.endTime);
                        }}
                        placeholder="Select start time"
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime" className="text-sm font-semibold text-[#4A4A4A] font-body mb-2 block">End Time *</Label>
                      <TimePicker
                        value={bookingDetails.endTime}
                        onChange={(value) => {
                          setBookingDetails({ ...bookingDetails, endTime: value });
                          calculateCost(bookingDetails.startTime, value);
                        }}
                        placeholder="Select end time"
                      />
                    </div>
                  </div>
                  {bookingDetails.hours > 0 && (
                    <div className="p-4 rounded-xl bg-[#8BA99E]/20">
                      <div className="flex justify-between items-center font-body">
                        <span className="font-medium text-[#4A4A4A]">Total Duration:</span>
                        <span className="text-lg font-bold text-[#4A4A4A]">{bookingDetails.hours} hours</span>
                      </div>
                      <div className="flex justify-between items-center mt-2 font-body">
                        <span className="font-medium text-[#4A4A4A]">Estimated Cost:</span>
                        <span className="text-lg font-bold text-[#4A4A4A]">${bookingDetails.totalCost}</span>
                      </div>
                    </div>
                  )}
                    </>
                  ) : (
                    <>
                      {/* Long-term booking options */}
                      <div>
                        <Label htmlFor="startDate" className="text-sm font-semibold text-[#4A4A4A] font-body mb-2 block">Start Date *</Label>
                        <DatePicker
                          value={bookingDetails.date}
                          onChange={(value) => setBookingDetails({ ...bookingDetails, date: value })}
                          minDate={new Date()}
                          placeholder="Select start date"
                        />
                      </div>

                      <div>
                        <Label className="text-sm font-semibold text-[#4A4A4A] font-body mb-2 block">Contract Duration *</Label>
                        <div className="grid grid-cols-2 gap-3">
                          {["3 months", "6 months", "1 year", "Ongoing"].map((duration) => (
                            <div
                              key={duration}
                              onClick={() => setBookingDetails({ ...bookingDetails, contractDuration: duration })}
                              className={`p-3 rounded-lg border-2 cursor-pointer text-center transition-all ${
                                bookingDetails.contractDuration === duration
                                  ? "border-[#8BA99E] bg-[#8BA99E]/10 font-semibold"
                                  : "border-[#E8E5DF] hover:border-[#8BA99E]/50"
                              }`}
                            >
                              <span className="text-sm text-[#4A4A4A]">{duration}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-4 rounded-xl bg-[#8BA99E]/20 border border-[#8BA99E]">
                        <h4 className="font-semibold text-[#4A4A4A] mb-2">Long-Term Booking</h4>
                        <p className="text-sm text-[#4A4A4A]/70 mb-3">
                          This nanny will be marked as "Booked" for the duration of your contract.
                        </p>
                        <div className="flex justify-between items-center font-body">
                          <span className="font-medium text-[#4A4A4A]">Monthly Rate:</span>
                          <span className="text-lg font-bold text-[#4A4A4A]">${nanny.hourlyRate * 160}/month</span>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Step 2: Child Information */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="numChildren" className="text-sm font-semibold text-[#4A4A4A] font-body">Number of Children *</Label>
                    <Input
                      id="numChildren"
                      type="number"
                      min="1"
                      max="10"
                      value={numChildren}
                      onChange={(e) => {
                        const num = parseInt(e.target.value) || 1;
                        setNumChildren(num);
                        setChildrenAges(Array(num).fill(""));
                      }}
                      className="mt-2 rounded-lg border-[#E8E5DF]"
                    />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-[#4A4A4A] font-body">Children's Ages *</Label>
                    <div className="space-y-2 mt-2">
                      {Array.from({ length: numChildren }, (_, i) => (
                        <Input
                          key={i}
                          placeholder={`Child ${i + 1}: Age`}
                          type="number"
                          min="0"
                          max="18"
                          value={childrenAges[i] || ""}
                          onChange={(e) => {
                            const newAges = [...childrenAges];
                            newAges[i] = e.target.value;
                            setChildrenAges(newAges);
                          }}
                          className="rounded-lg border-[#E8E5DF]"
                        />
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="allergies" className="text-sm font-semibold text-[#4A4A4A] font-body">Allergies or Special Needs</Label>
                    <Textarea
                      id="allergies"
                      placeholder="Any allergies, dietary restrictions, or special needs..."
                      rows={3}
                      className="mt-2 rounded-lg border-[#E8E5DF] font-body"
                    />
                  </div>
                  <div>
                    <Label htmlFor="address" className="text-sm font-semibold text-[#4A4A4A] font-body">Address for Service *</Label>
                    <Input id="address" placeholder="123 Main St, City, State ZIP" className="mt-2 rounded-lg border-[#E8E5DF]" />
                  </div>
                  <div>
                    <Label className="text-sm font-semibold text-[#4A4A4A] font-body">Emergency Contact *</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      <Input placeholder="Name" className="rounded-lg border-[#E8E5DF]" />
                      <Input placeholder="Phone Number" type="tel" className="rounded-lg border-[#E8E5DF]" />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-[#4A4A4A] mb-3 font-heading">Booking Details</h3>
                    <div className="space-y-2 text-sm font-body">
                      <div className="flex justify-between">
                        <span className="text-[#4A4A4A]/60">Date:</span>
                        <span className="font-medium text-[#4A4A4A]">{bookingDetails.date || "Not selected"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#4A4A4A]/60">Time:</span>
                        <span className="font-medium text-[#4A4A4A]">
                          {bookingDetails.startTime || "Not selected"} - {bookingDetails.endTime || "Not selected"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#4A4A4A]/60">Duration:</span>
                        <span className="font-medium text-[#4A4A4A]">{bookingDetails.hours} hours</span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-[#E8E5DF] pt-4">
                    <h3 className="font-semibold text-[#4A4A4A] mb-3 font-heading">Cost Breakdown</h3>
                    <div className="space-y-2 text-sm font-body">
                      <div className="flex justify-between">
                        <span className="text-[#4A4A4A]/60">
                          Hourly rate × {bookingDetails.hours} hours
                        </span>
                        <span className="text-[#4A4A4A]">${bookingDetails.totalCost.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#4A4A4A]/60">Service fee (10%)</span>
                        <span className="text-[#4A4A4A]">${(bookingDetails.totalCost * 0.1).toFixed(2)}</span>
                      </div>
                      <div className="border-t border-[#E8E5DF] pt-2 flex justify-between font-semibold text-base">
                        <span className="text-[#4A4A4A]">Total</span>
                        <span className="text-[#4A4A4A]">
                          ${(bookingDetails.totalCost * 1.1).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-xl p-4 bg-[#F5F2EB] border-[#E8E5DF]">
                    <h4 className="font-semibold text-[#4A4A4A] mb-2 font-heading">Cancellation Policy</h4>
                    <p className="text-sm text-[#4A4A4A]/60 font-body">
                      Free cancellation up to 24 hours before. Cancellations within 24 hours subject to 50% fee.
                    </p>
                  </div>

                  <div className="flex items-start space-x-2">
                    <Checkbox id="agree" className="mt-0.5 cursor-pointer" />
                    <label htmlFor="agree" className="text-sm font-body text-[#4A4A4A] leading-relaxed">
                      I agree to the{" "}
                      <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800 underline" onClick={(e) => e.stopPropagation()}>
                        cancellation policy
                      </a>
                      {" "}and{" "}
                      <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800 underline" onClick={(e) => e.stopPropagation()}>
                        terms of service
                      </a>
                    </label>
                  </div>
                </div>
              )}

              {/* Step 4: Payment */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center gap-2 text-green-700 font-semibold mb-2 font-body">
                      <CheckCircle2 className="h-5 w-5" />
                      Saved Payment Method
                    </div>
                    <p className="text-sm font-body text-[#4A4A4A]">Visa ending in 1234</p>
                  </div>

                  <div className="text-center text-sm text-[#4A4A4A]/60 font-body">
                    or use a different card
                  </div>

                  <div>
                    <Label htmlFor="cardNumber" className="text-sm font-semibold text-[#4A4A4A] font-body">Card Number</Label>
                    <Input id="cardNumber" placeholder="1234 5678 9012 3456" className="mt-2 rounded-lg border-[#E8E5DF]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="expiry" className="text-sm font-semibold text-[#4A4A4A] font-body">Expiry Date</Label>
                      <Input id="expiry" placeholder="MM/YY" className="mt-2 rounded-lg border-[#E8E5DF]" />
                    </div>
                    <div>
                      <Label htmlFor="cvv" className="text-sm font-semibold text-[#4A4A4A] font-body">CVV</Label>
                      <Input id="cvv" placeholder="123" type="password" maxLength={4} className="mt-2 rounded-lg border-[#E8E5DF]" />
                    </div>
                  </div>

                  <div className="p-4 bg-[#F5F2EB] rounded-lg border border-[#E8E5DF]">
                    <p className="text-sm text-[#4A4A4A]/70 font-body">
                      💳 Your payment is secure and encrypted. You'll only be charged after service completion.
                    </p>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t border-[#E8E5DF]">
                <Button
                  variant="outline"
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  className="border-[#E8E5DF] rounded-full font-body"
                >
                  Previous
                </Button>
                <Button
                  onClick={nextStep}
                  className="bg-[#8BA99E] text-[#4A4A4A] hover:bg-[#8BA99E]/90 rounded-full font-body"
                >
                  {currentStep === steps.length - 1 ? (
                    <>
                      <CheckCircle2 className="mr-2 h-4 w-4" />
                      Confirm Booking
                    </>
                  ) : (
                    "Next Step"
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Summary */}
        <div>
          <Card className="border border-[#E8E5DF] bg-white shadow-sm rounded-2xl sticky top-6">
            <CardContent className="p-6">
              <h3 className="font-semibold text-[#4A4A4A] mb-4 font-heading">Booking Summary</h3>

              {/* Nanny Info */}
              <div className="flex items-center gap-3 mb-4 pb-6 border-b border-[#E8E5DF]">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={nanny.image} />
                  <AvatarFallback className="bg-[#8BA99E] text-[#4A4A4A]">SM</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-[#4A4A4A] font-body">{nanny.name}</p>
                  <div className="flex items-center gap-1 text-sm text-[#4A4A4A]/60 font-body">
                    <span>⭐ {nanny.rating}</span>
                  </div>
                </div>
              </div>

              {/* Details */}
              <div className="space-y-3 mb-4">
                {bookingDetails.date && (
                  <div className="flex items-center gap-2 text-sm font-body text-[#4A4A4A]">
                    <Calendar className="h-4 w-4 text-[#4A4A4A]/60" />
                    <span>{new Date(bookingDetails.date).toLocaleDateString("en-US")}</span>
                  </div>
                )}
                {bookingDetails.startTime && bookingDetails.endTime && (
                  <div className="flex items-center gap-2 text-sm font-body text-[#4A4A4A]">
                    <Clock className="h-4 w-4 text-[#4A4A4A]/60" />
                    <span>{bookingDetails.startTime} - {bookingDetails.endTime}</span>
                  </div>
                )}
              </div>

              {/* Cost */}
              {bookingDetails.totalCost > 0 && (
                <div className="border-t border-[#E8E5DF] pt-4 space-y-2 font-body">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A4A4A]/60">Subtotal</span>
                    <span className="text-[#4A4A4A]">${bookingDetails.totalCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#4A4A4A]/60">Service Fee</span>
                    <span className="text-[#4A4A4A]">${(bookingDetails.totalCost * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t border-[#E8E5DF]">
                    <span className="text-[#4A4A4A]">Total</span>
                    <span className="text-[#4A4A4A]">
                      ${(bookingDetails.totalCost * 1.1).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
