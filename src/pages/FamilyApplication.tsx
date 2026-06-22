import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ArrowRight, ArrowLeft, Check, Home, Users, Heart, Sparkles } from "lucide-react";
import { GlassButton } from "@/components/ui/effects";
import { trackFormSubmit } from "@/lib/analytics";

const steps = [
  { id: 1, name: "Your Family", icon: Home },
  { id: 2, name: "Childcare Needs", icon: Users },
  { id: 3, name: "Faith & Values", icon: Heart },
  { id: 4, name: "Preferences", icon: Sparkles },
];

export default function FamilyApplication() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [openModal, setOpenModal] = useState<'terms' | 'privacy' | null>(null);
  const [formData, setFormData] = useState({
    parentName: "",
    email: "",
    phone: "",
    city: "",
    state: "",
    numberOfChildren: "",
    childrenAges: "",
    startDate: "",
    endDate: "",
    hoursPerWeek: "",
    schedule: "",
    specialNeeds: "",
    churchName: "",
    faithBackground: "",
    valuesImportant: "",
    preferredAge: "",
    preferredExperience: "",
    personalityPreferences: "",
    additionalNotes: "",
    agreeToTerms: false,
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      // Map form data to API expected format for later submission
      const apiData = {
        parentName: formData.parentName,
        email: formData.email,
        phone: formData.phone,
        city: formData.city,
        state: formData.state,
        numberOfChildren: formData.numberOfChildren,
        childrenAges: formData.childrenAges,
        startDate: formData.startDate,
        endDate: formData.endDate,
        hoursPerWeek: formData.hoursPerWeek,
        weeklySchedule: formData.schedule,
        specialNeeds: formData.specialNeeds,
        church: formData.churchName,
        faithBackground: formData.faithBackground,
        familyValues: formData.valuesImportant,
        nannyAgeRange: formData.preferredAge,
        experienceLevel: formData.preferredExperience,
        personalityPreferences: formData.personalityPreferences,
        additionalInfo: formData.additionalNotes,
      };

      // 1. Store form data in sessionStorage (will be submitted after payment)
      sessionStorage.setItem('pendingApplication', JSON.stringify({
        type: 'family',
        data: apiData
      }));

      // 2. Get checkout URL (NO database save yet)
      const apiUrl = import.meta.env.VITE_API_URL || '';
      const response = await fetch(`${apiUrl}/api/stripe/create-application-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'family',
          email: formData.email,
          name: formData.parentName
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        trackFormSubmit('family_application_checkout');
        // 3. Redirect to Stripe
        window.location.href = data.checkoutUrl;
      } else {
        alert(data.message || 'Failed to start payment. Please try again.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Family application error:', error);
      alert('Failed to start payment. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      {/* Hero Header */}
      <section className="pt-[82px] px-3">
        <div className="rounded-3xl py-16 px-4 relative overflow-hidden" style={{ backgroundColor: '#8BA99E' }}>
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-32 h-32 rounded-full border-4 border-white"></div>
            <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full border-4 border-white"></div>
            <div className="absolute top-1/2 left-1/3 w-20 h-20 rounded-full border-4 border-white"></div>
          </div>
          <div className="container mx-auto max-w-4xl text-center relative z-10">
            <h1 className="text-4xl md:text-5xl font-bold font-heading mb-3 text-white">
              Family Application
            </h1>
            <p className="text-lg text-white/90 max-w-xl mx-auto">
              Tell us about your family so we can find the perfect faith-aligned caregiver for your home.
            </p>
          </div>
        </div>
      </section>

      {/* Progress Steps */}
      <div className="container mx-auto max-w-4xl px-4 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                        isCompleted
                          ? "bg-[#8BA99E] text-white"
                          : isCurrent
                          ? "bg-[#4A4A4A] text-white ring-4 ring-[#8BA99E]/20"
                          : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                    </div>
                    <span className={`text-xs mt-2 font-medium hidden sm:block ${
                      isCurrent ? "text-[#4A4A4A]" : isCompleted ? "text-[#8BA99E]" : "text-gray-400"
                    }`}>
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`h-1 flex-1 mx-2 rounded-full transition-all duration-300 ${
                      isCompleted ? "bg-[#8BA99E]" : "bg-gray-100"
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Form Content */}
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="bg-white rounded-3xl shadow-lg overflow-hidden">
          {/* Step Header */}
          <div className="px-8 py-6 border-b border-gray-100" style={{ backgroundColor: '#FAFAFA' }}>
            <h2 className="text-2xl font-bold font-heading text-[#4A4A4A]">
              {currentStep === 1 && "Tell us about your family"}
              {currentStep === 2 && "What are your childcare needs?"}
              {currentStep === 3 && "Share your faith and values"}
              {currentStep === 4 && "Your ideal nanny"}
            </h2>
            <p className="text-[#4A4A4A]/60 mt-1">
              {currentStep === 1 && "Basic information to help us get to know you"}
              {currentStep === 2 && "Help us understand your schedule and requirements"}
              {currentStep === 3 && "Faith is at the heart of our matching process"}
              {currentStep === 4 && "What qualities matter most to you?"}
            </p>
          </div>

          {/* Form Fields */}
          <div className="p-8 space-y-6">
            {currentStep === 1 && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4A4A4A]">Parent/Guardian Name *</Label>
                  <Input
                    placeholder="Enter your full name"
                    value={formData.parentName}
                    onChange={(e) => handleChange("parentName", e.target.value)}
                    className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">Phone Number *</Label>
                    <Input
                      placeholder="(555) 555-5555"
                      value={formData.phone}
                      onChange={(e) => handleChange("phone", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">City *</Label>
                    <Input
                      placeholder="Your city"
                      value={formData.city}
                      onChange={(e) => handleChange("city", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">State *</Label>
                    <Input
                      placeholder="Your state"
                      value={formData.state}
                      onChange={(e) => handleChange("state", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">Number of Children *</Label>
                    <Input
                      type="number"
                      placeholder="How many children?"
                      value={formData.numberOfChildren}
                      onChange={(e) => handleChange("numberOfChildren", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">Children's Ages *</Label>
                    <Input
                      placeholder="e.g., 3, 5, 8"
                      value={formData.childrenAges}
                      onChange={(e) => handleChange("childrenAges", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === 2 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">Desired Start Date *</Label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => handleChange("startDate", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">Desired End Date *</Label>
                    <Input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => handleChange("endDate", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4A4A4A]">Hours Per Week Needed *</Label>
                  <Input
                    placeholder="e.g., 30-40 hours"
                    value={formData.hoursPerWeek}
                    onChange={(e) => handleChange("hoursPerWeek", e.target.value)}
                    className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4A4A4A]">Typical Weekly Schedule *</Label>
                  <Textarea
                    placeholder="e.g., Monday-Friday 8am-4pm, flexibility needed for travel..."
                    value={formData.schedule}
                    onChange={(e) => handleChange("schedule", e.target.value)}
                    className="min-h-[100px] rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4A4A4A]">Special Needs or Considerations</Label>
                  <Textarea
                    placeholder="Any allergies, medical needs, or special considerations..."
                    value={formData.specialNeeds}
                    onChange={(e) => handleChange("specialNeeds", e.target.value)}
                    className="min-h-[100px] rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E] resize-none"
                  />
                </div>
              </>
            )}

            {currentStep === 3 && (
              <>
                <div className="p-4 rounded-xl mb-6" style={{ backgroundColor: '#8BA99E10' }}>
                  <p className="text-sm text-[#4A4A4A]/70">
                    At Club Nanny, faith alignment is central to our matching process. This helps us connect you with caregivers who share your values.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4A4A4A]">Church or Faith Community</Label>
                  <Input
                    placeholder="Name of your church or faith community"
                    value={formData.churchName}
                    onChange={(e) => handleChange("churchName", e.target.value)}
                    className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4A4A4A]">Tell Us About Your Faith Background *</Label>
                  <Textarea
                    placeholder="Share a bit about your faith journey and how faith plays a role in your family life..."
                    value={formData.faithBackground}
                    onChange={(e) => handleChange("faithBackground", e.target.value)}
                    className="min-h-[120px] rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4A4A4A]">What Values Are Most Important to Your Family? *</Label>
                  <Textarea
                    placeholder="What character traits and values do you prioritize in raising your children?"
                    value={formData.valuesImportant}
                    onChange={(e) => handleChange("valuesImportant", e.target.value)}
                    className="min-h-[120px] rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E] resize-none"
                  />
                </div>
              </>
            )}

            {currentStep === 4 && (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">Preferred Nanny Age Range</Label>
                    <Input
                      placeholder="e.g., 19-25"
                      value={formData.preferredAge}
                      onChange={(e) => handleChange("preferredAge", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-[#4A4A4A]">Preferred Experience Level</Label>
                    <Input
                      placeholder="e.g., 2+ years with children"
                      value={formData.preferredExperience}
                      onChange={(e) => handleChange("preferredExperience", e.target.value)}
                      className="h-12 rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E]"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4A4A4A]">Personality & Style Preferences *</Label>
                  <Textarea
                    placeholder="Describe the type of personality and caregiving style that would fit best with your family..."
                    value={formData.personalityPreferences}
                    onChange={(e) => handleChange("personalityPreferences", e.target.value)}
                    className="min-h-[120px] rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-[#4A4A4A]">Anything Else We Should Know?</Label>
                  <Textarea
                    placeholder="Any additional information that would help us find your perfect match..."
                    value={formData.additionalNotes}
                    onChange={(e) => handleChange("additionalNotes", e.target.value)}
                    className="min-h-[100px] rounded-xl border-gray-200 focus:border-[#8BA99E] focus:ring-[#8BA99E] resize-none"
                  />
                </div>

                {/* Pricing Info */}
                <div className="p-5 rounded-xl border-2 border-[#8BA99E] bg-[#8BA99E]/5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-[#4A4A4A]">Application Fee</span>
                    <span className="text-2xl font-bold text-[#4A4A4A]">$250</span>
                  </div>
                  <p className="text-xs text-[#4A4A4A]/60">
                    Annual fee, non-refundable.
                  </p>
                </div>

                <div className="p-5 rounded-xl border border-gray-200 bg-gray-50/50">
                  <div className="flex items-start gap-4">
                    <Checkbox
                      id="terms"
                      checked={formData.agreeToTerms}
                      onCheckedChange={(checked) => handleChange("agreeToTerms", checked as boolean)}
                      className="mt-1 data-[state=checked]:bg-[#8BA99E] data-[state=checked]:border-[#8BA99E]"
                    />
                    <label htmlFor="terms" className="text-sm text-[#4A4A4A]/70 leading-relaxed cursor-pointer">
                      I understand that submitting this application begins the Club Nanny matching process and requires a $250 application fee.
                      A team member will contact me to schedule a personal interview. View our{" "}
                      <button type="button" onClick={() => setOpenModal('terms')} className="underline" style={{ color: '#8BA99E' }}>Terms of Service</button> and{" "}
                      <button type="button" onClick={() => setOpenModal('privacy')} className="underline" style={{ color: '#8BA99E' }}>Privacy Policy</button>.
                    </label>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Navigation */}
          <div className="px-8 py-6 border-t border-gray-100 flex justify-between items-center" style={{ backgroundColor: '#FAFAFA' }}>
            {currentStep > 1 ? (
              <Button
                variant="ghost"
                onClick={handleBack}
                className="h-12 px-6 rounded-xl text-[#4A4A4A] hover:bg-gray-100"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            ) : (
              <div />
            )}

            {currentStep < 4 ? (
              <Button
                onClick={handleNext}
                className="h-12 px-6 rounded-xl text-white flex items-center gap-2"
                style={{ backgroundColor: '#8BA99E' }}
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!formData.agreeToTerms || isSubmitting}
                className="h-12 px-6 rounded-xl text-white flex items-center gap-2"
                style={{ backgroundColor: '#8BA99E' }}
              >
                {isSubmitting ? "Processing..." : "Continue to Payment"}
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Help Text */}
        <p className="text-center text-sm text-[#4A4A4A]/50 mt-6">
          Need help? Contact us at{" "}
          <a href="mailto:Leigh@clubnanny.com" className="underline" style={{ color: '#8BA99E' }}>
            Leigh@clubnanny.com
          </a>
        </p>
      </div>

      <Footer />

      {/* Terms Modal */}
      <Dialog open={openModal === 'terms'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b border-[#E8E5DF]">
            <DialogTitle className="text-3xl font-bold font-heading text-[#4A4A4A]">Terms of Service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-6 font-body text-[#4A4A4A]/80">
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">1. Acceptance of Terms</h2>
              <p className="leading-relaxed">
                By accessing and using Club Nanny, you accept and agree to be bound by the terms and provision of this agreement.
                If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">2. Use License</h2>
              <p className="leading-relaxed mb-3">
                Permission is granted to temporarily access the materials on Club Nanny's website for personal, non-commercial
                transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on Club Nanny's website</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">3. User Accounts</h2>
              <p className="leading-relaxed mb-3">
                When you create an account with us, you must provide information that is accurate, complete, and current at all times.
                You are responsible for safeguarding the password and for all activities that occur under your account.
              </p>
              <p className="leading-relaxed">
                You agree not to disclose your password to any third party and to take sole responsibility for any activities or
                actions under your account, whether or not you have authorized such activities or actions.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">4. Service Availability</h2>
              <p className="leading-relaxed">
                Club Nanny reserves the right to withdraw or amend the service, and any service or material we provide, in our
                sole discretion without notice. We will not be liable if, for any reason, all or any part of the service is
                unavailable at any time or for any period.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">5. Payment Terms</h2>
              <p className="leading-relaxed mb-3">
                <strong>Nanny Application Fee:</strong> $75 (non-refundable).
              </p>
              <p className="leading-relaxed mb-3">
                <strong>Family Application Fee:</strong> $250 (Annual fee, non-refundable).
              </p>
              <p className="leading-relaxed">
                Nanny wages are paid directly by families and are not included in these fees. All fees are non-refundable.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">6. Background Checks & Verification</h2>
              <p className="leading-relaxed">
                Club Nanny may conduct background checks on nannies. By using our service, nannies consent to background checks
                and verification processes. Families may also be subject to verification to ensure platform safety.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">7. Limitation of Liability</h2>
              <p className="leading-relaxed">
                In no event shall Club Nanny, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable
                for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits,
                data, use, goodwill, or other intangible losses, resulting from your use of the service.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">8. Changes to Terms</h2>
              <p className="leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material,
                we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">9. Contact Information</h2>
              <p className="leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at Leigh@clubnanny.com
              </p>
            </div>
            <div className="pt-6 border-t border-[#E8E5DF]">
              <p className="text-sm text-[#4A4A4A]/60">
                Last updated: {new Date().toLocaleDateString("en-US")}
              </p>
            </div>
          </div>
          <div className="sticky bottom-0 bg-white pt-6 border-t border-[#E8E5DF] mt-6">
            <Button onClick={() => setOpenModal(null)} className="w-full h-12 rounded-xl text-white" style={{ backgroundColor: '#4A4A4A' }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Privacy Modal */}
      <Dialog open={openModal === 'privacy'} onOpenChange={() => setOpenModal(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl">
          <DialogHeader className="sticky top-0 bg-white z-10 pb-4 border-b border-[#E8E5DF]">
            <DialogTitle className="text-3xl font-bold font-heading text-[#4A4A4A]">Privacy Policy</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-6 font-body text-[#4A4A4A]/80">
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">1. Information We Collect</h2>
              <p className="leading-relaxed mb-3">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Account information (name, email, phone number)</li>
                <li>Profile information (photos, bio, experience, certifications)</li>
                <li>Payment information</li>
                <li>Communication data (messages between families and nannies)</li>
                <li>Usage data (how you interact with our platform)</li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">2. How We Use Your Information</h2>
              <p className="leading-relaxed mb-3">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Provide, maintain, and improve our services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Conduct background checks and verification</li>
                <li>Detect, prevent, and address technical issues</li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">3. Information Sharing</h2>
              <p className="leading-relaxed mb-3">
                We do not sell your personal information. We may share your information in the following situations:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>With other users (nannies can see family profiles and vice versa, as appropriate)</li>
                <li>With service providers who assist us in operating our platform</li>
                <li>For legal compliance or to protect rights and safety</li>
                <li>In connection with a business transfer or merger</li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">4. Data Security</h2>
              <p className="leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information.
                However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to
                use commercially acceptable means to protect your information, we cannot guarantee absolute security.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">5. Your Rights</h2>
              <p className="leading-relaxed mb-3">
                You have the right to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Access and receive a copy of your personal data</li>
                <li>Rectify inaccurate or incomplete data</li>
                <li>Request deletion of your personal data</li>
                <li>Object to processing of your personal data</li>
                <li>Request restriction of processing</li>
                <li>Data portability</li>
              </ul>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">6. Cookies and Tracking</h2>
              <p className="leading-relaxed">
                We use cookies and similar tracking technologies to track activity on our platform and hold certain information.
                You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">7. Children's Privacy</h2>
              <p className="leading-relaxed">
                Our service is not intended for children under 18. We do not knowingly collect personal information from children
                under 18. If you are a parent or guardian and believe your child has provided us with personal information, please
                contact us immediately.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">8. Changes to This Policy</h2>
              <p className="leading-relaxed">
                We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy
                Policy on this page and updating the "Last updated" date.
              </p>
            </div>
            <div>
              <h2 className="text-2xl font-bold font-heading text-[#4A4A4A] mb-4">9. Contact Us</h2>
              <p className="leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at Leigh@clubnanny.com
              </p>
            </div>
            <div className="pt-6 border-t border-[#E8E5DF]">
              <p className="text-sm text-[#4A4A4A]/60">
                Last updated: {new Date().toLocaleDateString("en-US")}
              </p>
            </div>
          </div>
          <div className="sticky bottom-0 bg-white pt-6 border-t border-[#E8E5DF] mt-6">
            <Button onClick={() => setOpenModal(null)} className="w-full h-12 rounded-xl text-white" style={{ backgroundColor: '#4A4A4A' }}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
