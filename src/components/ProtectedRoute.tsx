import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Preloader } from '@/components/Preloader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'family' | 'nanny' | 'admin';
  requireAdmin?: boolean;
}

export function ProtectedRoute({ children, requiredRole, requireAdmin }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <Preloader />;
  }

  if (!isAuthenticated) {
    // Redirect to login, preserving the intended destination
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check for admin requirement
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  // Check for specific role requirement
  if (requiredRole && user?.role !== requiredRole && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

// HOC version for convenience
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  options?: { requiredRole?: 'family' | 'nanny' | 'admin'; requireAdmin?: boolean }
) {
  return function AuthenticatedComponent(props: P) {
    return (
      <ProtectedRoute {...options}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
