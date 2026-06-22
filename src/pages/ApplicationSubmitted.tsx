import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Mail, ArrowRight, Heart, Loader2, AlertCircle } from "lucide-react";

export default function ApplicationSubmitted() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const type = searchParams.get('type') || 'family';
  const sessionId = searchParams.get('session_id');
  const isFamily = type === 'family';

  const [isVerifying, setIsVerifying] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyAndCompleteApplication = async () => {
      // If no session ID, user arrived here incorrectly
      if (!sessionId) {
        setError('No payment session found. Please submit your application again.');
        setIsVerifying(false);
        return;
      }

      const apiUrl = import.meta.env.VITE_API_URL || '';

      try {
        // Step 1: Verify payment with Stripe
        setStatusMessage('Verifying your payment...');
        const response = await fetch(`${apiUrl}/api/stripe/verify-session/${sessionId}`);
        const data = await response.json();

        if (!response.ok) {
          setError('Unable to verify payment status. Please contact support.');
          setIsVerifying(false);
          return;
        }

        if (!data.paid) {
          // Not paid - redirect back to application form
          setError('Payment was not completed. Please try again.');
          setIsVerifying(false);
          return;
        }

        // Step 2: Payment confirmed! Now submit the application
        setStatusMessage('Saving your application...');

        // Get pending application from sessionStorage
        const pendingAppStr = sessionStorage.getItem('pendingApplication');

        if (!pendingAppStr) {
          // Edge case: sessionStorage was cleared but payment completed
          // Check if application was already saved (by webhook or previous attempt)
          if (data.applicationId) {
            // Application already exists, show success
            setIsPaid(true);
            setIsVerifying(false);
            return;
          }

          setError('Application data not found. Your payment was successful, but we could not find your application details. Please contact support at Leigh@clubnanny.com with your payment confirmation.');
          setIsVerifying(false);
          return;
        }

        const pendingApp = JSON.parse(pendingAppStr);

        // Step 3: Complete the application (save to database)
        const completeResponse = await fetch(`${apiUrl}/api/forms/complete-application`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId,
            type: pendingApp.type,
            formData: pendingApp.data
          })
        });

        const completeData = await completeResponse.json();

        if (!completeResponse.ok) {
          // Check if it's a "already processed" response
          if (completeData.message === 'Application already processed') {
            // Clear sessionStorage and show success
            sessionStorage.removeItem('pendingApplication');
            setIsPaid(true);
            setIsVerifying(false);
            return;
          }

          setError(completeData.error || 'Failed to save application. Please contact support.');
          setIsVerifying(false);
          return;
        }

        // Success! Clear sessionStorage
        sessionStorage.removeItem('pendingApplication');
        setIsPaid(true);
        setIsVerifying(false);

      } catch (err) {
        console.error('Application completion error:', err);
        setError('Error completing your application. Please contact support at Leigh@clubnanny.com');
        setIsVerifying(false);
      }
    };

    verifyAndCompleteApplication();
  }, [sessionId, type]);

  // Show loading while verifying
  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
        <Navigation />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" style={{ color: '#8BA99E' }} />
            <p className="text-[#4A4A4A]">{statusMessage}</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show error if verification failed
  if (error) {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
        <Navigation />
        <div className="flex-1 flex items-center justify-center px-4 pt-32 pb-20">
          <Card className="shadow-lg border-none max-w-md w-full">
            <CardContent className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-bold font-heading text-[#4A4A4A] mb-2">Payment Issue</h2>
              <p className="text-[#4A4A4A]/70 mb-6">{error}</p>
              <div className="flex flex-col gap-3">
                <Button
                  className="rounded-full text-white h-12"
                  style={{ backgroundColor: '#8BA99E' }}
                  onClick={() => navigate(`/apply-${type}`)}
                >
                  Try Again
                </Button>
                <a
                  href="mailto:Leigh@clubnanny.com"
                  className="text-sm text-[#4A4A4A]/70 hover:text-[#8BA99E] transition-colors"
                >
                  Contact Support
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
        <Footer />
      </div>
    );
  }

  // Show success (only if isPaid is true)
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      <div className="flex-1 pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <Card className="shadow-lg border-none overflow-hidden">
            {/* Success Header */}
            <div className="py-12 px-6 text-center" style={{ backgroundColor: '#8BA99E' }}>
              <div className="h-20 w-20 rounded-full flex items-center justify-center mx-auto mb-6 bg-white">
                <CheckCircle2 className="h-10 w-10" style={{ color: '#8BA99E' }} />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold font-heading text-white mb-2">
                Application Received!
              </h1>
              <p className="text-lg text-white/90">
                We're so excited to connect with you
              </p>
            </div>

            <CardContent className="p-8">
              {/* Message */}
              <p className="text-lg text-[#4A4A4A]/70 mb-8 text-center">
                Thank you for applying to Club Nanny. We're excited to learn more about
                {isFamily ? " your family" : " you"} and begin the matching process.
              </p>

              {/* What's Next */}
              <div className="bg-[#FAF9F6] rounded-xl p-6 mb-8">
                <h2 className="text-xl font-bold font-heading text-[#4A4A4A] mb-6 text-center">
                  What Happens Next
                </h2>
                <div className="space-y-5">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ backgroundColor: '#8BA99E' }}>
                      1
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#4A4A4A]">We Review Your Application</h3>
                      <p className="text-sm text-[#4A4A4A]/70">
                        Our team will carefully review your application within 2-3 business days.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ backgroundColor: '#8BA99E' }}>
                      2
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#4A4A4A]">Personal Interview</h3>
                      <p className="text-sm text-[#4A4A4A]/70">
                        We'll reach out to schedule a warm, conversational interview to get to know
                        {isFamily ? " your family's heart and home" : " your personality, calling, and approach to childcare"}.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-white text-sm font-bold" style={{ backgroundColor: '#8BA99E' }}>
                      3
                    </div>
                    <div>
                      <h3 className="font-semibold text-[#4A4A4A]">
                        {isFamily ? "Values-Based Matching" : "Placement Coordinator"}
                      </h3>
                      <p className="text-sm text-[#4A4A4A]/70">
                        {isFamily
                          ? "We'll thoughtfully match you with a caregiver who aligns with your values and needs."
                          : "You'll be paired with a coordinator who will help identify families that align with your values."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="border-t border-[#E8E5DF] pt-6 mb-8">
                <p className="text-sm text-[#4A4A4A]/70 mb-4 text-center">
                  Questions? We're here to help.
                </p>
                <div className="flex justify-center">
                  <a href="mailto:Leigh@clubnanny.com" className="flex items-center justify-center gap-2 text-[#4A4A4A]/70 hover:text-[#8BA99E] transition-colors">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">Leigh@clubnanny.com</span>
                  </a>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  className="rounded-full text-white h-12 px-8"
                  style={{ backgroundColor: '#4A4A4A' }}
                  asChild
                >
                  <Link to="/">
                    Back to Home
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full h-12 px-8 border-2"
                  style={{ borderColor: '#8BA99E', color: '#8BA99E' }}
                  asChild
                >
                  <Link to="/about">
                    <Heart className="mr-2 h-4 w-4" />
                    Learn About Us
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
