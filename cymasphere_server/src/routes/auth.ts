import { Router } from "oak";
import { compare, hash } from "bcrypt";
import { createToken } from "../middleware/authMiddleware.ts";
import { User } from "../models/user.ts";
import {
  sendVerificationEmail,
  sendPasswordResetEmail,
} from "../services/emailService.ts";
import { v4 as uuid } from "uuid";
import {
  formatSuccess,
  formatError,
  simplifySlug,
} from "../utils/formatters.ts";

const router = new Router({ prefix: "/api/auth" });

// Check if auth is available
router.get("/available", (ctx) => {
  ctx.response.status = 200;
  ctx.response.body = formatSuccess();
});

// Login
router.post("/login", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;

    // Check if request has a body
    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Request body is missing");
      return;
    }

    // Validate request body
    const { emailOrUsername, password, deviceId } = body;

    if (!emailOrUsername || !password) {
      ctx.response.status = 400;
      ctx.response.body = formatError(
        "Email/username and password are required"
      );
      return;
    }

    if (!deviceId) {
      ctx.response.status = 400;
      ctx.response.body = formatError("deviceId required");
      return;
    }

    // Find user by email or username
    const lowercaseEmailOrUsername = emailOrUsername.toLowerCase();
    const simplifiedEmailOrUsername = simplifySlug(emailOrUsername);

    const user = await User.findOne({
      $or: [
        { username: simplifiedEmailOrUsername },
        { username: lowercaseEmailOrUsername },
        { email: lowercaseEmailOrUsername },
      ],
    })
      .select(
        "+password +passwordReset +custId +emailVerified +loggedInDevices"
      )
      .exec();

    // Check if user exists
    if (!user) {
      ctx.response.status = 401;
      ctx.response.body = formatError("Incorrect username or password");
      return;
    }

    // Check if email is verified
    if (!user.emailVerified) {
      ctx.response.status = 401;
      ctx.response.body = formatError("Email not verified");
      return;
    }

    // Check if password reset is requested
    if (user.passwordReset === true) {
      ctx.response.status = 401;
      ctx.response.body = formatError("Password reset requested");
      return;
    }

    // Validate password
    const passwordIsValid = await compare(password, user.password);
    if (!passwordIsValid) {
      ctx.response.status = 401;
      ctx.response.body = formatError("Incorrect username or password");
      return;
    }

    // Check device limits (except for specific users)
    if (
      deviceId !== "web" &&
      lowercaseEmailOrUsername !== "cymasphere@gmail.com" &&
      lowercaseEmailOrUsername !== "ryaneskiljohnson@gmail.com" &&
      lowercaseEmailOrUsername !== "cymasphere2@gmail.com"
    ) {
      const devices = user.loggedInDevices || [];
      const loggedInAlready = devices.includes(deviceId);

      if (devices.length >= 6 && !loggedInAlready) {
        ctx.response.status = 401;
        ctx.response.body = formatError(
          "Maximum devices logged in. Please logout on another device then try again."
        );
        return;
      }

      if (!loggedInAlready) {
        devices.push(deviceId);
        const result = await User.updateOne(
          { _id: user._id },
          { loggedInDevices: devices },
          { upsert: true }
        ).exec();

        if (!result.modifiedCount || result.modifiedCount !== 1) {
          ctx.response.status = 500;
          ctx.response.body = formatError(
            "Unable to update the logged in devices"
          );
          return;
        }
      }
    }

    // Create token
    const token = await createToken(
      user._id.toString(),
      user.custId || "",
      deviceId
    );

    ctx.response.status = 200;
    ctx.response.body = formatSuccess(token);
  } catch (error: any) {
    ctx.response.status = 500;
    ctx.response.body = formatError(error);
  }
});

// Register a new user
router.post("/signup", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;

    // Check if request has a body
    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Request body is missing");
      return;
    }

    // Validate request body
    const { email, username, password, name, deviceId, newsletter } = body;

    if (!email || !username || !password || !name || !deviceId) {
      ctx.response.status = 400;
      ctx.response.body = formatError(
        "Email, username, password, name, and deviceId are required"
      );
      return;
    }

    // Check if email already exists
    const existingEmail = await User.findOne({
      email: email.toLowerCase(),
    }).exec();
    if (existingEmail) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Email already in use");
      return;
    }

    // Check if username already exists
    const simplifiedUsername = simplifySlug(username);
    const existingUsername = await User.findOne({
      $or: [
        { username: simplifiedUsername },
        { username: username.toLowerCase() },
      ],
    }).exec();

    if (existingUsername) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Username already in use");
      return;
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = new User({
      dateCreated: new Date(),
      username: username.toLowerCase(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      emailVerified: false,
      passwordReset: false,
      loggedInDevices: [deviceId],
      newsletter: newsletter || false,
      tutorials: [],
    });

    await user.save();

    // Generate verification token
    const verificationToken = uuid();

    // Send verification email
    await sendVerificationEmail(email, verificationToken);

    ctx.response.status = 201;
    ctx.response.body = formatSuccess(
      "User created successfully. Please check your email to verify your account."
    );
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = formatError(error);
  }
});

// Forgot password
router.post("/forgot-password", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;

    // Check if request has a body
    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Request body is missing");
      return;
    }

    // Validate request body
    if (!body.email) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Email is required");
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: body.email.toLowerCase() }).exec();

    // Don't reveal if user exists or not
    if (!user) {
      ctx.response.status = 200;
      ctx.response.body = formatSuccess(
        "If an account with that email exists, a password reset link has been sent."
      );
      return;
    }

    // Set password reset flag
    await User.updateOne({ _id: user._id }, { passwordReset: true }).exec();

    // Generate reset token
    const resetToken = uuid();

    // Send password reset email
    await sendPasswordResetEmail(body.email, resetToken);

    ctx.response.status = 200;
    ctx.response.body = formatSuccess(
      "If an account with that email exists, a password reset link has been sent."
    );
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = formatError(error);
  }
});

// Resend verification email
router.post("/resend-verification", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;

    // Check if request has a body
    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Request body is missing");
      return;
    }

    // Validate request body
    if (!body.email) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Email is required");
      return;
    }

    // Find user by email
    const user = await User.findOne({ email: body.email.toLowerCase() }).exec();

    // Don't reveal if user exists or not
    if (!user) {
      ctx.response.status = 200;
      ctx.response.body = formatSuccess(
        "If an account with that email exists, a verification email has been sent."
      );
      return;
    }

    // Generate verification token
    const verificationToken = uuid();

    // Send verification email
    await sendVerificationEmail(body.email, verificationToken);

    ctx.response.status = 200;
    ctx.response.body = formatSuccess(
      "If an account with that email exists, a verification email has been sent."
    );
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = formatError(error);
  }
});

// Logout
router.post("/logout", async (ctx) => {
  try {
    const body = await ctx.request.body({ type: "json" }).value;

    // Check if request has a body
    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = formatError("Request body is missing");
      return;
    }

    // Validate request body
    const { userId, deviceId } = body;

    if (!userId || !deviceId) {
      ctx.response.status = 400;
      ctx.response.body = formatError("userId and deviceId are required");
      return;
    }

    // Find user
    const user = await User.findById(userId).select("+loggedInDevices").exec();

    if (!user) {
      ctx.response.status = 404;
      ctx.response.body = formatError("User not found");
      return;
    }

    // Remove device from logged in devices
    const devices = user.loggedInDevices || [];
    const updatedDevices = devices.filter((d) => d !== deviceId);

    await User.updateOne(
      { _id: user._id },
      { loggedInDevices: updatedDevices }
    ).exec();

    ctx.response.status = 200;
    ctx.response.body = formatSuccess();
  } catch (error: any) {
    ctx.response.status = 400;
    ctx.response.body = formatError(error);
  }
});

export default router;
