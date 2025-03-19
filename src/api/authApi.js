// Authentication API client
import { API_BASE_URL } from "../config";

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    const error = data.error || response.statusText;
    throw new Error(error);
  }

  return data;
};

// Register a new user
export const signup = async (email, password, name) => {
  const response = await fetch(`${API_BASE_URL}/auth/signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
      name,
    }),
    credentials: "include",
  });

  return handleResponse(response);
};

// Login
export const login = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
    credentials: "include",
  });

  return handleResponse(response);
};

// Google sign in
export const googleSignIn = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/google`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      token,
    }),
    credentials: "include",
  });

  return handleResponse(response);
};

// Forgot password
export const forgotPassword = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
    }),
    credentials: "include",
  });

  return handleResponse(response);
};

// Resend verification email
export const resendVerificationEmail = async (email) => {
  const response = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
    }),
    credentials: "include",
  });

  return handleResponse(response);
};

// Logout
export const logout = async () => {
  const response = await fetch(`${API_BASE_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  });

  return handleResponse(response);
};
