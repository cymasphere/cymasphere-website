# Meta Conversions API Integration Guide

This document explains how to use the custom Meta Conversions API integration built into Cymasphere.

## What is Meta Conversions API?

Meta Conversions API (cAPI) is **server-side conversion tracking** that complements the pixel. Benefits:

- ✅ Works even if user has ad blockers enabled
- ✅ Works with Safari ITP, Firefox ETP, and other privacy features
- ✅ More reliable conversion attribution
- ✅ Better accuracy for ROI calculation
- ✅ Direct server-to-server communication with Meta
- ✅ Full audit trail in your database

## Architecture

```
Frontend                Backend              Meta
─────────────────────────────────────────────────────
  │
  ├─→ trackMetaConversion('Purchase', {...})
  │
  └─→ POST /api/meta/events
        │
        ├─→ Validate & normalize data
        ├─→ Hash PII (email, phone, etc.)
        ├─→ Log to Supabase (optional)
        │
        └─→ POST to Meta API
             │
             └─→ Returns event ID
```

## Environment Variables

Add these to your `.env.local` (development) and production environment:

```bash
# Your Meta Pixel ID (numeric)
NEXT_PUBLIC_META_PIXEL_ID=123456789012345

# Meta Conversions API Access Token
# Get from: Meta Business Suite → Settings → Conversions → API Setup
META_CONVERSIONS_API_TOKEN=your_access_token_here
```

### Getting the Access Token

1. Go to https://business.facebook.com
2. Select your Business Account
3. Settings → Business Tools → Data Sources → Datasets
4. Select your Pixel
5. Click "Set Up" or "Connected Apps"
6. Generate or copy your access token
7. Keep this **secret** - never commit to git

## Setup Steps

### 1. Run Database Migration

```bash
# Apply migration to create meta_conversion_events table
npx supabase migration apply
```

Or manually create the table in Supabase SQL editor using the migration file.

### 2. Set Environment Variables

```bash
# .env.local (or GitHub Secrets for production)
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_CONVERSIONS_API_TOKEN=your_token_here
```

### 3. Restart Development Server

```bash
npm run dev
# or
bun dev
```

## Usage Examples

### Basic Purchase Event

```typescript
import { trackMetaConversion } from '@/utils/analytics';

// In your checkout/payment handler
const result = await trackMetaConversion('Purchase', {
  email: user.email,
  value: 99.99,
  currency: 'USD',
  transactionId: order.id,
  numItems: 1,
});

if (result.success) {
  console.log('✅ Purchase tracked successfully');
} else {
  console.error('❌ Tracking failed:', result.error);
}
```

### Sign Up Event

```typescript
import { trackMetaConversion } from '@/utils/analytics';

const result = await trackMetaConversion('CompleteRegistration', {
  email: newUser.email,
  firstName: newUser.firstName,
  lastName: newUser.lastName,
  customData: {
    status: 'completed',
  },
});
```

### Lead Event (Form Submission)

```typescript
import { trackMetaConversion } from '@/utils/analytics';

const result = await trackMetaConversion('Lead', {
  email: formData.email,
  phone: formData.phone,
  firstName: formData.firstName,
  lastName: formData.lastName,
  customData: {
    content_name: 'Contact Form',
    form_id: 'contact-form-123',
  },
});
```

### Add to Cart Event

```typescript
import { trackMetaConversion } from '@/utils/analytics';

const result = await trackMetaConversion('AddToCart', {
  email: user.email,
  value: cartTotal,
  currency: 'USD',
  contentIds: cartItems.map(item => item.id),
  numItems: cartItems.length,
});
```

### Page View (with full user data)

```typescript
import { trackMetaConversion } from '@/utils/analytics';

// Track when user lands on pricing page
const result = await trackMetaConversion('PageView', {
  email: currentUser?.email,
  userId: currentUser?.id,
  customData: {
    page_title: 'Pricing',
  },
});
```

### Testing Event

```typescript
import { trackMetaConversion } from '@/utils/analytics';

// Use testEventCode to see events in Meta Events Manager in real-time
const result = await trackMetaConversion('Lead', {
  email: 'test@example.com',
  testEventCode: 'TEST123', // Optional - use to see events in Meta Events Manager
});
```

## Supported Events

All standard Meta conversion events are supported:

```typescript
import { trackMetaConversion } from '@/utils/analytics';

// Purchase (most important for e-commerce)
trackMetaConversion('Purchase', { email, value, currency });

// Sign up
trackMetaConversion('CompleteRegistration', { email });

// Lead (contact form, etc.)
trackMetaConversion('Lead', { email, phone });

// View product/content
trackMetaConversion('ViewContent', { email, contentIds });

// Search
trackMetaConversion('Search', { email, customData: { search_term } });

// Add to cart
trackMetaConversion('AddToCart', { email, value, currency });

// Initiate checkout
trackMetaConversion('InitiateCheckout', { email, value });

// Custom events
trackMetaConversion('CustomEvent', { email, customData: {...} });
```

## Event Parameters

### User Data

All user data is hashed (SHA-256) on the server before sending to Meta:

```typescript
trackMetaConversion('Purchase', {
  email: 'user@example.com',              // Will be hashed
  phone: '+1-234-567-8900',                // Will be hashed
  firstName: 'John',                       // Will be hashed
  lastName: 'Doe',                         // Will be hashed
  city: 'New York',                        // Will be hashed
  state: 'NY',                             // Will be hashed
  zip: '10001',                            // Will be hashed
  country: 'US',                           // 2-letter country code
  userId: '12345',                         // Your internal user ID
  value: 99.99,
  currency: 'USD',
  numItems: 1,
});
```

### Custom Data

Add any custom fields relevant to your events:

```typescript
trackMetaConversion('Purchase', {
  email: user.email,
  value: 99.99,
  currency: 'USD',
  customData: {
    product_category: 'music',
    subscription_type: 'monthly',
    is_trial: false,
    is_upgrade: true,
    revenue_type: 'subscription',
  },
});
```

## Testing & Debugging

### 1. Check Network Tab

In your browser DevTools:
1. Open Network tab
2. Filter by "meta/events"
3. Should see POST requests to `/api/meta/events`
4. Check response status (should be 200)

### 2. Check Database Logs

Query your Supabase table:

```sql
SELECT * FROM meta_conversion_events
ORDER BY created_at DESC
LIMIT 20;
```

### 3. Check Meta Events Manager

1. Go to https://business.facebook.com/events_manager2
2. Select your Pixel
3. Click "Test Events" tab
4. Use `testEventCode` parameter:
   ```typescript
   trackMetaConversion('Purchase', {
     email: 'test@example.com',
     value: 99.99,
     testEventCode: 'TEST123', // Add this
   });
   ```
5. Events should appear in real-time in Test Events

### 4. Check Server Logs

In development:
```bash
npm run dev
# Look for logs like:
# 📤 Sending Meta conversion event: Purchase
# ✅ Event(s) sent to Meta successfully
```

### Error Troubleshooting

**"Missing Meta Pixel ID or Access Token"**
- Check environment variables are set correctly
- Restart dev server after adding env vars

**"Too many requests" (429 error)**
- Your IP hit rate limit (100 requests/60 seconds)
- Wait 60 seconds and retry

**Events not appearing in Meta Events Manager**
- Make sure you're using `testEventCode`
- Check the "Events" tab (not "Test Events")
- Wait a few seconds, then refresh

**"Invalid access token"**
- Token expired or invalid
- Generate new token from Meta Business Suite
- Check token hasn't been rotated

## Best Practices

### 1. Track Only Important Events

Don't track every click. Focus on key conversions:
- ✅ Purchases
- ✅ Sign ups
- ✅ Form submissions
- ✅ Important clicks

### 2. Include User Data When Available

More user data = better Meta attribution:

```typescript
trackMetaConversion('Purchase', {
  email: user.email,              // Most important
  phone: user.phone,              // Helps with matching
  firstName: user.firstName,      // Better accuracy
  lastName: user.lastName,        // Better accuracy
  country: user.country,          // Location data
  value: 99.99,
  currency: 'USD',
});
```

### 3. Deduplicate Events

Combine pixel tracking + cAPI for reliability, but don't double-count:

```typescript
// Option 1: Only track on backend (recommended)
// - User converts → sends event to server → server tracks to Meta
// - Pixel still fires for remarketing

// Option 2: Track both ways with deduplication
// - Use event_id to deduplicate in Meta
trackMetaConversion('Purchase', {
  email: user.email,
  transactionId: order.id,  // Used as event deduplication ID
  value: order.total,
});
```

### 4. Use Consistent Data

Always send the same user email/phone for a user:

```typescript
// ❌ Bad - different emails for same user
trackMetaConversion('Lead', { email: 'john@example.com' });
trackMetaConversion('Purchase', { email: 'john.doe@example.com' });

// ✅ Good - consistent email
trackMetaConversion('Lead', { email: 'john@example.com' });
trackMetaConversion('Purchase', { email: 'john@example.com' });
```

### 5. Test Before Going Live

1. Add `testEventCode` to your tracking
2. Verify events appear in Meta Events Manager
3. Check Supabase logs
4. Confirm error messages are descriptive
5. Only then remove test code

## Monitoring & Maintenance

### Daily Checks

```sql
-- Check for failed events
SELECT COUNT(*) as failed_count 
FROM meta_conversion_events 
WHERE status = 'failed' 
AND created_at > NOW() - INTERVAL '1 day';

-- Check error patterns
SELECT error_message, COUNT(*) as count
FROM meta_conversion_events
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '1 day'
GROUP BY error_message
ORDER BY count DESC;
```

### Weekly Reports

```sql
-- Events by type
SELECT event_name, COUNT(*) as count, status
FROM meta_conversion_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_name, status
ORDER BY count DESC;

-- Success rate
SELECT 
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as success_rate
FROM meta_conversion_events
WHERE created_at > NOW() - INTERVAL '7 days';
```

## Troubleshooting Common Issues

### Events Not Showing in Meta

**Check:**
1. ✅ Pixel ID is correct
2. ✅ Access token is valid and not expired
3. ✅ Events are being logged to Supabase
4. ✅ No error messages in database
5. ✅ Using correct event names

**Solution:**
```bash
# Check logs
tail -f server.log | grep "Meta"

# Test with a known good conversion
curl -X POST http://localhost:3000/api/meta/events \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "Purchase",
    "userData": { "email": "test@example.com" },
    "customData": { "value": 99.99, "currency": "USD" }
  }'
```

### High Failure Rate

**Check:**
1. Access token validity
2. Rate limiting (100 req/60 sec per IP)
3. Network connectivity
4. Meta API status

**Solution:**
- Implement exponential backoff retry logic
- Monitor error types in Supabase
- Contact Meta support if API is down

### PII Hashing Issues

Our implementation:
- ✅ SHA-256 hashing
- ✅ Lowercase normalization
- ✅ Whitespace trimming
- ✅ Phone digit extraction

If matching is poor:
- Verify data consistency (same emails for same users)
- Check phone numbers are complete
- Ensure names are correct

## Integration with Existing Tracking

### With Email Campaigns

```typescript
// In email campaign send handler
import { trackMetaConversion } from '@/utils/analytics';

async function sendEmailCampaign(campaign, subscriber) {
  // ... send email ...
  
  // Also track to Meta
  await trackMetaConversion('Lead', {
    email: subscriber.email,
    firstName: subscriber.metadata?.first_name,
    lastName: subscriber.metadata?.last_name,
    customData: {
      campaign_id: campaign.id,
      campaign_name: campaign.name,
    },
  });
}
```

### With Stripe Webhooks

```typescript
// In Stripe webhook handler
import { trackMetaConversion } from '@/utils/analytics';

async function handleStripeEvent(event) {
  if (event.type === 'charge.succeeded') {
    const charge = event.data.object;
    
    // Track purchase to Meta
    await trackMetaConversion('Purchase', {
      email: charge.billing_details.email,
      value: charge.amount / 100,
      currency: charge.currency.toUpperCase(),
      transactionId: charge.id,
      customData: {
        payment_method: charge.payment_method_details.type,
      },
    });
  }
}
```

### With Analytics Events

```typescript
// Track both to GA and Meta simultaneously
import { trackEvent, trackMetaConversion } from '@/utils/analytics';

async function trackConversion(type: string, data: any) {
  // GA/GTM
  trackEvent(`conversion_${type}`, data);
  
  // Meta
  await trackMetaConversion(type, data);
}
```

## Support & Resources

- **Meta Docs**: https://developers.facebook.com/docs/marketing-api/conversions-api
- **Events Manager**: https://business.facebook.com/events_manager2
- **Pixel Helper**: Chrome extension for debugging
- **API Errors**: https://developers.facebook.com/docs/marketing-api/conversions-api/api-errors

## FAQ

**Q: Do I need both pixel and cAPI?**
A: Yes, they work together. Pixel = client-side, cAPI = server-side. Together they're more reliable.

**Q: Will I double-count conversions?**
A: Meta deduplicates using event IDs. Use the same `transactionId` to deduplicate.

**Q: Can I send historical data?**
A: Yes, use any timestamp. Meta accepts data up to 7 days old.

**Q: What about GDPR/privacy?**
A: All data is hashed and sent securely. You should still have proper consent mechanisms.

**Q: Does this work with server-side rendering?**
A: Yes - it's completely server-side. Works in SSR, SSG, and API routes.

**Q: Can I track authenticated users only?**
A: Yes, check for user session before calling `trackMetaConversion`.

**Q: What's the latency?**
A: Typically 100-500ms. Non-blocking (doesn't wait for Meta to respond).


