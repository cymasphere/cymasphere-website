import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

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
}

/**
 * Sends an email using Amazon SES
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
    const replyToAddresses = replyTo ? (Array.isArray(replyTo) ? replyTo : [replyTo]) : undefined;

    // Generate Message-ID for better deliverability
    const messageId = `<${Date.now()}-${Math.random().toString(36).substring(7)}@cymasphere.com>`;

    // Prepare email sending parameters
    const params: any = {
      Source: from,
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: "UTF-8",
        },
        Body: {
          ...(text && {
            Text: {
              Data: text,
              Charset: "UTF-8",
            },
          }),
          ...(html && {
            Html: {
              Data: html,
              Charset: "UTF-8",
            },
          }),
        },
      },
      ...(replyToAddresses && { ReplyToAddresses: replyToAddresses }),
      ConfigurationSetName: 'cymasphere-email-events', // Enable event tracking
    };

    // Add custom headers for better deliverability
    // Note: SES doesn't directly support custom headers in SendEmailCommand
    // But we can inject them into the HTML if needed
    // The main thing is ensuring SPF/DKIM/DMARC are set up via DNS

    // Send the email
    const command = new SendEmailCommand(params);
    const result = await sesClient.send(command);
    console.log("Email sent successfully:", result.MessageId);
    return { success: true, messageId: result.MessageId };
  } catch (error) {
    console.error("Error sending email:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error sending email";
    
    // More specific error messaging
    if (errorMessage.includes('security token')) {
      console.error("Invalid security token. Check AWS credentials in .env.local file.");
    }
    else if (errorMessage.includes('Email address is not verified')) {
      console.error("The email address is not verified. In SES sandbox mode, both sender and recipient emails must be verified.");
      console.error("Verify the email with: aws ses verify-email-identity --email-address youremail@example.com");
    }
    
    return { 
      success: false, 
      error: errorMessage
    };
  }
} 