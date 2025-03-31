import { Application, Router } from "oak";
import { oakCors } from "cors";
import {
  initializeEmailService,
  closeEmailService,
} from "./services/emailService.ts";
import { connectToDatabase, closeDatabaseConnection } from "./utils/db.ts";

// Import routes
import authRouter from "./routes/auth.ts";
import userRouter from "./routes/user.ts";
import logRouter from "./routes/log.ts";
import tagRouter from "./routes/tag.ts";
import shareRouter from "./routes/share.ts";
import vibeRouter from "./routes/vibe.ts";
import emailRouter from "./routes/email.ts";
import receiptRouter from "./routes/receipt.ts";
import stripeRouter from "./routes/stripe.ts";

const PORT = parseInt(Deno.env.get("PORT") || "8000");
const JWT_SECRET = Deno.env.get("JWT_SECRET") || "your-jwt-secret";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "http://localhost:3000";

console.log(`Starting Cymasphere server on port ${PORT}...`);
console.log(`Frontend URL: ${FRONTEND_URL}`);

// Connect to database
console.log("Connecting to database...");
try {
  await connectToDatabase();
} catch (error: any) {
  console.error("Failed to connect to database:", error);
  Deno.exit(1);
}

// Create Oak application
const app = new Application();
const router = new Router();

// Initialize email service
console.log("Initializing email service...");
try {
  await initializeEmailService();
} catch (error: any) {
  console.error("Failed to initialize email service:", error);
  // Continue anyway, email service is not critical
}

// Middleware
app.use(
  oakCors({
    origin: [
      "http://localhost:3000",
      "https://cymasphere.com",
      "https://www.cymasphere.com",
    ],
    credentials: true,
  })
);

// Logger middleware
app.use(async (ctx, next) => {
  try {
    await next();
    const rt = ctx.response.headers.get("X-Response-Time");
    console.log(`${ctx.request.method} ${ctx.request.url} - ${rt}`);
  } catch (error: any) {
    console.error("Error in logger middleware:", error);
    throw error;
  }
});

// Timing middleware
app.use(async (ctx, next) => {
  try {
    const start = Date.now();
    await next();
    const ms = Date.now() - start;
    ctx.response.headers.set("X-Response-Time", `${ms}ms`);
  } catch (error: any) {
    console.error("Error in timing middleware:", error);
    throw error;
  }
});

// Routes
router.get("/", (ctx) => {
  ctx.response.body = { message: "Welcome to Cymasphere API" };
});

// Use routers
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());

app.use(userRouter.routes());
app.use(userRouter.allowedMethods());

app.use(logRouter.routes());
app.use(logRouter.allowedMethods());

app.use(tagRouter.routes());
app.use(tagRouter.allowedMethods());

app.use(shareRouter.routes());
app.use(shareRouter.allowedMethods());

app.use(vibeRouter.routes());
app.use(vibeRouter.allowedMethods());

app.use(emailRouter.routes());
app.use(emailRouter.allowedMethods());

app.use(receiptRouter.routes());
app.use(receiptRouter.allowedMethods());

app.use(stripeRouter.routes());
app.use(stripeRouter.allowedMethods());

// Use main router
app.use(router.routes());
app.use(router.allowedMethods());

// Handle graceful shutdown
Deno.addSignalListener("SIGINT", async () => {
  console.log("Shutting down server...");
  try {
    await closeEmailService();
  } catch (error: any) {
    console.error("Error closing email service:", error);
  }

  try {
    await closeDatabaseConnection();
  } catch (error: any) {
    console.error("Error closing database connection:", error);
  }

  Deno.exit(0);
});

// Start server
console.log(`Server running on http://localhost:${PORT}`);
try {
  await app.listen({ port: PORT });
} catch (error: any) {
  console.error("Error starting server:", error);
  Deno.exit(1);
}
