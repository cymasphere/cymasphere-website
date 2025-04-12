import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/email";

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { name, email, subject, message, userId = null } = body;

    // Validate required fields
    if (!email || !subject || !message) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Create email content
    const emailSubject = `[Cymasphere Contact] ${subject}`;
    
    // Plain text email
    const textContent = `
Name: ${name || "Not provided"}
Email: ${email}
${userId ? `User ID: ${userId}` : ""}

Message:
${message}
    `;

    // HTML email
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #6c63ff; color: white; padding: 10px 20px; border-radius: 5px 5px 0 0; }
    .content { padding: 20px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 5px 5px; }
    .field { margin-bottom: 15px; }
    .label { font-weight: bold; }
    .message { margin-top: 20px; white-space: pre-wrap; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>New Contact Form Submission</h2>
    </div>
    <div class="content">
      <div class="field">
        <span class="label">Name:</span> ${name || "Not provided"}
      </div>
      <div class="field">
        <span class="label">Email:</span> ${email}
      </div>
      ${userId ? `<div class="field">
        <span class="label">User ID:</span> ${userId}
      </div>` : ""}
      <div class="field">
        <span class="label">Subject:</span> ${subject}
      </div>
      <div class="message">
        <span class="label">Message:</span><br>
        ${message.replace(/\n/g, "<br>")}
      </div>
      <div class="footer">
        This email was sent from the Cymasphere contact form.
        <br>
        You can reply directly to this email to respond to the user.
      </div>
    </div>
  </div>
</body>
</html>
    `;

    // Send email using AWS SES
    const result = await sendEmail({
      to: "support@cymasphere.com",
      subject: emailSubject,
      text: textContent,
      html: htmlContent,
      replyTo: email, // Set reply-to so responses go to the user
    });

    if (!result.success) {
      console.error("Failed to send email:", result.error);
      
      // Return error with the actual error message
      return NextResponse.json(
        { 
          success: false, 
          error: result.error || "Failed to send email",
          details: "Check server logs for more information about AWS credentials"
        },
        { status: 500 }
      );
    }

    // Return success response
    return NextResponse.json({ 
      success: true,
      messageId: result.messageId 
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
} 