import { Navigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, forcePasswordChangeRequired } = useSelector((state: RootState) => state.auth);
  const userRole = localStorage.getItem('role');
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (forcePasswordChangeRequired && location.pathname !== '/change-password') {
    return <Navigate to="/change-password" replace />;
  }

  if (!forcePasswordChangeRequired && location.pathname === '/change-password') {
    return <Navigate to="/dashboard" replace />;
  }

  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
