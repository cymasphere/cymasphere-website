/**
 * Mock Authentication API
 * This file simulates authentication API calls for development purposes
 */

// Simulated delay to mimic network requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Simulates a signup API call
 */
export async function signup(email, password, displayName) {
  // Simulate network delay
  await delay(800);
  
  // Validate inputs (simple validation for demo)
  if (!email || !password || !displayName) {
    throw new Error("All fields are required");
  }
  
  if (password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }
  
  // In a real API, this would create a user account
  // For demo, we'll return a simulated successful response
  return {
    user: {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      email,
      displayName,
      emailVerified: false,
      createdAt: new Date().toISOString()
    },
    token: "mock_token_" + Math.random().toString(36).substring(2, 15)
  };
}

/**
 * Simulates a login API call
 */
export async function login(email, password) {
  // Simulate network delay
  await delay(600);
  
  // Validate inputs
  if (!email || !password) {
    throw new Error("Email and password are required");
  }
  
  // Simulate authentication logic
  // In a real app, this would verify credentials against a database
  if (email === "error@test.com") {
    throw new Error("Invalid email or password");
  }
  
  // Return simulated successful response
  return {
    user: {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      email,
      displayName: email.split('@')[0],
      emailVerified: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days ago
    },
    token: "mock_token_" + Math.random().toString(36).substring(2, 15)
  };
}

/**
 * Simulates a Google sign in API call
 */
export async function googleSignIn() {
  // Simulate network delay
  await delay(700);
  
  // Return simulated successful response
  return {
    user: {
      id: "user_" + Math.random().toString(36).substring(2, 9),
      email: "user@gmail.com",
      displayName: "Google User",
      emailVerified: true,
      createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString() // 60 days ago
    },
    token: "mock_token_" + Math.random().toString(36).substring(2, 15)
  };
}

/**
 * Simulates a logout API call
 */
export async function logout() {
  // Simulate network delay
  await delay(300);
  
  // In a real app, this would invalidate the token on the server
  return { success: true };
}

/**
 * Simulates a password reset API call
 */
export async function resetPassword(email) {
  // Simulate network delay
  await delay(500);
  
  // Validate input
  if (!email) {
    throw new Error("Email is required");
  }
  
  // In a real app, this would send a password reset email
  return { success: true };
}

/**
 * Simulates resending a verification email
 */
export async function resendVerificationEmail(email) {
  // Simulate network delay
  await delay(500);
  
  // Validate input
  if (!email) {
    throw new Error("Email is required");
  }
  
  // In a real app, this would send a verification email
  return { success: true };
}

/**
 * Simulates updating user profile
 */
export async function updateProfile(data) {
  // Simulate network delay
  await delay(600);
  
  // Validate input
  if (!data) {
    throw new Error("Profile data is required");
  }
  
  // In a real app, this would update the user profile in the database
  return {
    ...data,
    updatedAt: new Date().toISOString()
  };
}
