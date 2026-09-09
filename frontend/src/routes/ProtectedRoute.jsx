import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_HOME = {
  STUDENT: '/student',
  DOCTOR: '/doctor',
  ADMIN: '/admin',
};

export default function ProtectedRoute({ roles, children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="route-loading">
        <div>
          <div className="route-loading-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
            </svg>
          </div>
          <p>Verifying campus credentials...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  if (roles && !roles.includes(user.role)) {
    return <Navigate to={ROLE_HOME[user.role] || '/login'} replace />;
  }

  return children;
}

