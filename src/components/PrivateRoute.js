import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';
import EmailVerification from './EmailVerification';

/**
 * PrivateRoute component that protects routes requiring authentication
 * If user is not logged in, they are redirected to the login page
 * If user is not verified, they see a verification required page
 * 
 * NOTE: Authentication check is temporarily disabled - will always show dashboard
 */
function PrivateRoute({ children, requireVerification = true }) {
  const { currentUser, loading } = useAuth();

  // TEMPORARILY DISABLED - Always render children without authentication
  return children;

  /* Original authentication logic (commented out)
  // Show loading state while checking authentication
  if (loading) {
    return <LoadingSpinner fullScreen={true} text="Authenticating..." />;
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    return <Navigate to="/login" />;
  }
  
  // Check email verification if required
  if (requireVerification && !currentUser.emailVerified) {
    return <EmailVerification />;
  }

  // Render the protected content if authenticated and verified
  return children;
  */
}

export default PrivateRoute; 