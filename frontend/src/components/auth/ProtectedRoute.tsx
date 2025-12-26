import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requirePermission?: {
    module: string;
    action: string;
  };
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requirePermission }) => {
  const { isAuthenticated, isLoading, hasPermission } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requirePermission) {
    if (!hasPermission(requirePermission.module, requirePermission.action)) {
      return <Navigate to="/catalog" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;

