import { Router } from "oak";
import { verifyJwt } from "../middleware/authMiddleware.ts";
import { v4 as uuid } from "uuid";

const router = new Router({ prefix: "/api/vibes" });

// In-memory vibe store (replace with a database in production)
interface Vibe {
  id: string;
  userId: string;
  name: string;
  data: unknown;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

const vibes: Map<string, Vibe> = new Map();

// Get all vibes for a user
router.get("/", verifyJwt, (ctx) => {
  try {
    const userId = ctx.state.user.sub;

    // Filter vibes by user ID
    const userVibes = Array.from(vibes.values()).filter(
      (vibe) => vibe.userId === userId
    );

    ctx.response.status = 200;
    ctx.response.body = { vibes: userVibes };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Create a vibe
router.post("/", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const body = await ctx.request.body({ type: "json" }).value;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body is missing" };
      return;
    }

    if (!body.name || !body.data) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Name and data are required" };
      return;
    }

    // Create vibe
    const id = uuid();
    const now = new Date();

    const vibe: Vibe = {
      id,
      userId,
      name: body.name,
      data: body.data,
      createdAt: now,
      updatedAt: now,
      isPublic: body.isPublic || false,
    };

    vibes.set(id, vibe);

    ctx.response.status = 201;
    ctx.response.body = { vibe };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Get a vibe by ID
router.get("/:id", async (ctx) => {
  try {
    const id = ctx.params.id;

    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "ID is required" };
      return;
    }

    const vibe = vibes.get(id);

    if (!vibe) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Vibe not found" };
      return;
    }

    // Check if vibe is public or user owns it
    const isAuthenticated = ctx.state.user?.sub === vibe.userId;
    if (!vibe.isPublic && !isAuthenticated) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { vibe };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Update a vibe
router.put("/:id", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const id = ctx.params.id;

    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "ID is required" };
      return;
    }

    const vibe = vibes.get(id);

    if (!vibe) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Vibe not found" };
      return;
    }

    // Check if user owns the vibe
    if (vibe.userId !== userId) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    const body = await ctx.request.body({ type: "json" }).value;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body is missing" };
      return;
    }

    // Update vibe
    const updatedVibe: Vibe = {
      ...vibe,
      name: body.name || vibe.name,
      data: body.data || vibe.data,
      isPublic: body.isPublic !== undefined ? body.isPublic : vibe.isPublic,
      updatedAt: new Date(),
    };

    vibes.set(id, updatedVibe);

    ctx.response.status = 200;
    ctx.response.body = { vibe: updatedVibe };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Delete a vibe
router.delete("/:id", verifyJwt, (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const id = ctx.params.id;

    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "ID is required" };
      return;
    }

    const vibe = vibes.get(id);

    if (!vibe) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Vibe not found" };
      return;
    }

    // Check if user owns the vibe
    if (vibe.userId !== userId) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    vibes.delete(id);

    ctx.response.status = 200;
    ctx.response.body = { success: true };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

export default router;
