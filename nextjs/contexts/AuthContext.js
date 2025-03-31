import React, { useContext, useState, useEffect, createContext } from "react";
import * as authApi from "../../old_website/src/api/authApi";
import { AUTH_TOKEN_NAME, USER_DATA_NAME } from "../../old_website/src/config";

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component that wraps your app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  // Check if user is logged in on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // Check if token exists in localStorage
        const token = localStorage.getItem(AUTH_TOKEN_NAME);

        if (token) {
          // Validate token with server (this would be a new endpoint)
          // For now, we'll just set the user from localStorage
          const userData = JSON.parse(
            localStorage.getItem(USER_DATA_NAME) || "{}"
          );

          if (userData && userData.id) {
            setCurrentUser(userData);
            setUserDetails(userData);
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
        // Clear any invalid data
        localStorage.removeItem(AUTH_TOKEN_NAME);
        localStorage.removeItem(USER_DATA_NAME);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  // Signup function
  async function signup(email, password, displayName) {
    try {
      setAuthError("");
      console.log("Creating user account with email:", email);

      // Call signup API
      const response = await authApi.signup(email, password, displayName);

      console.log("User created successfully:", response);

      // Don't set current user yet - they need to verify email

      return response;
    } catch (error) {
      console.error("Signup error:", error);
      setAuthError(error.message);
      throw error;
    }
  }

  // Login function
  async function login(email, password) {
    try {
      setAuthError("");

      // Call login API
      const response = await authApi.login(email, password);

      // Save token and user data
      localStorage.setItem(AUTH_TOKEN_NAME, response.token);
      localStorage.setItem(USER_DATA_NAME, JSON.stringify(response.user));

      // Set current user
      setCurrentUser(response.user);
      setUserDetails(response.user);

      return response;
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error.message);
      throw error;
    }
  }

  // Google sign in function
  async function googleSignIn() {
    try {
      setAuthError("");

      // In a real implementation, you would use a Google OAuth library
      // to get the Google token, then send it to the server

      // For now, we'll just mock this
      const mockGoogleToken = "mock-google-token";

      // Call Google sign in API
      const response = await authApi.googleSignIn(mockGoogleToken);

      // Save token and user data
      localStorage.setItem(AUTH_TOKEN_NAME, response.token);
      localStorage.setItem(USER_DATA_NAME, JSON.stringify(response.user));

      // Set current user
      setCurrentUser(response.user);
      setUserDetails(response.user);

      return response;
    } catch (error) {
      console.error("Google sign in error:", error);
      setAuthError(error.message);
      throw error;
    }
  }

  // Logout function
  async function logout() {
    try {
      // Call logout API
      await authApi.logout();

      // Clear local storage
      localStorage.removeItem(AUTH_TOKEN_NAME);
      localStorage.removeItem(USER_DATA_NAME);

      // Clear current user
      setCurrentUser(null);
      setUserDetails(null);
    } catch (error) {
      console.error("Logout error:", error);

      // Even if the API call fails, clear local data
      localStorage.removeItem(AUTH_TOKEN_NAME);
      localStorage.removeItem(USER_DATA_NAME);
      setCurrentUser(null);
      setUserDetails(null);

      throw error;
    }
  }

  // Reset password function
  async function resetPassword(email) {
    try {
      setAuthError("");

      // Call forgot password API
      await authApi.forgotPassword(email);
    } catch (error) {
      console.error("Reset password error:", error);
      setAuthError(error.message);
      throw error;
    }
  }

  // Resend verification email function
  async function resendVerificationEmail() {
    if (!currentUser) {
      throw new Error("No user is currently signed in");
    }

    try {
      setAuthError("");

      // Call resend verification email API
      await authApi.resendVerificationEmail(currentUser.email);

      return true;
    } catch (error) {
      console.error("Error sending verification email:", error);
      setAuthError(error.message);
      throw error;
    }
  }

  // Update user profile function
  async function updateProfile(data) {
    // This would be implemented with a new API endpoint
    throw new Error("Not implemented");
  }

  // Update user email function
  async function updateUserEmail(newEmail) {
    // This would be implemented with a new API endpoint
    throw new Error("Not implemented");
  }

  // Update user password function
  function updateUserPassword(newPassword) {
    // This would be implemented with a new API endpoint
    throw new Error("Not implemented");
  }

  // The value prop provides the values and functions that will be available to any component that consumes this context
  const value = {
    currentUser,
    userDetails,
    authError,
    signup,
    login,
    logout,
    resetPassword,
    updateUserEmail,
    updateUserPassword,
    googleSignIn,
    resendVerificationEmail,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
