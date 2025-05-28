import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth-context';
import { useEffect } from 'react';
import { apiService } from '../lib/api';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute - Current state:', {
      user,
      loading,
      path: location.pathname
    });

    // Verifica aggiuntiva del token
    const token = apiService.verifyToken();
    if (!token && !loading) {
      console.log('ProtectedRoute - No token found');
      return;
    }
  }, [user, loading, location]);

  if (loading) {
    console.log('ProtectedRoute - Loading state');
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  // Verifica sia l'utente che il token
  const token = apiService.verifyToken();
  if (!user || !token) {
    console.log('ProtectedRoute - No user or token, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('ProtectedRoute - Rendering protected content');
  return <>{children}</>;
} 