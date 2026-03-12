/**
 * @fileoverview AWS SES event webhook endpoint
 *
 * Receives SNS notifications for SES events (send, delivery, bounce, complaint,
 * reject, Open, Click). Verifies optional bearer secret, logs to email_webhook_logs,
 * and processes events to update email_sends, email_opens, email_clicks, and
 * campaign counters. Supabase client is created inside the handler to avoid
 * stale connections in serverless.
 *
 * @module api/webhooks/ses
 */

import { NextRequest, NextResponse } from 'next/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import { createSupabaseServiceRole } from '@/utils/supabase/service';
import type { Database } from '@/database.types';
import type { SESEventPayload } from '@/types/email-campaigns';

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
        const subscribeUrl = snsMessage.SubscribeURL;
        // Only fetch SubscribeURL if it is a real AWS SNS endpoint (SSRF protection)
        const isValidSnsUrl =
          typeof subscribeUrl === 'string' &&
          /^https:\/\/sns\.[a-z0-9-]+\.amazonaws\.com\//i.test(subscribeUrl);
        if (subscribeUrl && isValidSnsUrl) {
          try {
            await fetch(subscribeUrl);
            console.log('✅ SNS subscription confirmed automatically');
          } catch (error) {
            console.error('❌ Failed to confirm SNS subscription:', error);
          }
        } else if (subscribeUrl && !isValidSnsUrl) {
          console.warn('⚠️ SNS SubscribeURL rejected (not a valid AWS SNS endpoint)');
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

    const supabase = await createSupabaseServiceRole();

    await supabase.from('email_webhook_logs').insert({
      provider: 'ses',
      event_type: message.eventType,
      webhook_data: message,
      processed: false
    });

    await processSESEvent(supabase, message);

    return NextResponse.json({ message: 'Webhook processed successfully' });
  } catch (error) {
    console.error('❌ Error processing SES webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function processSESEvent(
  supabase: SupabaseClient<Database>,
  event: SESEventPayload
) {
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
        await handleSendEvent(supabase, event);
        break;
      case 'delivery':
        await handleDeliveryEvent(supabase, event);
        break;
      case 'bounce':
        await handleBounceEvent(supabase, event);
        break;
      case 'complaint':
        await handleComplaintEvent(supabase, event);
        break;
      case 'reject':
        await handleRejectEvent(supabase, event);
        break;
      case 'Open':
        await handleOpenEvent(supabase, event);
        break;
      case 'Click':
        await handleClickEvent(supabase, event);
        break;
      default:
        console.log(`ℹ️ Unhandled SES event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`❌ Error processing ${eventType} event:`, error);
  }
}

async function handleSendEvent(
  supabase: SupabaseClient<Database>,
  event: SESEventPayload
) {
  const mail = event.mail;
  const messageId = mail?.messageId;
  if (!messageId || !mail) return;

  console.log(`📤 Handling send event for message ${messageId}`);

  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  await supabase
    .from('email_sends')
    .update({
      status: 'sent',
      sent_at: mail.timestamp ? new Date(mail.timestamp).toISOString() : new Date().toISOString(),
    })
    .eq('id', emailSend.id);

  console.log(`✅ Updated send record ${emailSend.id} to 'sent' status`);
}

async function handleDeliveryEvent(
  supabase: SupabaseClient<Database>,
  event: SESEventPayload
) {
  const mail = event.mail;
  const delivery = event.delivery;
  const messageId = mail?.messageId;
  if (!messageId || !mail || !delivery) return;

  console.log(`📬 Handling delivery event for message ${messageId}`);

  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  await supabase
    .from('email_sends')
    .update({
      status: 'delivered',
      delivered_at: delivery.timestamp ? new Date(delivery.timestamp).toISOString() : new Date().toISOString(),
    })
    .eq('id', emailSend.id);

  if (emailSend.campaign_id) {
    await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<unknown> }).rpc('increment_campaign_delivered', { campaign_id: emailSend.campaign_id });
  }

  console.log(`✅ Updated send record ${emailSend.id} to 'delivered' status`);
}

async function handleBounceEvent(
  supabase: SupabaseClient<Database>,
  event: SESEventPayload
) {
  const mail = event.mail;
  const bounce = event.bounce;
  const messageId = mail?.messageId;
  if (!messageId || !mail || !bounce) return;

  console.log(`🚫 Handling bounce event for message ${messageId}`);

  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  const bounceReason = bounce.bouncedRecipients?.[0]?.diagnosticCode || 'Unknown bounce reason';
  const bouncedAt = bounce.timestamp ? new Date(bounce.timestamp).toISOString() : new Date().toISOString();

  await supabase
    .from('email_sends')
    .update({
      status: 'bounced',
      bounced_at: bouncedAt,
      bounce_reason: bounceReason,
    })
    .eq('id', emailSend.id);

  if (emailSend.campaign_id) {
    await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<unknown> }).rpc('increment_campaign_bounced', { campaign_id: emailSend.campaign_id });
  }

  if (bounce.bounceType === 'Permanent' && emailSend.subscriber_id) {
    await supabase
      .from('subscribers')
      .update({
        status: 'bounced',
        bounce_reason: bounceReason,
        bounced_at: bouncedAt,
      })
      .eq('id', emailSend.subscriber_id);
    console.log(`🚫 Marked subscriber ${emailSend.subscriber_id} as bounced (hard bounce)`);
  }

  console.log(`✅ Updated send record ${emailSend.id} to 'bounced' status`);
}

async function handleComplaintEvent(
  supabase: SupabaseClient<Database>,
  event: SESEventPayload
) {
  const mail = event.mail;
  const complaint = event.complaint;
  const messageId = mail?.messageId;
  if (!messageId || !mail || !complaint) return;

  console.log(`⚠️ Handling complaint (spam) event for message ${messageId}`);

  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  const complainedAt = complaint.timestamp ? new Date(complaint.timestamp).toISOString() : new Date().toISOString();
  if (emailSend.subscriber_id) {
    await supabase
      .from('subscribers')
      .update({
        status: 'complained',
        complained_at: complainedAt,
      })
      .eq('id', emailSend.subscriber_id);
  }

  if (emailSend.campaign_id) {
    await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<unknown> }).rpc('increment_campaign_spam', { campaign_id: emailSend.campaign_id });
  }

  console.log(`⚠️ Marked subscriber ${emailSend.subscriber_id} as complained (spam)`);
}

async function handleRejectEvent(
  supabase: SupabaseClient<Database>,
  event: SESEventPayload
) {
  const mail = event.mail;
  const reject = event.reject;
  const messageId = mail?.messageId;
  if (!messageId || !mail) return;

  console.log(`❌ Handling reject event for message ${messageId}`);

  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('*')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) {
    console.warn(`⚠️ No email_sends record found for message ${messageId}`);
    return;
  }

  const reason = reject?.reason ?? 'Email rejected by SES';
  await supabase
    .from('email_sends')
    .update({
      status: 'failed',
      bounce_reason: reason,
    })
    .eq('id', emailSend.id);

  console.log(`❌ Updated send record ${emailSend.id} to 'rejected' status`);
}

async function handleOpenEvent(
  supabase: SupabaseClient<Database>,
  event: SESEventPayload
) {
  const messageId = event.mail?.messageId;
  const open = event.open;
  if (!messageId || !open) return;

  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('id, campaign_id, subscriber_id')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) return;

  const { data: existing } = await supabase
    .from('email_opens')
    .select('id')
    .eq('send_id', emailSend.id)
    .limit(1)
    .maybeSingle();

  if (existing) return;

  await supabase.from('email_opens').insert({
    send_id: emailSend.id,
    campaign_id: emailSend.campaign_id,
    subscriber_id: emailSend.subscriber_id,
    ip_address: open.ipAddress ?? null,
    user_agent: open.userAgent ?? null,
    opened_at: open.timestamp ? new Date(open.timestamp).toISOString() : new Date().toISOString(),
  });

  if (emailSend.campaign_id) {
    await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<unknown> }).rpc('increment_campaign_opened', { campaign_id: emailSend.campaign_id });
  }
}

async function handleClickEvent(
  supabase: SupabaseClient<Database>,
  event: SESEventPayload
) {
  const messageId = event.mail?.messageId;
  const click = event.click;
  if (!messageId || !click) return;

  const { data: emailSend, error } = await supabase
    .from('email_sends')
    .select('id, campaign_id, subscriber_id')
    .eq('message_id', messageId)
    .single();

  if (error || !emailSend) return;

  const url = click.link ?? '';
  const { data: existing } = await supabase
    .from('email_clicks')
    .select('id')
    .eq('send_id', emailSend.id)
    .eq('url', url)
    .limit(1)
    .maybeSingle();

  if (existing) return;

  await supabase.from('email_clicks').insert({
    send_id: emailSend.id,
    campaign_id: emailSend.campaign_id,
    subscriber_id: emailSend.subscriber_id,
    url,
    ip_address: click.ipAddress ?? null,
    user_agent: click.userAgent ?? null,
    clicked_at: click.timestamp ? new Date(click.timestamp).toISOString() : new Date().toISOString(),
  });

  if (emailSend.campaign_id) {
    await (supabase as unknown as { rpc: (name: string, params: Record<string, unknown>) => Promise<unknown> }).rpc('increment_campaign_clicked', { campaign_id: emailSend.campaign_id });
  }
} 