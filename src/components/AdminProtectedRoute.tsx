import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Preloader } from '@/components/Preloader';

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  // DEV MODE: Check for dev token
  const isDev = import.meta.env.DEV;
  const devToken = localStorage.getItem("club_nanny_token");
  const devUser = localStorage.getItem("club_nanny_user");

  if (isDev && devToken === "dev-token-123" && devUser) {
    const userData = JSON.parse(devUser);
    if (userData.role === "admin") {
      return <>{children}</>;
    }
  }

  if (isLoading) {
    return <Preloader />;
  }

  // Not authenticated - redirect to admin login
  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  // Authenticated but not admin - redirect to admin login with error
  if (user?.role !== 'admin') {
    return <Navigate to="/admin/login" replace />;
  }

  return <>{children}</>;
}
