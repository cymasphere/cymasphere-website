import { verify, create } from "djwt";
import { Context, Next } from "oak";
import { User } from "../models/user.ts";

// Get JWT secret from environment
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "your-secret-key";

// Create JWT key
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(JWT_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"]
);

// Create a token
export async function createToken(
  userId: string,
  custId: string,
  deviceId: string,
  expires = 86400
): Promise<string> {
  const expirationDate = new Date();
  expirationDate.setSeconds(expirationDate.getSeconds() + expires);

  const payload = {
    userId,
    custId,
    deviceId,
    exp: Math.floor(expirationDate.getTime() / 1000),
  };

  return await create({ alg: "HS256", typ: "JWT" }, payload, key);
}

// Verify JWT middleware
export async function verifyJwt(ctx: Context, next: Next) {
  try {
    // Get token from Authorization header or x-access-token header
    const token =
      ctx.request.headers.get("x-access-token") ||
      (ctx.request.headers.get("Authorization")?.startsWith("Bearer ")
        ? ctx.request.headers.get("Authorization")?.substring(7)
        : null);

    if (!token) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized - No token provided" };
      return;
    }

    try {
      // Verify token
      const payload = await verify(token, key);

      if (!payload.userId) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Unauthorized - Missing user ID" };
        return;
      }

      if (!payload.custId) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Unauthorized - Missing customer ID" };
        return;
      }

      if (!payload.deviceId) {
        ctx.response.status = 401;
        ctx.response.body = { error: "Unauthorized - Missing device ID" };
        return;
      }

      // Set user in context state
      ctx.state.userId = payload.userId;
      ctx.state.custId = payload.custId;
      ctx.state.deviceId = payload.deviceId;
      ctx.state.user = payload;

      await next();
    } catch (error: any) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Unauthorized - Invalid token" };
    }
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
}

// Admin only middleware
export async function adminOnly(ctx: Context, next: Next) {
  try {
    // First verify JWT
    await verifyJwt(ctx, async () => {
      // Get user from database
      const user = await User.findById(ctx.state.userId).exec();

      // Check if user exists and is admin
      if (!user || !user.proML) {
        ctx.response.status = 403;
        ctx.response.body = { error: "Forbidden - Admin access required" };
        return;
      }

      await next();
    });
  } catch (error: any) {
    // Error already handled by verifyJwt
  }
}
