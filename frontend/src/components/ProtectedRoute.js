import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { isAuthenticated, user } = useAuth();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  // If roles are specified, check if user has the required role
  if (allowedRoles.length > 0 && user && !allowedRoles.includes(user.role)) {
    // Redirect to a different page based on user's role
    if (user.role === 'normal_user') {
      return <Navigate to="/stores" />;
    } else if (user.role === 'store_owner') {
      return <Navigate to="/store-owner/dashboard" />;
    } else if (user.role === 'system_administrator') {
      return <Navigate to="/admin/dashboard" />;
    }
    
    // Default fallback
    return <Navigate to="/" />;
  }

  // If authenticated and authorized, render the children
  return children;
}

export default ProtectedRoute;