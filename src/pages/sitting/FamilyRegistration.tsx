import { useEffect, useState } from "react";
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
import {
  getRegistrationCheckout,
  clearRegistrationData,
  getRegistrationData,
  saveRegistrationCheckout,
  saveRegistrationData
} from "@/lib/registrationStorage";

const API_URL = import.meta.env.VITE_API_URL || '';

// Combined schema for all fields
const formSchema = z.object({
  // Account
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string(),

  // Basic Info
  parentName: z.string().min(1, "Parent/Guardian name is required"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  postalCode: z.string().min(5, "Please enter a valid ZIP code"),

  // Children
  numberOfChildren: z.coerce.number().min(1, "Number of children is required"),
  childrenAges: z.string().min(1, "Children's ages are required"),
  specialNeeds: z.string().optional(),

  // About
  howDidYouHear: z.string().min(1, "Please tell us how you heard about us"),
  faithBackground: z.string().min(20, "Please share about your faith background (at least 20 characters)"),
  familyValues: z.string().min(20, "Please share your family values (at least 20 characters)"),

  // Agreement
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
  parentName: "",
  phone: "",
  city: "",
  state: "",
  postalCode: "",
  numberOfChildren: 1,
  childrenAges: "",
  specialNeeds: "",
  howDidYouHear: "",
  faithBackground: "",
  familyValues: "",
  membershipConsent: false,
};

function getSavedDefaults(): FormData {
  const saved = getRegistrationData('familyRegistrationData');
  if (!saved) return emptyDefaults;

  try {
    const data = JSON.parse(saved);
    return {
      ...emptyDefaults,
      email: data.email || "",
      password: data.password || "",
      confirmPassword: data.password || "",
      parentName: data.householdName || "",
      phone: data.phone || "",
      city: data.city || "",
      state: data.state || "",
      postalCode: data.postalCode || "",
      numberOfChildren: Number(data.numberOfChildren || 1),
      childrenAges: data.childrenAges || "",
      specialNeeds: data.specialNeeds || "",
      howDidYouHear: data.howDidYouHear || "",
      faithBackground: data.faithBackground || "",
      familyValues: data.familyValues || "",
      membershipConsent: true,
    };
  } catch (error) {
    console.warn('Could not restore saved family registration data', error);
    return emptyDefaults;
  }
}

export default function FamilyRegistration() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const runningAsApp = isStandaloneApp();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: getSavedDefaults(),
    mode: "onChange"
  });

  const { register, handleSubmit, formState: { errors }, watch, setValue, trigger } = form;

  useEffect(() => {
    const resetCompletedRegistration = () => {
      if (sessionStorage.getItem('club_nanny_sitting_registration_completed') === 'sitting_family') {
        clearRegistrationData('familyRegistrationData');
        clearRegistrationData('familyRegistrationCheckout');
        sessionStorage.removeItem('club_nanny_sitting_registration_completed');
        form.reset(emptyDefaults);
        setStep(1);
      }
    };

    resetCompletedRegistration();
    window.addEventListener('pageshow', resetCompletedRegistration);
    return () => window.removeEventListener('pageshow', resetCompletedRegistration);
  }, [form]);

  const validateStep = async (currentStep: number): Promise<boolean> => {
    let fieldsToValidate: (keyof FormData)[] = [];

    switch (currentStep) {
      case 1:
        fieldsToValidate = ["email", "password", "confirmPassword"];
        break;
      case 2:
        fieldsToValidate = ["parentName", "phone", "city", "state", "postalCode"];
        break;
      case 3:
        fieldsToValidate = ["numberOfChildren", "childrenAges", "howDidYouHear"];
        break;
      case 4:
        fieldsToValidate = ["faithBackground", "familyValues", "membershipConsent"];
        break;
    }

    const result = await trigger(fieldsToValidate);
    return result;
  };

  const nextStep = async () => {
    const isValid = await validateStep(step);
    if (isValid && step < 4) {
      setStep(step + 1);
    }
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);

    try {
      // Parse children ages into array
      const childrenAgesArray = data.childrenAges.split(',').map(age => ({
        name: `Child`,
        age: parseInt(age.trim()) || 0,
        specialNeeds: data.specialNeeds || ''
      }));

      // Full registration payload (carried through to account creation)
      const payload = {
        email: data.email,
        password: data.password,
        householdName: data.parentName,
        phone: data.phone,
        city: data.city,
        state: data.state,
        postalCode: data.postalCode,
        numberOfChildren: data.numberOfChildren,
        childrenAges: data.childrenAges,
        children: childrenAgesArray,
        specialNeeds: data.specialNeeds,
        howDidYouHear: data.howDidYouHear,
        faithBackground: data.faithBackground,
        familyValues: data.familyValues,
      };

      // Production: pay-first — store the form data, create a Stripe checkout, redirect.
      if (import.meta.env.PROD) {
        const dataSaved = saveRegistrationData('familyRegistrationData', payload);
        if (!dataSaved) {
          toast({
            title: "Registration Error",
            description: "Your browser blocked local storage. Please allow site storage and try again.",
            variant: "destructive"
          });
          setIsSubmitting(false);
          return;
        }

        const existingCheckout = getRegistrationCheckout('familyRegistrationCheckout', payload.email);
        if (existingCheckout?.sessionId && existingCheckout?.checkoutUrl) {
          try {
            const verifyResponse = await fetch(`${API_URL}/api/stripe/verify-session/${existingCheckout.sessionId}`);
            const verifyResult = await verifyResponse.json();
            if (verifyResult.success && verifyResult.paid) {
              navigate(`/sitting/registration-complete?type=sitting_family&payment=success&session_id=${existingCheckout.sessionId}`);
              return;
            }
          } catch (verifyError) {
            console.warn('Could not verify existing family checkout session', verifyError);
          }

          window.location.assign(existingCheckout.checkoutUrl);
          return;
        }

        const response = await fetch(`${API_URL}/api/sitting/auth/register/family`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        const result = await response.json();
        if (result.success && result.paid && result.sessionId) {
          saveRegistrationCheckout('familyRegistrationCheckout', {
            email: payload.email,
            sessionId: result.sessionId,
            checkoutUrl: result.checkoutUrl || ''
          });
          navigate(`/sitting/registration-complete?type=sitting_family&payment=success&session_id=${result.sessionId}`);
          return;
        }
        if (result.success && result.checkoutUrl) {
          saveRegistrationCheckout('familyRegistrationCheckout', {
            email: payload.email,
            sessionId: result.sessionId,
            checkoutUrl: result.checkoutUrl
          });
          window.location.assign(result.checkoutUrl);
          return;
        }
        toast({ title: "Registration Error", description: result.message || "Could not start checkout", variant: "destructive" });
        setIsSubmitting(false);
        return;
      }

      // Dev/test: bypass payment, create + log in immediately
      const response = await fetch(`${API_URL}/api/sitting/auth/register-test/family`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (result.success) {
        login(result.token, result.user);
        toast({
          title: "Welcome to Club Nanny!",
          description: "Your membership is active. Redirecting to your requests...",
        });
        navigate('/sitting/family/requests');
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

  const steps = [
    { number: 1, label: "Account" },
    { number: 2, label: "Contact" },
    { number: 3, label: "Children" },
    { number: 4, label: "Values" }
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
            <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2" style={{ color: '#C77DA3' }}>
              Family Application
            </h1>
            <p className="text-[#4A4A4A]/70">
              Tell us about your family
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-between mb-8 relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200" style={{ zIndex: 0 }}></div>
            <div
              className="absolute top-4 left-0 h-0.5 transition-all duration-500"
              style={{
                backgroundColor: '#C77DA3',
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
                  style={{ backgroundColor: step >= s.number ? '#C77DA3' : undefined }}
                >
                  {step > s.number ? <Check className="w-4 h-4" /> : s.number}
                </div>
                <span className="text-xs mt-1 text-[#4A4A4A]/60 hidden sm:block">{s.label}</span>
              </div>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} autoComplete="off">
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
                    <Button type="button" onClick={nextStep} style={{ backgroundColor: '#C77DA3' }} className="text-white hover:opacity-90">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Contact Info */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold font-heading mb-4 text-[#4A4A4A]">Contact Information</h2>

                  <div>
                    <Label>Parent/Guardian Name *</Label>
                    <Input
                      placeholder="Enter your full name"
                      {...register("parentName")}
                      className="mt-1"
                    />
                    {errors.parentName && <p className="text-red-500 text-sm mt-1">{errors.parentName.message}</p>}
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

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} style={{ backgroundColor: '#C77DA3' }} className="text-white hover:opacity-90">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Children */}
              {step === 3 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold font-heading mb-4 text-[#4A4A4A]">About Your Children</h2>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Number of Children *</Label>
                      <Input
                        type="number"
                        placeholder="How many children?"
                        {...register("numberOfChildren")}
                        className="mt-1"
                      />
                      {errors.numberOfChildren && <p className="text-red-500 text-sm mt-1">{errors.numberOfChildren.message}</p>}
                    </div>
                    <div>
                      <Label>Children's Ages *</Label>
                      <Input
                        placeholder="E.g. 3, 5, 8"
                        {...register("childrenAges")}
                        className="mt-1"
                      />
                      {errors.childrenAges && <p className="text-red-500 text-sm mt-1">{errors.childrenAges.message}</p>}
                    </div>
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

                  <div>
                    <Label>Special Needs or Considerations</Label>
                    <Textarea
                      placeholder="Any allergies, medical needs, or special considerations..."
                      {...register("specialNeeds")}
                      className="mt-1 min-h-[80px]"
                    />
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button type="button" onClick={nextStep} style={{ backgroundColor: '#C77DA3' }} className="text-white hover:opacity-90">
                      Continue <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Values & Review */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold font-heading mb-4 text-[#4A4A4A]">Faith & Values</h2>

                  <div>
                    <Label>Tell Us About Your Faith Background *</Label>
                    <Textarea
                      placeholder="Share a bit about your faith journey and how faith plays a role in your family life..."
                      {...register("faithBackground")}
                      className="mt-1 min-h-[100px]"
                    />
                    {errors.faithBackground && <p className="text-red-500 text-sm mt-1">{errors.faithBackground.message}</p>}
                  </div>

                  <div>
                    <Label>What Values Are Most Important to Your Family? *</Label>
                    <Textarea
                      placeholder="What character traits and values do you prioritize in raising your children?"
                      {...register("familyValues")}
                      className="mt-1 min-h-[100px]"
                    />
                    {errors.familyValues && <p className="text-red-500 text-sm mt-1">{errors.familyValues.message}</p>}
                  </div>

                  {/* Membership Fee */}
                  <div className="mt-6 p-4 rounded-xl" style={{ backgroundColor: '#F5D5E5' }}>
                    <h3 className="font-medium text-[#4A4A4A] mb-2">Membership Fee</h3>
                    <div className="flex justify-between text-sm text-[#4A4A4A]/80">
                      <span>Monthly Membership</span>
                      <span className="font-semibold">$20.00/month</span>
                    </div>
                  </div>

                  {/* Consent Checkbox */}
                  <div className="space-y-4 mt-6">
                    <div className="flex items-start space-x-3">
                      <Checkbox
                        id="membership"
                        checked={watch("membershipConsent")}
                        onCheckedChange={(checked) => setValue("membershipConsent", checked as boolean)}
                      />
                      <label htmlFor="membership" className="text-sm text-[#4A4A4A]/80 leading-relaxed cursor-pointer">
                        I understand that submitting this application grants me a membership to access trusted, vetted babysitters via the Club Nanny app. I will need to download the app in order to create a profile and have access to the sitters.
                      </label>
                    </div>
                    {errors.membershipConsent && <p className="text-red-500 text-sm">{errors.membershipConsent.message}</p>}
                  </div>

                  <div className="flex justify-between pt-4">
                    <Button type="button" variant="outline" onClick={prevStep}>
                      <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                    <Button
                      type="submit"
                      disabled={isSubmitting || !watch("membershipConsent")}
                      style={{ backgroundColor: '#C77DA3' }}
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
