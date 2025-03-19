import { Router } from "oak";
import { verifyJwt } from "../middleware/authMiddleware.ts";

const router = new Router({ prefix: "/api/logs" });

// Log message
router.post("/", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const body = await ctx.request.body({ type: "json" }).value;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body is missing" };
      return;
    }

    if (!body.message) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Message is required" };
      return;
    }

    // Log message to console (in a real implementation, you would store this in a database)
    console.log(`[LOG] User ${userId}: ${body.message}`);

    ctx.response.status = 200;
    ctx.response.body = { success: true };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

export default router;
