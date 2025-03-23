import React, { useContext, useState, useEffect, createContext } from "react";
import * as authApi from "../api/authApi";
import { AUTH_TOKEN_NAME, USER_DATA_NAME } from "../config";
import { useRouter } from 'next/router';

// Create the authentication context
const AuthContext = createContext();

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

// Provider component that wraps your app and makes auth object available to any child component that calls useAuth()
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");
  const router = useRouter();

  // Check if user is logged in on page load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        // In a real app, this would validate the token with your API
        const token = localStorage.getItem(AUTH_TOKEN_NAME);
        if (token) {
          // Get user data from localStorage
          const userData = JSON.parse(localStorage.getItem(USER_DATA_NAME) || '{}');
          
          if (userData && Object.keys(userData).length > 0) {
            setCurrentUser(userData);
          }
        }
      } catch (error) {
        console.error("Error checking auth status:", error);
      } finally {
        setLoading(false);
      }
    };

    // Only run in the browser
    if (typeof window !== "undefined") {
      checkAuthStatus();
    } else {
      setLoading(false);
    }
  }, []);

  // Sign up function
  async function signup(email, password, displayName) {
    setLoading(true);
    setAuthError("");
    
    try {
      const response = await authApi.signup(email, password, displayName);
      
      // Store token and user data
      localStorage.setItem(AUTH_TOKEN_NAME, response.token);
      localStorage.setItem(USER_DATA_NAME, JSON.stringify(response.user));
      
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      setAuthError(error.message || "Failed to create an account");
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Log in function
  async function login(email, password) {
    setLoading(true);
    setAuthError("");
    
    try {
      const response = await authApi.login(email, password);
      
      // Store token and user data
      localStorage.setItem(AUTH_TOKEN_NAME, response.token);
      localStorage.setItem(USER_DATA_NAME, JSON.stringify(response.user));
      
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      setAuthError(error.message || "Failed to log in");
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Google sign-in function
  async function googleSignIn() {
    setLoading(true);
    setAuthError("");
    
    try {
      const response = await authApi.googleSignIn();
      
      // Store token and user data
      localStorage.setItem(AUTH_TOKEN_NAME, response.token);
      localStorage.setItem(USER_DATA_NAME, JSON.stringify(response.user));
      
      setCurrentUser(response.user);
      return response;
    } catch (error) {
      setAuthError(error.message || "Failed to sign in with Google");
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Log out function
  async function logout() {
    setAuthError("");
    
    try {
      await authApi.logout();
      
      // Clear stored data
      localStorage.removeItem(AUTH_TOKEN_NAME);
      localStorage.removeItem(USER_DATA_NAME);
      
      setCurrentUser(null);
    } catch (error) {
      setAuthError(error.message || "Failed to log out");
      throw error;
    }
  }

  // Reset password function
  async function resetPassword(email) {
    setLoading(true);
    setAuthError("");
    
    try {
      await authApi.resetPassword(email);
    } catch (error) {
      setAuthError(error.message || "Failed to reset password");
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Resend verification email function
  async function resendVerificationEmail() {
    setLoading(true);
    setAuthError("");
    
    try {
      if (!currentUser) throw new Error("No user is signed in");
      await authApi.resendVerificationEmail(currentUser.email);
    } catch (error) {
      setAuthError(error.message || "Failed to send verification email");
      throw error;
    } finally {
      setLoading(false);
    }
  }

  // Function to navigate to email verification screen
  function verifyEmail() {
    router.push("/verify-email");
  }

  // Update user profile
  async function updateProfile(data) {
    setLoading(true);
    setAuthError("");
    
    try {
      const updatedUser = await authApi.updateProfile(data);
      
      // Update stored user data
      localStorage.setItem(USER_DATA_NAME, JSON.stringify(updatedUser));
      
      setCurrentUser(updatedUser);
      return updatedUser;
    } catch (error) {
      setAuthError(error.message || "Failed to update profile");
      throw error;
    } finally {
      setLoading(false);
    }
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
    authError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export default AuthProvider;