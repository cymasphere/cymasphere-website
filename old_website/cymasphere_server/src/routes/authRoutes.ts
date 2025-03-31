import { Router } from "oak";
import {
  createUser,
  loginUser,
  googleSignIn,
  sendPasswordResetEmail,
  sendVerificationEmail,
  verifyEmail,
  resetPassword,
} from "../services/authService.ts";

const router = new Router();

// Register route
router.post("/register", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { email, password, name } = body;

    // Validate input
    if (!email || !password || !name) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email, password, and name are required" };
      return;
    }

    // Create user
    const user = await createUser({ email, password, name });

    // Return user without password
    const { password: _, ...userWithoutPassword } = user;

    ctx.response.status = 201;
    ctx.response.body = {
      message:
        "User created successfully. Please check your email to verify your account.",
      user: userWithoutPassword,
    };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Login route
router.post("/login", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email and password are required" };
      return;
    }

    // Login user
    const { user, token } = await loginUser(email, password);

    ctx.response.status = 200;
    ctx.response.body = { user, token };
  } catch (error: any) {
    ctx.response.status = 401;
    ctx.response.body = { error: error.message };
  }
});

// Google sign in route
router.post("/google", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { token } = body;

    // Validate input
    if (!token) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Google token is required" };
      return;
    }

    // Sign in with Google
    const { user, token: authToken } = await googleSignIn(token);

    ctx.response.status = 200;
    ctx.response.body = { user, token: authToken };
  } catch (error: any) {
    ctx.response.status = 401;
    ctx.response.body = { error: error.message };
  }
});

// Forgot password route
router.post("/forgot-password", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { email } = body;

    // Validate input
    if (!email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email is required" };
      return;
    }

    // Send password reset email
    await sendPasswordResetEmail(email);

    ctx.response.status = 200;
    ctx.response.body = {
      message:
        "If an account with that email exists, a password reset link has been sent",
    };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Reset password route
router.post("/reset-password", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { token, password } = body;

    // Validate input
    if (!token || !password) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Token and password are required" };
      return;
    }

    // Reset password
    await resetPassword(token, password);

    ctx.response.status = 200;
    ctx.response.body = { message: "Password reset successfully" };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Verify email route
router.get("/verify-email", async (ctx) => {
  try {
    const token = ctx.request.url.searchParams.get("token");

    // Validate input
    if (!token) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Token is required" };
      return;
    }

    // Verify email
    await verifyEmail(token);

    ctx.response.status = 200;
    ctx.response.body = { message: "Email verified successfully" };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Resend verification email route
router.post("/resend-verification", async (ctx) => {
  try {
    const body = await ctx.request.body().value;
    const { email } = body;

    // Validate input
    if (!email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Email is required" };
      return;
    }

    // Resend verification email
    await sendVerificationEmail(email);

    ctx.response.status = 200;
    ctx.response.body = {
      message:
        "If an account with that email exists, a verification email has been sent",
    };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

export default router;
