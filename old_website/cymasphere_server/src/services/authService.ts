import { create, Payload, verify } from "djwt";
import { hash, compare } from "bcrypt";
import {
  sendVerificationEmail as sendVerificationEmailService,
  sendPasswordResetEmail as sendPasswordResetEmailService,
} from "./emailService.ts";

// In-memory user store (replace with a database in production)
const users: Map<string, User> = new Map();

// Token store for verification and password reset
const verificationTokens: Map<string, string> = new Map(); // token -> userId
const passwordResetTokens: Map<string, string> = new Map(); // token -> userId

// User interface
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  emailVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
}

// User creation interface
export interface CreateUserInput {
  email: string;
  password: string;
  name: string;
}

// JWT payload interface
interface JwtPayload {
  email: string;
  name: string;
  sub: string;
  exp: number;
}

// Get JWT secret from environment
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "your-secret-key";
const JWT_EXPIRATION = parseInt(Deno.env.get("JWT_EXPIRATION") || "86400");

// Create JWT key
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(JWT_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
);

// Create a new user
export async function createUser(input: CreateUserInput): Promise<User> {
  // Check if user already exists
  const existingUser = Array.from(users.values()).find(
    (user) => user.email === input.email
  );

  if (existingUser) {
    throw new Error("Email already in use");
  }

  // Hash password
  const hashedPassword = await hash(input.password);

  // Create user
  const user: User = {
    id: crypto.randomUUID(),
    email: input.email,
    password: hashedPassword,
    name: input.name,
    emailVerified: false,
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  // Save user
  users.set(user.id, user);

  // Generate verification token
  const verificationToken = crypto.randomUUID();
  verificationTokens.set(verificationToken, user.id);

  // Send verification email
  await sendVerificationEmail(user.email, verificationToken);

  return user;
}

// Login user
export async function loginUser(
  email: string,
  password: string
): Promise<{ user: Omit<User, "password">; token: string }> {
  // Find user
  const user = Array.from(users.values()).find((user) => user.email === email);

  if (!user) {
    throw new Error("Invalid email or password");
  }

  // Verify password
  const isValid = await compare(password, user.password);

  if (!isValid) {
    throw new Error("Invalid email or password");
  }

  // Check if email is verified
  if (!user.emailVerified) {
    throw new Error("Please verify your email before logging in");
  }

  // Update last login
  user.lastLoginAt = new Date();
  users.set(user.id, user);

  // Generate JWT
  const token = await generateToken(user);

  // Return user without password
  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token,
  };
}

// Send password reset email
export async function sendPasswordResetEmail(email: string): Promise<void> {
  // Find user
  const user = Array.from(users.values()).find((user) => user.email === email);

  if (!user) {
    // Don't reveal that the user doesn't exist
    return;
  }

  // Generate password reset token
  const resetToken = crypto.randomUUID();
  passwordResetTokens.set(resetToken, user.id);

  // Set token expiration (1 hour)
  setTimeout(() => {
    passwordResetTokens.delete(resetToken);
  }, 60 * 60 * 1000);

  // Send password reset email
  await sendPasswordResetEmailService(email, resetToken);
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  token?: string
): Promise<void> {
  // Find user
  const user = Array.from(users.values()).find((user) => user.email === email);

  if (!user) {
    // Don't reveal that the user doesn't exist
    return;
  }

  // If token is not provided, generate a new one
  let verificationToken = token;
  if (!verificationToken) {
    verificationToken = crypto.randomUUID();
    verificationTokens.set(verificationToken, user.id);
  }

  // Set token expiration (24 hours)
  setTimeout(() => {
    verificationTokens.delete(verificationToken!);
  }, 24 * 60 * 60 * 1000);

  // Send verification email
  await sendVerificationEmailService(email, verificationToken);
}

// Verify email
export async function verifyEmail(token: string): Promise<boolean> {
  // Find user ID by token
  const userId = verificationTokens.get(token);

  if (!userId) {
    throw new Error("Invalid or expired verification token");
  }

  // Find user
  const user = users.get(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Update user
  user.emailVerified = true;
  users.set(userId, user);

  // Delete token
  verificationTokens.delete(token);

  return true;
}

// Reset password
export async function resetPassword(
  token: string,
  newPassword: string
): Promise<boolean> {
  // Find user ID by token
  const userId = passwordResetTokens.get(token);

  if (!userId) {
    throw new Error("Invalid or expired password reset token");
  }

  // Find user
  const user = users.get(userId);

  if (!user) {
    throw new Error("User not found");
  }

  // Hash new password
  const hashedPassword = await hash(newPassword);

  // Update user
  user.password = hashedPassword;
  users.set(userId, user);

  // Delete token
  passwordResetTokens.delete(token);

  return true;
}

// Generate JWT token
async function generateToken(user: User): Promise<string> {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    exp: Math.floor(Date.now() / 1000) + JWT_EXPIRATION,
  };

  return await create(
    { alg: "HS256", typ: "JWT" },
    payload as unknown as Payload,
    key
  );
}

// Verify JWT token
export async function verifyToken(token: string): Promise<JwtPayload> {
  try {
    const payload = await verify(token, key);
    return payload as unknown as JwtPayload;
  } catch (error) {
    throw new Error("Invalid token");
  }
}
