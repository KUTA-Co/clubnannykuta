import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface SittingProtectedRouteProps {
  children: ReactNode;
  role?: "sitter" | "family";
}

/**
 * Guards the Club Nanny sitter-side dashboards.
 * - While auth is still loading, shows a spinner (avoids a flash redirect).
 * - If not logged in, redirects to /sitting/login (remembering where they were headed).
 * - If logged in with the wrong role, sends them to their own dashboard.
 */
export function SittingProtectedRoute({ children, role }: SittingProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#FAF9F6]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: "#C77DA3" }} />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/sitting/login" state={{ from: location }} replace />;
  }

  if (role && user?.role !== role) {
    const home =
      user?.role === "sitter" ? "/sitting/sitter" : user?.role === "family" ? "/sitting/family" : "/";
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}

export default SittingProtectedRoute;
