import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

// AWS Account Configuration
// CORRECT AWS ACCOUNT: 375240177147
// Region: us-east-1

interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string | string[];
  listUnsubscribe?: string;
}

/**
 * Sends an email using Amazon SES with proper headers for better deliverability
 * @param params Email parameters
 * @returns Promise with the result of the email sending operation
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  from = "Cymasphere Support <support@cymasphere.com>", // Default sender
  replyTo,
  listUnsubscribe,
}: SendEmailParams) {
  // Use us-east-1 as the default region (this needs to match your AWS CLI config)
  const region = process.env.AWS_REGION || "us-east-1";
  
  try {
    // Create SES client using environment variables instead of AWS CLI
    const sesClient = new SESClient({ 
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
      }
    });

    // Format recipient email addresses
    const toAddresses = Array.isArray(to) ? to : [to];
    
    // Format reply to addresses if provided
    const replyToAddresses = replyTo ? (Array.isArray(replyTo) ? replyTo : [replyTo]) : [from.match(/<(.+)>/)?.[1] || from];

    // Generate Message-ID for better deliverability
    const messageId = `<${Date.now()}-${Math.random().toString(36).substring(7)}@cymasphere.com>`;
    const date = new Date().toUTCString();

    // Extract email address from "Name <email>" format
    const fromEmail = from.match(/<(.+)>/)?.[1] || from;
    const fromName = from.match(/^(.+?)\s*</)?.[1] || 'Cymasphere Support';

    // Build email headers
    const headers: string[] = [
      `From: ${from}`,
      `To: ${toAddresses.join(', ')}`,
      `Subject: ${subject}`,
      `Date: ${date}`,
      `Message-ID: ${messageId}`,
      `MIME-Version: 1.0`,
      `X-Mailer: Cymasphere Support System`,
      `X-Priority: 3`,
      `Reply-To: ${replyToAddresses.join(', ')}`,
    ];

    // Add List-Unsubscribe headers for better deliverability (Gmail requirement)
    if (listUnsubscribe) {
      headers.push(`List-Unsubscribe: <${listUnsubscribe}>`);
      headers.push(`List-Unsubscribe-Post: List-Unsubscribe=One-Click`);
    } else {
      // Default unsubscribe URL
      const defaultUnsubscribe = `https://www.cymasphere.com/dashboard/support`;
      headers.push(`List-Unsubscribe: <${defaultUnsubscribe}>`);
      headers.push(`List-Unsubscribe-Post: List-Unsubscribe=One-Click`);
    }

    // Build multipart message
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    // Build email body
    let body = '';

    // Add text part
    if (text) {
      body += `--${boundary}\r\n`;
      body += `Content-Type: text/plain; charset=UTF-8\r\n`;
      body += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      body += `${text}\r\n`;
    }

    // Add HTML part
    if (html) {
      body += `--${boundary}\r\n`;
      body += `Content-Type: text/html; charset=UTF-8\r\n`;
      body += `Content-Transfer-Encoding: 7bit\r\n\r\n`;
      body += `${html}\r\n`;
    }

    body += `--${boundary}--\r\n`;

    // Combine headers and body
    const rawMessage = headers.join('\r\n') + '\r\n\r\n' + body;

    console.log("📤 Attempting to send email via AWS SES...");
    console.log("📤 To:", toAddresses);
    console.log("📤 From:", from);
    console.log("📤 Subject:", subject);
    console.log("📤 Region:", region);
    console.log("📤 Has AWS credentials:", !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY));
    console.log("📤 AWS_ACCESS_KEY_ID present:", !!process.env.AWS_ACCESS_KEY_ID);
    console.log("📤 AWS_SECRET_ACCESS_KEY present:", !!process.env.AWS_SECRET_ACCESS_KEY);
    console.log("📤 AWS_REGION:", process.env.AWS_REGION || 'us-east-1 (default)');
    
    // Try with configuration set first
    let command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawMessage),
      },
      ConfigurationSetName: 'cymasphere-email-events',
    });

    try {
      const result = await sesClient.send(command);
      console.log("✅ Email sent successfully via AWS SES, MessageId:", result.MessageId);
      return { success: true, messageId: result.MessageId };
    } catch (configSetError: any) {
      const configSetErrorMessage = configSetError instanceof Error ? configSetError.message : String(configSetError);
      console.warn("⚠️ Failed with configuration set:", configSetErrorMessage);
      
      // If it's a configuration set error, retry without it
      if (configSetErrorMessage.includes('ConfigurationSetDoesNotExist') || 
          configSetErrorMessage.includes('configuration set') ||
          configSetErrorMessage.includes('InvalidParameterValue')) {
        console.warn("⚠️ Configuration set issue detected. Retrying without configuration set...");
        command = new SendRawEmailCommand({
          RawMessage: {
            Data: Buffer.from(rawMessage),
          },
        });
        
        try {
          const retryResult = await sesClient.send(command);
          console.log("✅ Email sent successfully (without config set), MessageId:", retryResult.MessageId);
          return { success: true, messageId: retryResult.MessageId };
        } catch (retryError) {
          console.error("❌ Retry without config set also failed:", retryError);
          // Re-throw to be caught by outer catch block
          throw retryError;
        }
      } else {
        // Not a configuration set error, re-throw to outer catch
        throw configSetError;
      }
    }
  } catch (error) {
    console.error("❌ Error sending email via AWS SES:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error sending email";
    
    // More specific error messaging
    if (errorMessage.includes('security token') || errorMessage.includes('InvalidClientTokenId')) {
      console.error("❌ Invalid AWS security token. Check AWS credentials in .env.local file.");
      console.error("❌ AWS Account should be: 375240177147");
    }
    else if (errorMessage.includes('Email address is not verified')) {
      console.error("❌ The email address is not verified. In SES sandbox mode, both sender and recipient emails must be verified.");
      console.error("❌ Verify the email with: aws ses verify-email-identity --email-address youremail@example.com");
    }
    else if (errorMessage.includes('AccessDenied')) {
      console.error("❌ AWS SES access denied. Check IAM permissions for the AWS credentials.");
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
} 