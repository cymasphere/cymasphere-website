import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/utils/email";

// Mock subscriber data (in production this would come from a database)
const mockSubscribers = [
  {
    id: "1",
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    status: "active",
    tags: ["VIP", "Producer"]
  },
  {
    id: "2", 
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    status: "active",
    tags: ["Beginner"]
  },
  {
    id: "3",
    name: "Mike Rodriguez", 
    email: "mike.rodriguez@example.com",
    status: "unsubscribed",
    tags: ["DJ", "Professional"]
  },
  {
    id: "4",
    name: "Emma Wilson",
    email: "emma.wilson@example.com", 
    status: "active",
    tags: ["Student"]
  },
  {
    id: "5",
    name: "David Kim",
    email: "david.kim@example.com",
    status: "bounced",
    tags: ["Producer", "Advanced"]
  }
];

// Audience segment definitions
const audienceSegments = {
  all: (subscribers: any[]) => subscribers.filter(s => s.status === 'active'),
  active: (subscribers: any[]) => subscribers.filter(s => s.status === 'active'),
  new: (subscribers: any[]) => subscribers.filter(s => s.status === 'active' && s.tags.includes('Beginner')),
  inactive: (subscribers: any[]) => subscribers.filter(s => s.status === 'unsubscribed')
};

interface SendCampaignRequest {
  campaignId?: string;
  name: string;
  subject: string;
  audience: string;
  emailElements: any[];
  scheduleType: 'immediate' | 'scheduled' | 'draft';
  scheduleDate?: string;
  scheduleTime?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: SendCampaignRequest = await request.json();
    const { 
      campaignId,
      name, 
      subject, 
      audience, 
      emailElements, 
      scheduleType,
      scheduleDate,
      scheduleTime 
    } = body;

    // Validate required fields
    if (!name || !subject || !audience || !emailElements) {
      return NextResponse.json(
        { success: false, error: "Missing required campaign fields" },
        { status: 400 }
      );
    }

    // If it's a draft, just save and return
    if (scheduleType === 'draft') {
      return NextResponse.json({
        success: true,
        message: "Campaign saved as draft",
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: 'draft'
      });
    }

    // If scheduled for later, save schedule and return
    if (scheduleType === 'scheduled' && scheduleDate && scheduleTime) {
      const scheduledDateTime = new Date(`${scheduleDate}T${scheduleTime}`);
      if (scheduledDateTime <= new Date()) {
        return NextResponse.json(
          { success: false, error: "Scheduled time must be in the future" },
          { status: 400 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Campaign scheduled for ${scheduledDateTime.toLocaleString()}`,
        campaignId: campaignId || `campaign_${Date.now()}`,
        status: 'scheduled',
        scheduledFor: scheduledDateTime.toISOString()
      });
    }

    // Get subscribers based on audience selection
    const segmentFunction = audienceSegments[audience as keyof typeof audienceSegments];
    if (!segmentFunction) {
      return NextResponse.json(
        { success: false, error: "Invalid audience segment" },
        { status: 400 }
      );
    }

    const targetSubscribers = segmentFunction(mockSubscribers);
    
    if (targetSubscribers.length === 0) {
      return NextResponse.json(
        { success: false, error: "No active subscribers found for the selected audience" },
        { status: 400 }
      );
    }

    // Generate HTML content from email elements
    const htmlContent = generateHtmlFromElements(emailElements, subject);
    const textContent = generateTextFromElements(emailElements);

    console.log(`🚀 Starting to send campaign "${name}" to ${targetSubscribers.length} subscribers...`);

    // Send emails to all subscribers
    const results = [];
    const errors = [];

    for (const subscriber of targetSubscribers) {
      try {
        // Personalize content
        const personalizedHtml = personalizeContent(htmlContent, subscriber);
        const personalizedText = personalizeContent(textContent, subscriber);
        const personalizedSubject = personalizeContent(subject, subscriber);

        const result = await sendEmail({
          to: subscriber.email,
          subject: personalizedSubject,
          html: personalizedHtml,
          text: personalizedText,
          from: "support@cymasphere.com"
        });

        if (result.success) {
          results.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            messageId: result.messageId,
            status: 'sent'
          });
          console.log(`✅ Sent to ${subscriber.email} (${result.messageId})`);
        } else {
          errors.push({
            subscriberId: subscriber.id,
            email: subscriber.email,
            error: result.error,
            status: 'failed'
          });
          console.error(`❌ Failed to send to ${subscriber.email}: ${result.error}`);
        }

        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({
          subscriberId: subscriber.id,
          email: subscriber.email,
          error: errorMessage,
          status: 'failed'
        });
        console.error(`❌ Exception sending to ${subscriber.email}:`, error);
      }
    }

    const successCount = results.length;
    const errorCount = errors.length;
    const totalCount = targetSubscribers.length;

    console.log(`📊 Campaign "${name}" completed:`);
    console.log(`   ✅ Successful: ${successCount}/${totalCount}`);
    console.log(`   ❌ Failed: ${errorCount}/${totalCount}`);

    return NextResponse.json({
      success: true,
      message: `Campaign sent successfully to ${successCount} out of ${totalCount} subscribers`,
      campaignId: campaignId || `campaign_${Date.now()}`,
      stats: {
        total: totalCount,
        sent: successCount,
        failed: errorCount,
        successRate: ((successCount / totalCount) * 100).toFixed(1)
      },
      results,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error in send campaign API:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error sending campaign";
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}

// Helper function to generate HTML from email elements
function generateHtmlFromElements(elements: any[], subject: string): string {
  const elementHtml = elements.map(element => {
    switch (element.type) {
      case 'header':
        return `<h1 style="font-size: 2.5rem; color: #333; margin-bottom: 1rem; text-align: center; background: linear-gradient(135deg, #333, #666); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800;">${element.content}</h1>`;
      
      case 'text':
        return `<p style="font-size: 1rem; color: #555; line-height: 1.6; margin-bottom: 1rem;">${element.content}</p>`;
      
      case 'button':
        return `<div style="text-align: center; margin: 2rem 0;"><a href="${element.url || '#'}" style="display: inline-block; padding: 12px 24px; background: linear-gradient(90deg, #6c63ff, #4ecdc4); color: white; text-decoration: none; border-radius: 25px; font-weight: 600; transition: all 0.3s ease;">${element.content}</a></div>`;
      
      case 'image':
        return `<div style="text-align: center; margin: 1.5rem 0;"><img src="${element.src}" alt="Campaign Image" style="max-width: 100%; height: auto; border-radius: 8px;" /></div>`;
      
      case 'divider':
        return `<hr style="border: none; height: 2px; background: linear-gradient(90deg, #6c63ff, #4ecdc4); margin: 2rem 0;" />`;
      
      case 'spacer':
        return `<div style="height: ${element.height || '20px'};"></div>`;
      
      default:
        return `<div style="color: #555; margin: 1rem 0;">${element.content || ''}</div>`;
    }
  }).join('');

  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${subject}</title>
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f7f7f7;
        }
        .container {
            background-color: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #1a1a1a 0%, #121212 100%);
            padding: 20px;
            text-align: center;
        }
        .logo {
            color: #ffffff;
            font-size: 1.5rem;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .logo .cyma {
            background: linear-gradient(90deg, #6c63ff, #4ecdc4);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .content {
            padding: 30px;
        }
        .footer {
            padding: 20px;
            text-align: center;
            font-size: 12px;
            background-color: #f8f9fa;
            color: #666666;
            border-top: 1px solid #e9ecef;
        }
        .footer a {
            color: #6c63ff;
            text-decoration: none;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">
                <span class="cyma">CYMA</span><span>SPHERE</span>
            </div>
        </div>
        
        <div class="content">
            ${elementHtml}
        </div>
        
        <div class="footer">
            <p>You're receiving this email because you're subscribed to Cymasphere updates.</p>
            <p><a href="https://cymasphere.com/unsubscribe">Unsubscribe</a> | <a href="https://cymasphere.com">Visit our website</a></p>
            <p>© 2024 Cymasphere. All rights reserved.</p>
        </div>
    </div>
</body>
</html>`;
}

// Helper function to generate text content from email elements
function generateTextFromElements(elements: any[]): string {
  const textContent = elements.map(element => {
    switch (element.type) {
      case 'header':
        return `${element.content}\n${'='.repeat(element.content.length)}\n`;
      case 'text':
        return `${element.content}\n`;
      case 'button':
        return `${element.content}: ${element.url || '#'}\n`;
      case 'image':
        return `[Image: ${element.src}]\n`;
      case 'divider':
        return `${'─'.repeat(50)}\n`;
      case 'spacer':
        return '\n';
      default:
        return `${element.content || ''}\n`;
    }
  }).join('\n');

  return `
CYMASPHERE

${textContent}

──────────────────────────────────────────────────

You're receiving this email because you're subscribed to Cymasphere updates.

Unsubscribe: https://cymasphere.com/unsubscribe
Website: https://cymasphere.com

© 2024 Cymasphere. All rights reserved.
  `.trim();
}

// Helper function to personalize content with subscriber data
function personalizeContent(content: string, subscriber: any): string {
  return content
    .replace(/\{\{firstName\}\}/g, subscriber.name.split(' ')[0])
    .replace(/\{\{fullName\}\}/g, subscriber.name)
    .replace(/\{\{email\}\}/g, subscriber.email);
} 