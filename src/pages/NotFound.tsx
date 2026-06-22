import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Navigation } from "@/components/Navigation";
import { Footer } from "@/components/Footer";
import { Home, ArrowLeft } from "lucide-react";
import { GlassButton } from "@/components/ui/effects";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#FAF9F6' }}>
      <Navigation />

      <div className="flex-1 flex items-center justify-center pt-32 pb-20 px-4">
        <div className="text-center max-w-lg">
          {/* 404 Number */}
          <div className="mb-8">
            <h1 className="text-[150px] md:text-[200px] font-bold font-heading leading-none" style={{ color: '#8BA99E' }}>
              404
            </h1>
          </div>

          {/* Message */}
          <h2 className="text-2xl md:text-3xl font-bold font-heading text-[#4A4A4A] mb-4">
            Page Not Found
          </h2>
          <p className="text-lg text-[#4A4A4A]/70 mb-8">
            We couldn't find the page you're looking for. It may have been moved or doesn't exist.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <GlassButton to="/" variant="dark" size="lg">
              <Home className="h-5 w-5" />
              Back to Home
            </GlassButton>
            <GlassButton variant="sage" size="lg" onClick={() => window.history.back()}>
              <ArrowLeft className="h-5 w-5" />
              Go Back
            </GlassButton>
          </div>

          {/* Helpful Links */}
          <div className="mt-12 pt-8 border-t border-[#E8E5DF]">
            <p className="text-sm text-[#4A4A4A]/60 mb-4">Looking for something specific?</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link
                to="/for-families"
                className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
                style={{ backgroundColor: '#8BA99E20', color: '#8BA99E' }}
              >
                For Families
              </Link>
              <Link
                to="/become-nanny"
                className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
                style={{ backgroundColor: '#8BA99E20', color: '#8BA99E' }}
              >
                For Nannies
              </Link>
              <Link
                to="/about"
                className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
                style={{ backgroundColor: '#8BA99E20', color: '#8BA99E' }}
              >
                About Us
              </Link>
              <Link
                to="/contact"
                className="text-sm font-medium px-4 py-2 rounded-full transition-colors"
                style={{ backgroundColor: '#8BA99E20', color: '#8BA99E' }}
              >
                Contact
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NotFound;
