import { Router } from "oak";
import { verifyJwt } from "../middleware/authMiddleware.ts";
import { sendEmail } from "../services/emailService.ts";

const router = new Router({ prefix: "/api/email" });

// Send email
router.post("/send", verifyJwt, async (ctx) => {
  try {
    const userId = ctx.state.user.sub;
    const body = await ctx.request.body({ type: "json" }).value;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body is missing" };
      return;
    }

    if (!body.to || !body.subject || !body.text) {
      ctx.response.status = 400;
      ctx.response.body = { error: "To, subject, and text are required" };
      return;
    }

    // Send email
    await sendEmail({
      to: body.to,
      subject: body.subject,
      text: body.text,
      html: body.html,
    });

    ctx.response.status = 200;
    ctx.response.body = { success: true };
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = { error: error.message };
  }
});

export default router;
