import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * @brief Verifies webhook request using optional shared secret
 *
 * When SES_WEBHOOK_SECRET is set, requires Authorization: Bearer <secret>.
 * Use a proxy or Lambda in front of this endpoint that verifies SNS signature
 * and forwards with the secret. In production without the secret set, rejects.
 */
function verifyWebhookAuth(request: NextRequest): boolean {
  const secret = process.env.SES_WEBHOOK_SECRET;
  if (process.env.NODE_ENV === 'development' && !secret) {
    return true;
  }
  if (!secret) {
    console.error('SES_WEBHOOK_SECRET is not set - rejecting webhook in production');
    return false;
  }
  const authHeader = request.headers.get('authorization');
  return authHeader === `Bearer ${secret}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    console.log('📬 SES Webhook received:', {
      contentType: headers['content-type'],
      userAgent: headers['user-agent'],
      bodyLength: body.length
    });

    // Verify webhook authorization (shared secret; SNS verification should be done by proxy if needed)
    if (!verifyWebhookAuth(request)) {
      console.error('❌ SES webhook unauthorized');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let message;
    try {
      const snsMessage = JSON.parse(body);
      
      // Handle SNS subscription confirmation
      if (snsMessage.Type === 'SubscriptionConfirmation') {
        console.log('🔔 SNS Subscription confirmation received');
        console.log('Subscribe URL:', snsMessage.SubscribeURL);
        
        // Auto-confirm subscription (optional - you might want to do this manually)
        if (snsMessage.SubscribeURL) {
          try {
            await fetch(snsMessage.SubscribeURL);
            console.log('✅ SNS subscription confirmed automatically');
          } catch (error) {
            console.error('❌ Failed to confirm SNS subscription:', error);
          }
        }
        
        return NextResponse.json({ message: 'Subscription confirmed' });
      }
      
      // Handle SNS notification
      if (snsMessage.Type === 'Notification') {
        message = JSON.parse(snsMessage.Message);
      } else {
        message = snsMessage;
      }
    } catch (error) {
      console.error('❌ Failed to parse SNS message:', error);
      return NextResponse.json({ error: 'Invalid message format' }, { status: 400 });
    }

    console.log('📧 SES Event received:', {
      eventType: message.eventType,
      messageId: message.mail?.messageId,
      timestamp: message.mail?.timestamp
    });

    // Log the webhook for debugging
    await supabase.from('email_webhook_logs').insert({
      provider: 'ses',
      event_type: message.eventType,
      webhook_data: message,
      processed: false
    });

    // Process the SES event
    await processSESEvent(message);

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Error processing SES webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processSESEvent(event: any) {
  const { eventType, mail } = event;
  const messageId = mail?.messageId;
  
  if (!messageId) {
    console.warn('⚠️ No messageId in SES event, skipping');
    return;
  }

  console.log(`🔄 Processing SES event: ${eventType} for message ${messageId}`);

  try {
    switch (eventType) {
      case 'send':
        await handleSendEvent(event);
        break;
      case 'delivery':
        await handleDeliveryEvent(event);
        break;
      case 'bounce':
        await handleBounceEvent(event);
        break;
      case 'complaint':
        await handleComplaintEvent(event);
        break;
      case 'reject':
        await handleRejectEvent(event);
        break;
      default:
        console.log(`ℹ️ Unhandled SES event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${eventType} event:`, error);
  }
}

async function handleSendEvent(event: any) {
  const { mail } = event;
  const messageId = mail.messageId;
  
  console.log(`📤 Handling send event for message ${messageId}`);
  
  // Find the email send record by message_id
  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  // Update the send record
  await supabase
    .from('email_sends')
    .update({
      status: 'sent',
      sent_at: new Date(mail.timestamp).toISOString()
    })
    .eq('id', emailSend.id);

  console.log(`✅ Updated send record ${emailSend.id} to 'sent' status`);
}

async function handleDeliveryEvent(event: any) {
  const { mail, delivery } = event;
  const messageId = mail.messageId;
  
  console.log(`📬 Handling delivery event for message ${messageId}`);
  
  // Find the email send record
  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  // Update the send record to delivered
  await supabase
    .from('email_sends')
    .update({
      status: 'delivered',
      delivered_at: new Date(delivery.timestamp).toISOString()
    })
    .eq('id', emailSend.id);

  // Update campaign delivery count
  await supabase.rpc('increment_campaign_delivered', {
    campaign_id: emailSend.campaign_id
  });

  console.log(`✅ Updated send record ${emailSend.id} to 'delivered' status`);
}

async function handleBounceEvent(event: any) {
  const { mail, bounce } = event;
  const messageId = mail.messageId;
  
  console.log(`🚫 Handling bounce event for message ${messageId}`);
  
  // Find the email send record
  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  // Update the send record to bounced
  const bounceReason = bounce.bouncedRecipients?.[0]?.diagnosticCode || 'Unknown bounce reason';
  
  await supabase
    .from('email_sends')
    .update({
      status: 'bounced',
      bounced_at: new Date(bounce.timestamp).toISOString(),
      bounce_reason: bounceReason
    })
    .eq('id', emailSend.id);

  // Update campaign bounce count
  await supabase.rpc('increment_campaign_bounced', {
    campaign_id: emailSend.campaign_id
  });

  // If it's a hard bounce, mark subscriber as bounced
  if (bounce.bounceType === 'Permanent') {
    await supabase
      .from('subscribers')
      .update({
        status: 'bounced',
        bounce_reason: bounceReason,
        bounced_at: new Date(bounce.timestamp).toISOString()
      })
      .eq('id', emailSend.subscriber_id);
    
    console.log(`🚫 Marked subscriber ${emailSend.subscriber_id} as bounced (hard bounce)`);
  }

  console.log(`✅ Updated send record ${emailSend.id} to 'bounced' status`);
}

async function handleComplaintEvent(event: any) {
  const { mail, complaint } = event;
  const messageId = mail.messageId;
  
  console.log(`⚠️ Handling complaint (spam) event for message ${messageId}`);
  
  // Find the email send record
  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  // Mark subscriber as complained (spam)
  await supabase
    .from('subscribers')
    .update({
      status: 'complained',
      complained_at: new Date(complaint.timestamp).toISOString()
    })
    .eq('id', emailSend.subscriber_id);

  // Update campaign spam count
  await supabase.rpc('increment_campaign_spam', {
    campaign_id: emailSend.campaign_id
  });

  console.log(`⚠️ Marked subscriber ${emailSend.subscriber_id} as complained (spam)`);
}

async function handleRejectEvent(event: any) {
  const { mail, reject } = event;
  const messageId = mail.messageId;
  
  console.log(`❌ Handling reject event for message ${messageId}`);
  
  // Find the email send record
  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  // Update the send record to rejected
  await supabase
    .from('email_sends')
    .update({
      status: 'rejected',
      bounce_reason: reject.reason || 'Email rejected by SES'
    })
    .eq('id', emailSend.id);

  console.log(`❌ Updated send record ${emailSend.id} to 'rejected' status`);
} 