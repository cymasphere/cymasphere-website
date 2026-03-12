/**
 * @fileoverview Email sending utilities using AWS SES
 * 
 * This file provides email sending functionality using Amazon SES (Simple Email
 * Service). Includes support for single emails, batch emails (BCC), HTML/text
 * content, reply-to addresses, and List-Unsubscribe headers for better deliverability.
 * 
 * @module utils/email
 */

import { SESClient, SendRawEmailCommand } from "@aws-sdk/client-ses";

let sesClientInstance: SESClient | null = null;

/**
 * @brief Encodes a UTF-8 string as quoted-printable (RFC 2045) for email parts
 * @param input UTF-8 string
 * @returns Quoted-printable encoded string with soft line breaks at 76 chars
 */
function encodeQuotedPrintable(input: string): string {
  const buf = Buffer.from(input, "utf8");
  const lines: string[] = [];
  let line = "";
  for (let i = 0; i < buf.length; i++) {
    const b = buf[i];
    const char = b >= 32 && b <= 126 && b !== 61 ? String.fromCharCode(b) : `=${b.toString(16).toUpperCase().padStart(2, "0")}`;
    if (line.length + char.length > 76) {
      if (line.length > 0) {
        lines.push(line.endsWith(" ") || line.endsWith("\t") ? line + "=" : line);
        line = "";
      }
      line = char;
    } else {
      line += char;
    }
  }
  if (line.length > 0) {
    lines.push(line.endsWith(" ") || line.endsWith("\t") ? line + "=" : line);
  }
  return lines.join("\r\n");
}

/**
 * @brief Returns a module-level SES client (singleton, lazy-initialized)
 */
function getSESClient(): SESClient {
  if (!sesClientInstance) {
    const region = process.env.AWS_REGION || "us-east-1";
    sesClientInstance = new SESClient({
      region,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
      },
    });
  }
  return sesClientInstance;
}

interface SendEmailParams {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string | string[];
  listUnsubscribe?: string;
  /**
   * Optional logical source for logging/diagnostics (e.g. "updateUserProStatus").
   */
  source?: string;
  /**
   * Optional opaque identifier for higher-level dedupe/tracking (e.g. "free_trial_started").
   * Currently used only for logging so we can correlate sends across call sites.
   */
  dedupeKey?: string;
}

/**
 * Parameters for batch email sending (BCC)
 */
interface SendBatchEmailParams {
  bcc: string[]; // BCC recipients (up to 50 total recipients per AWS SES limit)
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string | string[];
  listUnsubscribe?: string;
}

/**
 * @brief Sends an email using Amazon SES with proper headers for deliverability
 * 
 * Sends a single email or multiple emails (to array) using AWS SES. Includes
 * proper email headers for better deliverability including Message-ID, Date,
 * List-Unsubscribe headers, and multipart content (HTML/text). Supports reply-to
 * addresses and custom from addresses.
 * 
 * @param params Email parameters including recipients, subject, content, and headers
 * @returns Promise with message ID from AWS SES
 * @note Uses AWS SES with credentials from environment variables
 * @note Default region is us-east-1
 * @note Default sender is "Cymasphere Support <support@cymasphere.com>"
 * @note Includes List-Unsubscribe headers for Gmail deliverability
 * @note Generates unique Message-ID for each email
 * @note Supports both HTML and text content (multipart/alternative)
 * 
 * @example
 * ```typescript
 * const messageId = await sendEmail({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   html: "<h1>Welcome</h1>",
 *   text: "Welcome"
 * });
 * // Returns: "0100018a-1234-5678-9abc-def012345678-000000"
 * ```
 */
export async function sendEmail({
  to,
  subject,
  text,
  html,
  from = "Cymasphere Support <support@cymasphere.com>", // Default sender
  replyTo,
  listUnsubscribe,
  source,
  dedupeKey,
}: SendEmailParams) {
  try {
    const sesClient = getSESClient();

    // Format recipient email addresses
    const toAddresses = Array.isArray(to) ? to : [to];
    
    // Format reply to addresses if provided
    const replyToAddresses = replyTo ? (Array.isArray(replyTo) ? replyTo : [replyTo]) : [from.match(/<(.+)>/)?.[1] || from];

    // Generate Message-ID for better deliverability
    const messageId = `<${Date.now()}-${Math.random().toString(36).substring(7)}@cymasphere.com>`;
    const date = new Date().toUTCString();

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
      const defaultUnsubscribe = `https://www.cymasphere.com/support`;
      headers.push(`List-Unsubscribe: <${defaultUnsubscribe}>`);
      headers.push(`List-Unsubscribe-Post: List-Unsubscribe=One-Click`);
    }

    // Build multipart message
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    // Build email body
    let body = '';

    // Add text part (quoted-printable for UTF-8 support)
    if (text) {
      body += `--${boundary}\r\n`;
      body += `Content-Type: text/plain; charset=UTF-8\r\n`;
      body += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
      body += `${encodeQuotedPrintable(text)}\r\n`;
    }

    // Add HTML part (quoted-printable for UTF-8 support)
    if (html) {
      body += `--${boundary}\r\n`;
      body += `Content-Type: text/html; charset=UTF-8\r\n`;
      body += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
      body += `${encodeQuotedPrintable(html)}\r\n`;
    }

    body += `--${boundary}--\r\n`;

    // Combine headers and body
    const rawMessage = headers.join('\r\n') + '\r\n\r\n' + body;

    if (process.env.EMAIL_DEBUG === "true") {
      console.log("📤 Sending email via SES", { subject, recipientCount: toAddresses.length, source: source ?? undefined });
    }

    // Try with configuration set first
    let command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawMessage),
      },
      ConfigurationSetName: 'cymasphere-email-events',
    });

    try {
      const result = await sesClient.send(command);
      if (process.env.EMAIL_DEBUG === "true") {
        console.log("✅ Email sent via SES, MessageId:", result.MessageId);
      }
      return { success: true, messageId: result.MessageId };
    } catch (configSetError: unknown) {
      const configSetErrorMessage = configSetError instanceof Error ? configSetError.message : String(configSetError);
      console.warn("⚠️ Failed with configuration set:", configSetErrorMessage);
      
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
          throw retryError;
        }
      } else {
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

/**
 * @brief Sends a batch email using BCC to multiple recipients
 * 
 * Sends one email to multiple recipients using BCC. Caller must pass at most 49 BCC
 * addresses per call (AWS SES limit: 50 total recipients including To).
 *
 * @param params Batch email parameters including BCC array (max 49), subject, and content
 * @returns Promise with success, messageId, and recipientCount (or error)
 * @note AWS SES limit: max 50 recipients per email (To + CC + BCC). This function
 *       uses 1 To (sender) + up to 49 BCC. Larger lists must be split by the caller.
 *
 * @example
 * ```typescript
 * const result = await sendBatchEmail({
 *   bcc: ["user1@example.com", "user2@example.com"],
 *   subject: "Newsletter",
 *   html: "<h1>Newsletter</h1>"
 * });
 * ```
 */
export async function sendBatchEmail({
  bcc,
  subject,
  text,
  html,
  from = "Cymasphere Support <support@cymasphere.com>",
  replyTo,
  listUnsubscribe,
}: SendBatchEmailParams) {
  // AWS SES limit: max 50 recipients per email (To + CC + BCC combined)
  // We use 1 To (sender's own address) and up to 49 BCC recipients
  const MAX_BCC_PER_EMAIL = 49;

  if (bcc.length === 0) {
    return { success: false, error: "No BCC recipients provided" };
  }

  if (bcc.length > MAX_BCC_PER_EMAIL) {
    return { 
      success: false, 
      error: `Too many BCC recipients. Maximum ${MAX_BCC_PER_EMAIL} per email. Got ${bcc.length}` 
    };
  }

  try {
    const sesClient = getSESClient();

    // Format reply to addresses
    const replyToAddresses = replyTo ? (Array.isArray(replyTo) ? replyTo : [replyTo]) : [from.match(/<(.+)>/)?.[1] || from];

    const fromEmail = from.match(/<(.+)>/)?.[1] || from;

    // Use sender's email as the "To" address (required by SES), all actual recipients go in BCC
    const toAddress = fromEmail;

    // Generate Message-ID
    const messageId = `<${Date.now()}-${Math.random().toString(36).substring(7)}@cymasphere.com>`;
    const date = new Date().toUTCString();

    // Build email headers with BCC
    const headers: string[] = [
      `From: ${from}`,
      `To: ${toAddress}`, // Required by SES, but recipients won't see this
      `Bcc: ${bcc.join(', ')}`, // All actual recipients in BCC for privacy
      `Subject: ${subject}`,
      `Date: ${date}`,
      `Message-ID: ${messageId}`,
      `MIME-Version: 1.0`,
      `X-Mailer: Cymasphere Support System`,
      `X-Priority: 3`,
      `Reply-To: ${replyToAddresses.join(', ')}`,
    ];

    // Add List-Unsubscribe headers
    if (listUnsubscribe) {
      headers.push(`List-Unsubscribe: <${listUnsubscribe}>`);
      headers.push(`List-Unsubscribe-Post: List-Unsubscribe=One-Click`);
    } else {
      const defaultUnsubscribe = `https://www.cymasphere.com/support`;
      headers.push(`List-Unsubscribe: <${defaultUnsubscribe}>`);
      headers.push(`List-Unsubscribe-Post: List-Unsubscribe=One-Click`);
    }

    // Build multipart message
    const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    headers.push(`Content-Type: multipart/alternative; boundary="${boundary}"`);

    // Build email body
    let body = '';

    if (text) {
      body += `--${boundary}\r\n`;
      body += `Content-Type: text/plain; charset=UTF-8\r\n`;
      body += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
      body += `${encodeQuotedPrintable(text)}\r\n`;
    }

    if (html) {
      body += `--${boundary}\r\n`;
      body += `Content-Type: text/html; charset=UTF-8\r\n`;
      body += `Content-Transfer-Encoding: quoted-printable\r\n\r\n`;
      body += `${encodeQuotedPrintable(html)}\r\n`;
    }

    body += `--${boundary}--\r\n`;

    // Combine headers and body
    const rawMessage = headers.join('\r\n') + '\r\n\r\n' + body;

    if (process.env.EMAIL_DEBUG === "true") {
      console.log(`📤 Sending batch email via SES to ${bcc.length} recipients`);
    }

    // Try with configuration set first
    let command = new SendRawEmailCommand({
      RawMessage: {
        Data: Buffer.from(rawMessage),
      },
      Destinations: [toAddress, ...bcc], // SES requires all recipients (To + BCC) in Destinations
      ConfigurationSetName: 'cymasphere-email-events',
    });

    try {
      const result = await sesClient.send(command);
      if (process.env.EMAIL_DEBUG === "true") {
        console.log(`✅ Batch email sent via SES, MessageId: ${result.MessageId}, Recipients: ${bcc.length}`);
      }
      return { success: true, messageId: result.MessageId, recipientCount: bcc.length };
    } catch (configSetError: unknown) {
      const configSetErrorMessage = configSetError instanceof Error ? configSetError.message : String(configSetError);
      console.warn("⚠️ Failed with configuration set:", configSetErrorMessage);
      
      if (configSetErrorMessage.includes('ConfigurationSetDoesNotExist') || 
          configSetErrorMessage.includes('configuration set') ||
          configSetErrorMessage.includes('InvalidParameterValue')) {
        console.warn("⚠️ Configuration set issue detected. Retrying without configuration set...");
        command = new SendRawEmailCommand({
          RawMessage: {
            Data: Buffer.from(rawMessage),
          },
          Destinations: [toAddress, ...bcc],
        });
        
        try {
          const retryResult = await sesClient.send(command);
          console.log(`✅ Batch email sent successfully (without config set), MessageId: ${retryResult.MessageId}, Recipients: ${bcc.length}`);
          return { success: true, messageId: retryResult.MessageId, recipientCount: bcc.length };
        } catch (retryError) {
          console.error("❌ Retry without config set also failed:", retryError);
          throw retryError;
        }
      } else {
        throw configSetError;
      }
    }
  } catch (error) {
    console.error("❌ Error sending batch email via AWS SES:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error sending batch email";
    return { 
      success: false, 
      error: errorMessage,
      recipientCount: bcc.length
    };
  }
} 