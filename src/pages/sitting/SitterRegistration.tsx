import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isStandaloneApp } from "@/lib/pwa";
import { getRegistrationData, saveRegistrationData } from "@/lib/registrationStorage";

const API_URL = import.meta.env.VITE_API_URL || '';

const isAtLeast16 = (value: string) => {
  const dob = new Date(value);
  if (Number.isNaN(dob.getTime())) return false;
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age >= 16;
};

const maxSitterBirthDate = (() => {
  const date = new Date();
  date.setFullYear(date.getFullYear() - 16);
  return date.toISOString().split('T')[0];
})();

// Combined schema for all fields
const formSchema = z.object({
  // Account
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),

  // Basic Info
  fullName: z.string().min(1, "Full name is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(5, "Please enter a valid ZIP code"),
  dateOfBirth: z.string()
    .min(1, "Date of birth is required")
    .refine(isAtLeast16, "Sitters must be at least 16 years old"),
  howDidYouHear: z.string().min(1, "Please tell us how you heard about us"),

  // Experience
  yearsOfExperience: z.string().min(1, "Years of experience is required"),
  ageGroupsWorkedWith: z.string().min(1, "Please specify age groups"),
  typesOfExperience: z.string().min(1, "Please describe types of experience"),
  experienceDescription: z.string().min(20, "Please describe your experience (at least 20 characters)"),

  // Faith & Calling
  faithJourney: z.string().min(20, "Please share about your faith journey (at least 20 characters)"),
  whyCalledToServe: z.string().min(20, "Please share why you feel called to serve (at least 20 characters)"),

  // Skills & Rates
  specialSkills: z.string().optional(),
  hourlyRate1Kid: z.coerce.number().min(0, "Rate cannot be negative"),
  hourlyRate2Kids: z.coerce.number().min(0, "Rate cannot be negative"),
  hourlyRate3PlusKids: z.coerce.number().min(0, "Rate cannot be negative"),

  // Agreements
  backgroundCheckConsent: z.boolean().refine(val => val === true, "You must agree to the background check"),
  membershipConsent: z.boolean().refine(val => val === true, "You must agree to the membership terms"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"]
});

type FormData = z.infer<typeof formSchema>;

const emptyDefaults: FormData = {
  email: "",
  password: "",
  confirmPassword: "",
  fullName: "",
  phone: "",
  city: "",
  state: "",
  postalCode: "",
  dateOfBirth: "",
  howDidYouHear: "",
  yearsOfExperience: "",
  ageGroupsWorkedWith: "",
  typesOfExperience: "",
  experienceDescription: "",
  faithJourney: "",
  whyCalledToServe: "",
  specialSkills: "",
  hourlyRate1Kid: undefined as unknown as number,
  hourlyRate2Kids: undefined as unknown as number,
  hourlyRate3PlusKids: undefined as unknown as number,
  backgroundCheckConsent: false,
  membershipConsent: false,
};

function getSavedDefaults(): FormData {
  const saved = getRegistrationData('sitterRegistrationData');
  if (!saved) return emptyDefaults;

  try {
    const data = JSON.parse(saved);
    return {
      ...emptyDefaults,
      email: data.email || "",
      password: data.password || "",
      confirmPassword: data.password || "",
      fullName: [data.firstName, data.lastName].filter(Boolean).join(" ") || "",
      phone: data.phone || "",
      city: data.city || "",
      state: data.state || "",
      postalCode: data.postalCode || "",
      dateOfBirth: data.dateOfBirth || "",
      howDidYouHear: data.howDidYouHear || "",
      yearsOfExperience: data.yearsOfExperience || "",
      ageGroupsWorkedWith: data.ageGroupsWorkedWith || "",
      typesOfExperience: data.typesOfExperience || "",
      experienceDescription: data.experience || data.bio || "",
      faithJourney: data.faithJourney || "",
      whyCalledToServe: data.whyCalledToServe || "",
      specialSkills: data.specialSkills || "",
      hourlyRate1Kid: data.hourlyRate1Kid ?? data.hourlyRate ?? emptyDefaults.hourlyRate1Kid,
      hourlyRate2Kids: data.hourlyRate2Kids ?? emptyDefaults.hourlyRate2Kids,
      hourlyRate3PlusKids: data.hourlyRate3PlusKids ?? emptyDefaults.hourlyRate3PlusKids,
      backgroundCheckConsent: true,
      membershipConsent: true,
    };
  } catch (error) {
    console.warn('Could not restore saved sitter registration data', error);
    return emptyDefaults;
  }
}

export default function SitterRegistration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const runningAsApp = isStandaloneApp();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getSavedDefaults(),
    mode: "onChange"
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = form;

  const validateStep = async (currentStep: number): Promise<boolean> => {
    let fieldsToValidate: (keyof FormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["email", "password", "confirmPassword"];
        break;
      case 2:
        fieldsToValidate = ["fullName", "phone", "city", "state", "postalCode", "dateOfBirth", "howDidYouHear"];
        break;
      case 3:
        fieldsToValidate = ["yearsOfExperience", "ageGroupsWorkedWith", "typesOfExperience", "experienceDescription"];
        break;
      case 4:
        fieldsToValidate = ["faithJourney", "whyCalledToServe"];
        break;
      case 5:
        fieldsToValidate = ["hourlyRate1Kid", "hourlyRate2Kids", "hourlyRate3PlusKids", "backgroundCheckConsent", "membershipConsent"];
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(step);
    if (isValid && step < 5) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Parse full name into first and last name
      const nameParts = data.fullName.trim().split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || nameParts[0];

      // Full registration payload (carried through to account creation)
      const payload = {
        email: data.email,
        password: data.password,
        firstName,
        lastName,
        phone: data.phone,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        dateOfBirth: data.dateOfBirth,
        howDidYouHear: data.howDidYouHear,
        yearsOfExperience: data.yearsOfExperience,
        ageGroupsWorkedWith: data.ageGroupsWorkedWith,
        typesOfExperience: data.typesOfExperience,
        experience: data.experienceDescription,
        faithJourney: data.faithJourney,
        whyCalledToServe: data.whyCalledToServe,
        specialSkills: data.specialSkills,
        hourlyRate: data.hourlyRate1Kid,
        hourlyRate1Kid: data.hourlyRate1Kid,
        hourlyRate2Kids: data.hourlyRate2Kids,
        hourlyRate3PlusKids: data.hourlyRate3PlusKids,
        bio: "",
      };

      // Production: pay-first — store the form data, create a Stripe checkout, redirect.
      // After payment, RegistrationComplete finalizes the account (pending admin approval).
      if (import.meta.env.PROD) {
        const dataSaved = saveRegistrationData('sitterRegistrationData', payload);
        if (!dataSaved) {
          toast({
            title: "Registration Error",
            description: "Your browser blocked local storage. Please allow site storage and try again.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        const response = await fetch(`${API_URL}/api/sitting/auth/register/sitter`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: payload.email, firstName, lastName, phone: payload.phone, city: payload.city, state: payload.state, postalCode: payload.postalCode })
        });
        const result = await response.json();
        if (result.success && result.checkoutUrl) {
          setCheckoutUrl(result.checkoutUrl);
          window.location.assign(result.checkoutUrl);
          window.setTimeout(() => setIsSubmitting(false), 1500);
          return;
        }
        toast({ title: "Registration Error", description: result.message || "Could not start checkout", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      // Dev/test: bypass payment, create + log in immediately
      const response = await fetch(`${API_URL}/api/sitting/auth/register-test/sitter`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        login(result.token, result.user);
        toast({
          title: "Application Submitted!",
          description: "Welcome to Club Nanny. Redirecting to jobs...",
        });
        navigate('/sitting/sitter/jobs');
      } else {
        toast({
          title: "Registration Error",
          description: result.message || "Failed to complete registration",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvalidSubmit = () => {
    toast({
      title: "Check the form",
      description: "Please complete the highlighted fields before continuing to payment.",
      variant: "destructive"
    });
  };

  const submitApplication = handleSubmit(onSubmit, handleInvalidSubmit);

  const steps = [
    { number: 1, label: "Account" },
    { number: 2, label: "About You" },
    { number: 3, label: "Experience" },
    { number: 4, label: "Faith" },
    { number: 5, label: "Review" }
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      {!runningAsApp && <Navigation />}

      <main className={`flex-1 ${runningAsApp ? 'pt-6' : 'pt-24'} pb-16 px-4`}>
        <div className="max-w-2xl mx-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => navigate('/sitting/login')}
            className="mb-4 -ml-2 text-[#4A4A4A]/70 hover:text-[#4A4A4A] hover:bg-[#F5D5E5]/40"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sign In
          </Button>

          {/* Header */}
          <div className="text-center mb-8">
            <p className="text-sm font-medium tracking-wide text-[#4A4A4A]/60 mb-2">SITTER PROGRAM</p>
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2" style={{ color: '#E8A0BF' }}>
              Sitter Application
            </h1>
            <p className="text-[#4A4A4A]/70">
              Please note that some of your responses may be featured on your profile
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" style={{ zIndex: 0 }}></div>
            <div
              className="absolute top-4 left-0 h-0.5 transition-all duration-500"
              style={{
                backgroundColor: '#E8A0BF',
                width: `${((step - 1) / (steps.length - 1)) * 100}%`,
                zIndex: 1
              }}
            ></div>
            {steps.map((s) => (
              <div key={s.number} className="flex flex-col items-center relative z-10">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-all ${
                    step >= s.number ? 'text-white' : 'bg-gray-200 text-gray-500'
                  }`}
                  style={{ backgroundColor: step >= s.number ? '#E8A0BF' : undefined }}
                >
                  {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span className="text-xs mt-1 text-[#4A4A4A]/60 hidden sm:block">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <form onSubmit={submitApplication}>
              {/* Step 1: Account */}
              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold font-heading mb-4 text-[#4A4A4A]">Create Your Account</h2>

                  <div>
                    <Label>Email Address *</Label>
                    <Input
                      type="email"
                      placeholder="you@email.com"
                      {...register("email")}
                      className="mt-1"
                    />
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>}
                  </div>

                  <div>
                    <Label>Password *</Label>
                    <PasswordInput
                      placeholder="At least 8 characters"
                      {...register("password")}
                      className="mt-1"
                    />
                    {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>}
                  </div>

                  <div>
                    <Label>Confirm Password *</Label>
                    <PasswordInput
                      placeholder="Confirm your password"
                      {...register("confirmPassword")}
                      className="mt-1"
                    />
                    {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
                  </div>

                  <div className="flex justify-end pt-4">
                    <Button type="button" onClick={nextStep} style={{ backgroundColor: '#E8A0BF' }} className="text-white hover:opacity-90">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Basic Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold font-heading mb-4 text-[#4A4A4A]">Tell Us About Yourself</h2>

                  <div>
                    <Label>Full Name *</Label>
                    <Input
                      placeholder="Enter your full name"
                      {...register("fullName")}
                      className="mt-1"
                    />
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>}
                  </div>

                  <div>
                    <Label>Phone Number *</Label>
                    <Input
                      type="tel"
                      placeholder="(555) 555-5555"
                      {...register("phone")}
                      className="mt-1"
                    />
                    {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone.message}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>City *</Label>
                      <Input
                        placeholder="Your city"
                        {...register("city")}
                        className="mt-1"
                      />
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city.message}</p>}
                    </div>
                    <div>
                      <Label>State *</Label>
                      <Input
                        placeholder="Your state"
                        {...register("state")}
                        className="mt-1"
                      />
                      {errors.state && <p className="text-red-500 text-sm mt-1">{errors.state.message}</p>}
                    </div>
                  </div>

                  <div>
                    <Label>Zip Code *</Label>
                    <Input
                      placeholder="Your Zip code"
                      {...register("postalCode")}
                      className="mt-1"
                    />
                    {errors.postalCode && <p className="text-red-500 text-sm mt-1">{errors.postalCode.message}</p>}
                  </div>

                  <div>
                    <Label>Date of Birth *</Label>
                    <Input
                      type="date"
                      max={maxSitterBirthDate}
                      {...register("dateOfBirth")}
                      className="mt-1"
                    />
                    {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth.message}</p>}
                  </div>

                  <div>
                    <Label>How did you hear about us? *</Label>
                    <Input
                      placeholder="Instagram, Facebook, TikTok, from a friend, etc."
                      {...register("howDidYouHear")}
                      className="mt-1"
                    />
                    {errors.howDidYouHear && <p className="text-red-500 text-sm mt-1">{errors.howDidYouHear.message}</p>}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} style={{ backgroundColor: '#E8A0BF' }} className="text-white hover:opacity-90">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Experience */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold font-heading mb-4 text-[#4A4A4A]">Your Experience</h2>

                  <div>
                    <Label>Years of Experience *</Label>
                    <Input
                      placeholder="e.g. 3 years"
                      {...register("yearsOfExperience")}
                      className="mt-1"
                    />
                    {errors.yearsOfExperience && <p className="text-red-500 text-sm mt-1">{errors.yearsOfExperience.message}</p>}
                  </div>

                  <div>
                    <Label>Age Groups Worked With *</Label>
                    <Input
                      placeholder="e.g. Infants, Toddlers, School-age"
                      {...register("ageGroupsWorkedWith")}
                      className="mt-1"
                    />
                    {errors.ageGroupsWorkedWith && <p className="text-red-500 text-sm mt-1">{errors.ageGroupsWorkedWith.message}</p>}
                  </div>

                  <div>
                    <Label>Types of Experience *</Label>
                    <Input
                      placeholder="e.g. babysitting, church nursery, tutoring, youth ministry, camp counselor..."
                      {...register("typesOfExperience")}
                      className="mt-1"
                    />
                    {errors.typesOfExperience && <p className="text-red-500 text-sm mt-1">{errors.typesOfExperience.message}</p>}
                  </div>

                  <div>
                    <Label>Tell Us About Your Experience *</Label>
                    <Textarea
                      placeholder="Describe your experience working with children. What do you enjoy most? What's your approach?"
                      {...register("experienceDescription")}
                      className="mt-1 min-h-[120px]"
                    />
                    {errors.experienceDescription && <p className="text-red-500 text-sm mt-1">{errors.experienceDescription.message}</p>}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} style={{ backgroundColor: '#E8A0BF' }} className="text-white hover:opacity-90">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Faith & Calling */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold font-heading mb-4 text-[#4A4A4A]">Faith & Calling</h2>

                  <div>
                    <Label>Tell Us About Your Faith Journey *</Label>
                    <Textarea
                      placeholder="Share about your relationship with God and how faith shapes your life..."
                      {...register("faithJourney")}
                      className="mt-1 min-h-[120px]"
                    />
                    {errors.faithJourney && <p className="text-red-500 text-sm mt-1">{errors.faithJourney.message}</p>}
                  </div>

                  <div>
                    <Label>Why Do You Feel Called to Serve Families? *</Label>
                    <Textarea
                      placeholder="What draws you to this work? How do you see childcare as a calling?"
                      {...register("whyCalledToServe")}
                      className="mt-1 min-h-[120px]"
                    />
                    {errors.whyCalledToServe && <p className="text-red-500 text-sm mt-1">{errors.whyCalledToServe.message}</p>}
                  </div>

                  <div>
                    <Label>Any Special Skills?</Label>
                    <Input
                      placeholder="CPR certification, first aid, languages, etc."
                      {...register("specialSkills")}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} style={{ backgroundColor: '#E8A0BF' }} className="text-white hover:opacity-90">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 5: Rates & Review */}
              {step === 5 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold font-heading mb-4 text-[#4A4A4A]">Rates & Review</h2>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Rate for 1 Kid ($/hr) *</Label>
                      <Input
                        type="number"
                        placeholder="$/hr"
                        {...register("hourlyRate1Kid")}
                        className="mt-1"
                      />
                      {errors.hourlyRate1Kid && <p className="text-red-500 text-sm mt-1">{errors.hourlyRate1Kid.message}</p>}
                    </div>
                    <div>
                      <Label>Rate for 2 Kids ($/hr) *</Label>
                      <Input
                        type="number"
                        placeholder="$/hr"
                        {...register("hourlyRate2Kids")}
                        className="mt-1"
                      />
                      {errors.hourlyRate2Kids && <p className="text-red-500 text-sm mt-1">{errors.hourlyRate2Kids.message}</p>}
                    </div>
                    <div>
                      <Label>Rate for 3+ Kids ($/hr) *</Label>
                      <Input
                        type="number"
                        placeholder="$/hr"
                        {...register("hourlyRate3PlusKids")}
                        className="mt-1"
                      />
                      {errors.hourlyRate3PlusKids && <p className="text-red-500 text-sm mt-1">{errors.hourlyRate3PlusKids.message}</p>}
                    </div>
                  </div>

                  {/* Application Fee */}
                  <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: '#F5D5E5' }}>
                    <h3 className="font-medium text-[#4A4A4A] mb-2">Application & Subscription</h3>
                    <div className="flex justify-between text-sm text-[#4A4A4A]/80">
                      <span>Application Fee (non-refundable)</span>
                      <span className="font-semibold">$45.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#4A4A4A]/80 mt-2">
                      <span>First Month Subscription</span>
                      <span className="font-semibold">$12.00</span>
                    </div>
                    <div className="flex justify-between text-sm text-[#4A4A4A] border-t border-white/50 mt-3 pt-3">
                      <span className="font-medium">Total Due Today</span>
                      <span className="font-bold">$57.00</span>
                    </div>
                    <p className="text-xs text-[#4A4A4A]/60 mt-3">
                      Covers your application review, interview process, background check and entry into our sitter network.
                    </p>
                    <p className="text-xs text-[#4A4A4A]/70 mt-2">
                      The $12 first month subscription will be refunded if your application is rejected. If approved, it becomes your first monthly subscription fee.
                    </p>
                  </div>

                  {/* Consent Checkboxes */}
                  <div className="space-y-4 mt-6">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="backgroundCheck"
                        checked={watch("backgroundCheckConsent")}
                        onCheckedChange={(checked) => setValue("backgroundCheckConsent", checked as boolean)}
                      />
                      <label htmlFor="backgroundCheck" className="text-sm text-[#4A4A4A]/80 leading-relaxed cursor-pointer">
                        I understand that a background check will be conducted and references will be verified as part of the application process, and the $45 application fee is required.
                      </label>
                    </div>
                    {errors.backgroundCheckConsent && <p className="text-red-500 text-sm">{errors.backgroundCheckConsent.message}</p>}

                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="membership"
                        checked={watch("membershipConsent")}
                        onCheckedChange={(checked) => setValue("membershipConsent", checked as boolean)}
                      />
                      <label htmlFor="membership" className="text-sm text-[#4A4A4A]/80 leading-relaxed cursor-pointer">
                        I understand that submitting this application includes a $12 first month subscription fee. This $12 will be refunded if I am rejected, or applied as my first monthly subscription fee if I am approved.
                      </label>
                    </div>
                    {errors.membershipConsent && <p className="text-red-500 text-sm">{errors.membershipConsent.message}</p>}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      type="button"
                      onClick={() => submitApplication()}
                      disabled={isSubmitting}
                      style={{ backgroundColor: '#E8A0BF' }}
                      className="text-white hover:opacity-90 disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          Submit Application <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                      )}
                    </Button>
                  </div>
                  {checkoutUrl && (
                    <div className="pt-3 text-center">
                      <a
                        href={checkoutUrl}
                        className="text-sm font-medium underline"
                        style={{ color: '#E8A0BF' }}
                      >
                        Continue to payment
                      </a>
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
