import React, { useContext, useState, useEffect, createContext } from "react";
import * as authApi from "../../old_website/src/api/authApi";
import { AUTH_TOKEN_NAME, USER_DATA_NAME } from "../../old_website/src/config";
import { useRouter } from "next/router";

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Mock user for development
const MOCK_USER = {
  id: "dev_user_123",
  email: "dev@cymasphere.com",
  displayName: "Development User",
  emailVerified: true,
  createdAt: new Date().toISOString(),
  isAdmin: true,
};

// Provider component that wraps your app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  // Start with null (not MOCK_USER) to avoid hydration mismatch
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // Start with loading true
  const [authError, setAuthError] = useState("");
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  // Check if we're running on client side
  useEffect(() => {
    setIsClient(true);
    // Set mock user after component has mounted to avoid hydration mismatch
    setCurrentUser(MOCK_USER);
    setLoading(false);
  }, []);

  // Sign up function - simplified for development
  async function signup(email, password, displayName) {
    // Just return mock response
    return { user: MOCK_USER, token: "mock_token_dev" };
  }

  // Log in function - simplified for development
  async function login(email, password) {
    // Just return mock response
    return { user: MOCK_USER, token: "mock_token_dev" };
  }

  // Google sign-in function - simplified for development
  async function googleSignIn() {
    // Just return mock response
    return { user: MOCK_USER, token: "mock_token_dev" };
  }

  // Log out function - simplified for development
  async function logout() {
    // Do nothing, keep the mock user
    console.log("Logout called - ignored in development mode");
  }

  // Reset password function - simplified for development
  async function resetPassword(email) {
    console.log("Reset password called for:", email);
    return { success: true };
  }

  // Resend verification email function - simplified for development
  async function resendVerificationEmail() {
    console.log("Resend verification called");
    return { success: true };
  }

  // Function to navigate to email verification screen
  function verifyEmail() {
    console.log("Verify email called - not redirecting in development mode");
  }

  // Update user profile - simplified for development
  async function updateProfile(data) {
    console.log("Update profile called with data:", data);
    const updatedUser = { ...MOCK_USER, ...data };
    setCurrentUser(updatedUser);
    return updatedUser;
  }

  const value = {
    currentUser,
    login,
    signup,
    logout,
    resetPassword,
    googleSignIn,
    verifyEmail,
    resendVerificationEmail,
    updateProfile,
    loading,
    authError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
