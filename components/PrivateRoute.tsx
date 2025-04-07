import { ReactNode } from "react";

/**
 * PrivateRoute component that protects routes requiring authentication
 * If user is not logged in, they are redirected to the login page
 * If user is not verified, they see a verification required page
 *
 * NOTE: Authentication check is temporarily disabled - will always show dashboard
 */
function PrivateRoute({ children }: { children: ReactNode }) {
  // TEMPORARILY DISABLED - Always render children without authentication
  return children;

  /* Original authentication logic (commented out)
  // Show loading state while checking authentication
  if (loading) {
    return <LoadingComponent fullScreen text="Authenticating..." />;
  }
  
  // Redirect to login if not authenticated
  if (!currentUser) {
    router.push('/login');
    return <LoadingComponent fullScreen text="Redirecting..." />;
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
