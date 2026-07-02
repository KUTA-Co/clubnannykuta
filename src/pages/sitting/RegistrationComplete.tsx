import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Loader2, Clock } from "lucide-react";
import { GlassButton } from "@/components/ui/effects";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { DownloadAppButton } from "@/components/DownloadAppButton";
import { clearRegistrationData, getRegistrationData } from "@/lib/registrationStorage";

const API_URL = import.meta.env.VITE_API_URL || '';

export default function RegistrationComplete() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [userType, setUserType] = useState<'sitter' | 'sitting_family' | null>(null);

  const sessionId = searchParams.get('session_id');
  const type = searchParams.get('type') as 'sitter' | 'sitting_family' | null;
  const paymentStatus = searchParams.get('payment');

  useEffect(() => {
    if (paymentStatus !== 'success' || !sessionId || !type) {
      setStatus('error');
      setErrorMessage('Invalid registration link');
      return;
    }

    setUserType(type);
    completeRegistration();
  }, [sessionId, type, paymentStatus]);

  const completeRegistration = async () => {
    setStatus('loading');
    setErrorMessage('');

    try {
      // Get stored form data. On live domains the user may start on www and
      // return from Stripe on the apex domain, so local storage can be empty.
      // The backend now stores pending registration data server-side and can
      // finalize with only the paid Stripe session id.
      const storageKey = type === 'sitter' ? 'sitterRegistrationData' : 'familyRegistrationData';
      const storedData = getRegistrationData(storageKey);
      let formData = {};
      if (storedData) {
        try {
          formData = JSON.parse(storedData);
        } catch (parseError) {
          console.warn('Could not parse stored registration data; falling back to server-side registration recovery', parseError);
        }
      }

      // Complete registration
      const endpoint = type === 'sitter'
        ? '/api/sitting/auth/complete/sitter'
        : '/api/sitting/auth/complete/family';

      // Forward the full stored payload so no registration-form field is dropped
      const body = { sessionId, ...formData };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const result = await response.json();

      if (result.success) {
        // Clear stored data
        clearRegistrationData(storageKey);
        clearRegistrationData(type === 'sitter' ? 'sitterRegistrationCheckout' : 'familyRegistrationCheckout');
        sessionStorage.setItem('club_nanny_sitting_registration_completed', type);

        // Log the user in
        if (result.token) {
          login(result.token, result.user);
        }

        setStatus('success');
      } else {
        setStatus('error');
        setErrorMessage(result.message || 'Failed to complete registration. If your payment went through, please contact Club Nanny before trying another payment.');
      }
    } catch (error) {
      console.error('Registration completion error:', error);
      setStatus('error');
      setErrorMessage('An error occurred. Please contact support.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      <main className="flex-1 pt-24 pb-16 px-4 flex items-center justify-center">
        <div className="max-w-md w-full">
          {status === 'loading' && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: '#E8A0BF' }} />
              <h1 className="text-xl font-bold font-heading mb-2 text-[#4A4A4A]">
                Completing Registration...
              </h1>
              <p className="text-[#4A4A4A]/60">Please wait while we set up your account.</p>
            </div>
          )}

          {status === 'error' && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                <span className="text-red-500 text-2xl">!</span>
              </div>
              <h1 className="text-xl font-bold font-heading mb-2 text-[#4A4A4A]">
                Registration Error
              </h1>
              <p className="text-[#4A4A4A]/60 mb-6">{errorMessage}</p>
              <div className="space-y-3">
                {paymentStatus === 'success' && sessionId && type && (
                  <Button
                    type="button"
                    onClick={completeRegistration}
                    className="w-full h-12 rounded-xl text-white"
                    style={{ backgroundColor: type === 'sitter' ? '#E8A0BF' : '#C77DA3' }}
                  >
                    Retry Finalizing Registration
                  </Button>
                )}
                <GlassButton
                  to={type === 'sitter' ? '/sitting/register/sitter' : '/sitting/register/family'}
                  variant="sage"
                  size="lg"
                  className="w-full justify-center"
                >
                  Back to Application
                </GlassButton>
              </div>
            </div>
          )}

          {status === 'success' && userType === 'sitter' && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#F5D5E5' }}
              >
                <Clock className="w-8 h-8" style={{ color: '#E8A0BF' }} />
              </div>
              <h1 className="text-2xl font-bold font-heading mb-2" style={{ color: '#E8A0BF' }}>
                Application Submitted!
              </h1>
              <p className="text-[#4A4A4A]/70 mb-6">
                Thank you for applying to become a sitter! Your application is now pending review.
                We'll notify you by email once you've been approved.
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-medium text-[#4A4A4A] mb-2">What's Next?</h3>
                <ul className="text-sm text-[#4A4A4A]/70 space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5" style={{ color: '#E8A0BF' }} />
                    Download the Club Nanny app
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5" style={{ color: '#E8A0BF' }} />
                    Our team will review your application
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5" style={{ color: '#E8A0BF' }} />
                    You'll receive an email when approved
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5" style={{ color: '#E8A0BF' }} />
                    Then you can start browsing jobs!
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <DownloadAppButton className="w-full justify-center border-[#E8A0BF] bg-[#E8A0BF] text-white hover:bg-white hover:text-[#E8A0BF]" />
                <GlassButton to="/program" variant="sage" size="lg" className="w-full justify-center">
                  Back to Home
                </GlassButton>
              </div>
            </div>
          )}

          {status === 'success' && userType === 'sitting_family' && (
            <div className="bg-white rounded-2xl shadow-sm p-8 text-center">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ backgroundColor: '#F5D5E5' }}
              >
                <Check className="w-8 h-8" style={{ color: '#C77DA3' }} />
              </div>
              <h1 className="text-2xl font-bold font-heading mb-2" style={{ color: '#C77DA3' }}>
                Welcome to Club Nanny!
              </h1>
              <p className="text-[#4A4A4A]/70 mb-6">
                Your family account is now active. You can start posting babysitting requests right away!
              </p>
              <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
                <h3 className="font-medium text-[#4A4A4A] mb-2">Get Started</h3>
                <ul className="text-sm text-[#4A4A4A]/70 space-y-2">
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5" style={{ color: '#C77DA3' }} />
                    Download the Club Nanny app
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5" style={{ color: '#C77DA3' }} />
                    Post your first babysitting request
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5" style={{ color: '#C77DA3' }} />
                    Browse sitter responses
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="w-4 h-4 mt-0.5" style={{ color: '#C77DA3' }} />
                    Confirm your preferred sitter
                  </li>
                </ul>
              </div>
              <div className="space-y-3">
                <DownloadAppButton className="w-full justify-center border-[#C77DA3] bg-[#C77DA3] text-white hover:bg-white hover:text-[#C77DA3]" />
                <GlassButton to="/sitting/family/request" variant="sage" size="lg" className="w-full justify-center">
                  Post a Request
                </GlassButton>
                <GlassButton to="/sitting/family/requests" variant="outline" size="lg" className="w-full justify-center">
                  Go to Requests
                </GlassButton>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
