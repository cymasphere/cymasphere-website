import { Router } from "oak";
import { verifyJwt } from "../middleware/authMiddleware.ts";

const router = new Router({ prefix: "/api/tags" });

// In-memory tag store (replace with a database in production)
const userTags: Map<string, string[]> = new Map();

// Get all tags for a user
router.get("/", verifyJwt, (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const tags = userTags.get(userId) || [];

    ctx.response.status = 200;
    ctx.response.body = { tags };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Add a tag
router.post("/", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const body = await ctx.request.body({ type: "json" }).value;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body is missing" };
      return;
    }

    if (!body.tag) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Tag is required" };
      return;
    }

    // Get existing tags or create new array
    const tags = userTags.get(userId) || [];

    // Add tag if it doesn't exist
    if (!tags.includes(body.tag)) {
      tags.push(body.tag);
      userTags.set(userId, tags);
    }

    ctx.response.status = 200;
    ctx.response.body = { tags };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

// Delete a tag
router.delete("/:tag", verifyJwt, (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const tag = ctx.params.tag;

    if (!tag) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Tag is required" };
      return;
    }

    // Get existing tags
    const tags = userTags.get(userId) || [];

    // Remove tag
    const updatedTags = tags.filter((t) => t !== tag);
    userTags.set(userId, updatedTags);

    ctx.response.status = 200;
    ctx.response.body = { tags: updatedTags };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

export default router;
