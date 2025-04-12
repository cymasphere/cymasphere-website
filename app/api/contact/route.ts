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
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Contact Form Submission - Cymasphere</title>
    <style type="text/css">
        /* Reset styles */
        body, html {
            margin: 0;
            padding: 0;
            font-family: 'Arial', sans-serif;
            background-color: #f7f7f7;
            color: #333333;
            line-height: 1.6;
        }
        
        /* Container styling */
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #121212;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid rgba(108, 99, 255, 0.3);
        }
        
        /* Header styling */
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%);
            padding: 30px 20px;
            text-align: center;
            border-bottom: 1px solid rgba(108, 99, 255, 0.2);
        }
        
        .logo {
            width: 250px;
            margin: 0 auto;
            display: block;
        }
        
        .logo-container {
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto;
        }
        
        /* Content styling */
        .content {
            padding: 30px;
            color: #ffffff;
            background-color: #121212;
        }
        
        .title {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
            color: #ffffff;
        }
        
        .title span {
            background: linear-gradient(90deg, #6c63ff, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .message {
            margin-bottom: 20px;
            font-size: 16px;
            color: #b3b3b3;
        }
        
        .field {
            margin-bottom: 15px;
            padding-bottom: 15px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .field:last-child {
            border-bottom: none;
        }
        
        .label {
            font-weight: bold;
            color: #6c63ff;
            display: block;
            margin-bottom: 5px;
        }
        
        .message-box {
            margin-top: 25px;
            padding: 15px;
            background-color: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            border-left: 3px solid #6c63ff;
        }
        
        .timestamp {
            color: #666666;
            font-size: 12px;
            margin-top: 25px;
            text-align: right;
        }
        
        /* Footer styling */
        .footer {
            padding: 15px;
            text-align: center;
            font-size: 12px;
            background-color: #0a0a0a;
            color: #666666;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .footer a {
            color: #6c63ff;
            text-decoration: none;
        }
        
        .footer a:hover {
            text-decoration: underline;
        }
        
        .footer-link {
            margin-bottom: 10px;
        }
        
        .copyright {
            margin: 0;
            color: #666666;
        }
        
        .divider {
            height: 3px;
            background: linear-gradient(90deg, #6c63ff, #4ecdc4);
            width: 100%;
            margin: 0;
            padding: 0;
        }
        
        @media only screen and (max-width: 600px) {
            .email-container {
                width: 100%;
                border-radius: 0;
            }
            
            .content {
                padding: 20px;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="divider"></div>
        <div class="header">
            <div class="logo-container">
                <img src="https://jibirpbauzqhdiwjlrmf.supabase.co/storage/v1/object/public/logos//cymasphere-logo.png" alt="Cymasphere Logo" class="logo">
            </div>
        </div>
        
        <div class="content">
            <h1 class="title">New <span>Contact Form</span> Submission</h1>
            
            <p class="message">You've received a new message through the Cymasphere contact form.</p>
            
            <div class="field">
                <span class="label">Name</span>
                ${name || "Not provided"}
            </div>
            
            <div class="field">
                <span class="label">Email</span>
                <a href="mailto:${email}" style="color: #6c63ff; text-decoration: none;">${email}</a>
            </div>
            
            ${userId ? `<div class="field">
                <span class="label">User ID</span>
                ${userId}
            </div>` : ""}
            
            <div class="field">
                <span class="label">Subject</span>
                ${subject}
            </div>
            
            <div class="message-box">
                <span class="label">Message</span>
                <div style="color: #b3b3b3; margin-top: 10px;">
                    ${message.replace(/\n/g, "<br>")}
                </div>
            </div>
            
            <div class="timestamp">
                Submitted on ${new Date().toLocaleString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                })}
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-link">
                <a href="https://cymasphere.com">Cymasphere</a> by <a href="https://nnaud.io">NNAudio</a>
            </div>
            
            <p class="copyright">© ${new Date().getFullYear()} Cymasphere. All rights reserved.</p>
            <p style="margin-top: 10px; font-size: 11px;">You can reply directly to this email to respond to the user.</p>
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