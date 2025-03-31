import { Router } from "oak";
import { getUser, updateUser, deleteUser } from "../services/userService.ts";
import { verifyJwt, adminOnly } from "../middleware/authMiddleware.ts";
import { User } from "../models/user.ts";
import { formatSuccess, formatError } from "../utils/formatters.ts";

const router = new Router({ prefix: "/api/user" });

// Get the current user from the provided token
router.get("/", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const user = await User.findById(userId)
      .select("+username +email +name +description +tutorials")
      .exec();

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = formatError("User not found");
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = formatSuccess(JSON.stringify(user));
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = formatError(error);
  }
});

// Update user
router.put("/", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const body = await ctx.request.body({ type: "json" }).value;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Request body is missing");
      return;
    }

    const updatedUser = await updateUser(userId, body);

    ctx.response.status = 200;
    ctx.response.body = formatSuccess(JSON.stringify(updatedUser));
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = formatError(error);
  }
});

// Delete user
router.delete("/", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.userId;
    await deleteUser(userId);

    ctx.response.status = 200;
    ctx.response.body = formatSuccess();
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = formatError(error);
  }
});

// Get user by ID (admin only)
router.get("/:id", adminOnly, async (ctx) => {
  try {
    const userId = ctx.params.id;
    if (!userId) {
      ctx.response.status = 400;
      ctx.response.body = formatError("User ID is required");
      return;
    }

    const user = await getUser(userId);

    ctx.response.status = 200;
    ctx.response.body = formatSuccess(JSON.stringify(user));
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = formatError(error);
  }
});

export default router;
