import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { Preloader } from "@/components/Preloader";
import { ScrollToTop } from "@/components/ScrollToTop";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { SittingProtectedRoute } from "@/components/sitting/SittingProtectedRoute";
import { InstallPrompt } from "@/components/InstallPrompt";
import { OfflineBanner } from "@/components/OfflineBanner";
import { useState, useEffect, lazy, Suspense } from "react";
import { usePageTracking } from "@/hooks/usePageTracking";
import { initGA4 } from "@/lib/analytics";
import { isStandaloneApp } from "@/lib/pwa";

// Lazy load public pages for code splitting
const AppLaunch = lazy(() => import("./pages/AppLaunch"));
const Landing = lazy(() => import("./pages/Landing"));
const About = lazy(() => import("./pages/About"));
const Program = lazy(() => import("./pages/Program"));
const ForFamilies = lazy(() => import("./pages/ForFamilies"));
const BecomeNanny = lazy(() => import("./pages/BecomeNanny"));
const ForNannies = lazy(() => import("./pages/ForNannies"));
const ForSitters = lazy(() => import("./pages/ForSitters"));
const Contact = lazy(() => import("./pages/Contact"));

// Application Pages
const FamilyApplication = lazy(() => import("./pages/FamilyApplication"));
const NannyApplication = lazy(() => import("./pages/NannyApplication"));
const ApplicationSubmitted = lazy(() => import("./pages/ApplicationSubmitted"));

// Admin Pages - Direct imports to avoid React duplication issues
import AdminLogin from "./pages/admin/Login";
import AdminLayout from "./pages/admin/AdminLayout";
import AdminDashboard from "./pages/admin/Dashboard";
import AdminFamilyApplications from "./pages/admin/FamilyApplications";
import AdminFamilyApplicationDetail from "./pages/admin/FamilyApplicationDetail";
import AdminNannyApplications from "./pages/admin/NannyApplications";
import AdminNannyApplicationDetail from "./pages/admin/NannyApplicationDetail";
import AdminPayments from "./pages/admin/Payments";
import AdminContacts from "./pages/admin/Contacts";
import AdminSittingSitters from "./pages/admin/SittingSitters";
import AdminSittingSitterDetail from "./pages/admin/SittingSitterDetail";
import AdminSittingFamilies from "./pages/admin/SittingFamilies";

// Club Nanny sitter-side pages
const SitterRegistration = lazy(() => import("./pages/sitting/SitterRegistration"));
const SittingFamilyRegistration = lazy(() => import("./pages/sitting/FamilyRegistration"));
const SittingRegistrationComplete = lazy(() => import("./pages/sitting/RegistrationComplete"));

// Club Nanny - Sitter Dashboard
import SitterDashboardLayout from "./components/sitting/SitterDashboardLayout";
const SitterProfile = lazy(() => import("./pages/sitting/sitter/Profile"));
const SitterJobs = lazy(() => import("./pages/sitting/sitter/Jobs"));
const SitterJobDetail = lazy(() => import("./pages/sitting/sitter/JobDetail"));
const SitterBookings = lazy(() => import("./pages/sitting/sitter/Bookings"));

// Club Nanny - Family Sitter Dashboard
import FamilyDashboardLayout from "./components/sitting/FamilyDashboardLayout";
const SittingFamilyDashboard = lazy(() => import("./pages/sitting/family/Dashboard"));
const SittingFamilyProfile = lazy(() => import("./pages/sitting/family/Profile"));
const SittingFamilyCreateRequest = lazy(() => import("./pages/sitting/family/CreateRequest"));
const SittingFamilyRequests = lazy(() => import("./pages/sitting/family/Requests"));
const SittingFamilyRequestDetail = lazy(() => import("./pages/sitting/family/RequestDetail"));
const SittingFamilyBookings = lazy(() => import("./pages/sitting/family/Bookings"));

// Auth
const Login = lazy(() => import("./pages/Login"));

// Legal Pages
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));

// 404
const NotFound = lazy(() => import("./pages/NotFound"));

// Analytics wrapper - tracks page views on route changes
function AnalyticsTracker() {
  usePageTracking();
  return null;
}

function HomeRoute() {
  return isStandaloneApp() ? <AppLaunch /> : <Program />;
}

const App = () => {
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Initialize Google Analytics
    initGA4();

    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (isInitialLoading) {
    return <Preloader />;
  }

  return (
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <OfflineBanner />
        <InstallPrompt />
        <BrowserRouter>
          <ScrollToTop />
          <AnalyticsTracker />
          <Suspense fallback={<Preloader />}>
            <Routes>
              {/* Info Pages */}
              <Route path="/" element={<HomeRoute />} />
              <Route path="/app" element={<AppLaunch />} />
              <Route path="/sitting" element={<AppLaunch />} />
              <Route path="/home" element={<Landing />} />
              <Route path="/about" element={<About />} />
              <Route path="/program" element={<Program />} />
              <Route path="/for-families" element={<ForFamilies />} />
              <Route path="/become-nanny" element={<BecomeNanny />} />
              <Route path="/for-nannies" element={<ForNannies />} />
              <Route path="/for-sitters" element={<ForSitters />} />
              <Route path="/contact" element={<Contact />} />

              {/* Application Pages (Nanny Program) */}
              <Route path="/apply-family" element={<FamilyApplication />} />
              <Route path="/apply-nanny" element={<NannyApplication />} />
              <Route path="/application-submitted" element={<ApplicationSubmitted />} />

              {/* Club Nanny - Sign In */}
              <Route path="/login" element={<Login />} />
              <Route path="/sitting/login" element={<Login />} />

              {/* Club Nanny - Sitter-side Registration */}
              <Route path="/sitting/register/sitter" element={<SitterRegistration />} />
              <Route path="/sitting/register/family" element={<SittingFamilyRegistration />} />
              <Route path="/sitting/registration-complete" element={<SittingRegistrationComplete />} />

              {/* Club Nanny - Sitter Dashboard (auth required) */}
              <Route
                path="/sitting/sitter"
                element={
                  <SittingProtectedRoute role="sitter">
                    <SitterDashboardLayout />
                  </SittingProtectedRoute>
                }
              >
                <Route index element={<Navigate to="/sitting/sitter/jobs" replace />} />
                <Route path="profile" element={<SitterProfile />} />
                <Route path="availability" element={<Navigate to="/sitting/sitter/jobs" replace />} />
                <Route path="jobs" element={<SitterJobs />} />
                <Route path="jobs/:id" element={<SitterJobDetail />} />
                <Route path="bookings" element={<SitterBookings />} />
              </Route>

              {/* Club Nanny - Family Sitter Dashboard (auth required) */}
              <Route
                path="/sitting/family"
                element={
                  <SittingProtectedRoute role="family">
                    <FamilyDashboardLayout />
                  </SittingProtectedRoute>
                }
              >
                <Route index element={<SittingFamilyDashboard />} />
                <Route path="profile" element={<SittingFamilyProfile />} />
                <Route path="request" element={<SittingFamilyCreateRequest />} />
                <Route path="requests" element={<SittingFamilyRequests />} />
                <Route path="requests/:id" element={<SittingFamilyRequestDetail />} />
                <Route path="bookings" element={<SittingFamilyBookings />} />
              </Route>

              {/* Admin Login - Separate flow */}
              <Route path="/admin/login" element={<AdminLogin />} />

              {/* Admin Routes - Protected */}
              <Route
                path="/admin"
                element={
                  <AdminProtectedRoute>
                    <AdminLayout />
                  </AdminProtectedRoute>
                }
              >
                <Route index element={<AdminDashboard />} />
                <Route path="families" element={<AdminFamilyApplications />} />
                <Route path="families/:id" element={<AdminFamilyApplicationDetail />} />
                <Route path="nannies" element={<AdminNannyApplications />} />
                <Route path="nannies/:id" element={<AdminNannyApplicationDetail />} />
                <Route path="payments" element={<AdminPayments />} />
                <Route path="contacts" element={<AdminContacts />} />
                <Route path="sitting-families" element={<AdminSittingFamilies />} />
                <Route path="sitters" element={<AdminSittingSitters />} />
                <Route path="sitters/:id" element={<AdminSittingSitterDetail />} />
              </Route>

              {/* Legal Pages */}
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  );
};

export default App;
