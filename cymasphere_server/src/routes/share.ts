import { Router } from "oak";
import { verifyJwt } from "../middleware/authMiddleware.ts";
import { v4 as uuid } from "uuid";

const router = new Router({ prefix: "/api/shared" });

// In-memory share store (replace with a database in production)
interface SharedItem {
  id: string;
  userId: string;
  content: unknown;
  createdAt: Date;
  expiresAt: Date | null;
}

const sharedItems: Map<string, SharedItem> = new Map();

// Share content
router.post("/", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const body = await ctx.request.body({ type: "json" }).value;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body is missing" };
      return;
    }

    if (!body.content) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Content is required" };
      return;
    }

    // Create shared item
    const id = uuid();
    const expiresAt = body.expiresInDays
      ? new Date(Date.now() + body.expiresInDays * 24 * 60 * 60 * 1000)
      : null;

    const sharedItem: SharedItem = {
      id,
      userId,
      content: body.content,
      createdAt: new Date(),
      expiresAt,
    };

    sharedItems.set(id, sharedItem);

    ctx.response.status = 201;
    ctx.response.body = {
      id,
      shareUrl: `${
        Deno.env.get("FRONTEND_URL") || "https://cymasphere.com"
      }/shared/${id}`,
    };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Get shared content
router.get("/:id", async (ctx) => {
  try {
    const id = ctx.params.id;

    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "ID is required" };
      return;
    }

    const sharedItem = sharedItems.get(id);

    if (!sharedItem) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Shared item not found" };
      return;
    }

    // Check if expired
    if (sharedItem.expiresAt && sharedItem.expiresAt < new Date()) {
      sharedItems.delete(id);
      ctx.response.status = 404;
      ctx.response.body = { error: "Shared item has expired" };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = { content: sharedItem.content };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Delete shared content
router.delete("/:id", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const id = ctx.params.id;

    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "ID is required" };
      return;
    }

    const sharedItem = sharedItems.get(id);

    if (!sharedItem) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Shared item not found" };
      return;
    }

    // Check if user owns the shared item
    if (sharedItem.userId !== userId) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Unauthorized" };
      return;
    }

    sharedItems.delete(id);

    ctx.response.status = 200;
    ctx.response.body = { success: true };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

export default router;
