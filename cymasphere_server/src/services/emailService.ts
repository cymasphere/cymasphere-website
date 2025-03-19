import { SmtpClient } from "smtp";

// Email configuration
const SMTP_HOST = Deno.env.get("SMTP_HOST") || "localhost";
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "1025");
const SMTP_USERNAME = Deno.env.get("SMTP_USERNAME") || "";
const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD") || "";
const SMTP_FROM = Deno.env.get("SMTP_FROM") || "noreply@localhost";
const FRONTEND_URL = Deno.env.get("FRONTEND_URL") || "http://localhost:3000";

// SMTP client
let smtpClient: SmtpClient | null = null;

// Initialize email service
export async function initializeEmailService(): Promise<void> {
  try {
    console.log(
      `Initializing email service with SMTP server at ${SMTP_HOST}:${SMTP_PORT}...`
    );
    smtpClient = new SmtpClient();

    const config: any = {
      hostname: SMTP_HOST,
      port: SMTP_PORT,
    };

    // Only add username and password if they are not empty
    if (SMTP_USERNAME && SMTP_PASSWORD) {
      config.username = SMTP_USERNAME;
      config.password = SMTP_PASSWORD;
    }

    await smtpClient.connectTLS(config);

    console.log("Email service initialized successfully");
  } catch (error: any) {
    console.error("Error initializing email service:", error);
    // Don't throw the error - we'll try to reconnect when sending emails
  }
}

// Close email service
export async function closeEmailService(): Promise<void> {
  try {
    if (smtpClient) {
      await smtpClient.close();
      smtpClient = null;
      console.log("Email service closed");
    }
  } catch (error: any) {
    console.error("Error closing email service:", error);
  }
}

// Email options interface
export interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

// Send email
export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    if (!smtpClient) {
      // Try to reconnect
      await initializeEmailService();

      if (!smtpClient) {
        throw new Error("Email service not initialized");
      }
    }

    console.log(
      `Sending email to ${options.to} with subject "${options.subject}"...`
    );

    await smtpClient.send({
      from: SMTP_FROM,
      to: options.to,
      subject: options.subject,
      content: options.html || options.text,
      html: !!options.html,
    });

    console.log(`Email sent to ${options.to} successfully`);
  } catch (error: any) {
    console.error("Error sending email:", error);
    throw error;
  }
}

// Send verification email
export async function sendVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verificationUrl = `${FRONTEND_URL}/verify-email?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Verify your Cymasphere account",
    text: `Please verify your email address by clicking the following link: ${verificationUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6c63ff;">Verify your Cymasphere account</h1>
        <p>Thank you for signing up! Please verify your email address by clicking on the button below:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #6c63ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
        </div>
        <p>If the button doesn't work, you can also click on this link:</p>
        <p><a href="${verificationUrl}">${verificationUrl}</a></p>
        <p>This link will expire in 24 hours.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #666; font-size: 12px;">If you didn't sign up for Cymasphere, you can safely ignore this email.</p>
      </div>
    `,
  });
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;

  await sendEmail({
    to: email,
    subject: "Reset your Cymasphere password",
    text: `Please reset your password by clicking the following link: ${resetUrl}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #6c63ff;">Reset your Cymasphere password</h1>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #6c63ff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
        </div>
        <p>If the button doesn't work, you can also click on this link:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>This link will expire in 1 hour.</p>
        <hr style="border: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #666; font-size: 12px;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `,
  });
}
