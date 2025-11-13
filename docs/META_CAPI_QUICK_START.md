# Meta Conversions API - Quick Start

Super fast setup guide for Meta cAPI integration.

## 1️⃣ Get Your Credentials

### Meta Pixel ID
```
Go to: https://business.facebook.com/events_manager2
→ Select your Pixel
→ Copy the numeric ID (e.g., 123456789012345)
```

### Access Token
```
Go to: https://business.facebook.com
→ Settings → Data Sources → Datasets
→ Select your Pixel
→ Generate or copy Access Token
→ Keep SECRET (don't commit to git!)
```

## 2️⃣ Add Environment Variables

**Local development (`.env.local`):**
```bash
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_CONVERSIONS_API_TOKEN=your_access_token_here
```

**Production (GitHub Secrets or your hosting platform):**
```bash
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_CONVERSIONS_API_TOKEN=your_access_token_here
```

**Restart dev server:**
```bash
npm run dev
```

## 3️⃣ Apply Database Migration

Run the migration to create the logging table:

```bash
npx supabase migration apply
```

Or manually in Supabase SQL editor, run the migration file from:
```
supabase/migrations/20250115000001_create_meta_conversion_events.sql
```

## 4️⃣ Track Conversions

### Option A: Track Purchase

```typescript
import { trackMetaConversion } from '@/utils/analytics';

// When user completes purchase
const result = await trackMetaConversion('Purchase', {
  email: user.email,
  value: 99.99,
  currency: 'USD',
  transactionId: order.id,
});

if (result.success) {
  console.log('✅ Tracked to Meta');
} else {
  console.error('❌ Error:', result.error);
}
```

### Option B: Track Sign Up

```typescript
const result = await trackMetaConversion('CompleteRegistration', {
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
});
```

### Option C: Track Lead / Form

```typescript
const result = await trackMetaConversion('Lead', {
  email: formData.email,
  phone: formData.phone,
  firstName: formData.firstName,
  lastName: formData.lastName,
});
```

## 5️⃣ Test It

### In Browser Console

Open DevTools → Network tab → Filter by "meta/events" → Perform action

Should see POST requests to `/api/meta/events` with 200 status.

### In Meta Events Manager

Use test event code:

```typescript
const result = await trackMetaConversion('Purchase', {
  email: 'test@example.com',
  value: 99.99,
  testEventCode: 'TEST123', // Add this line
});
```

Then go to https://business.facebook.com/events_manager2 → Test Events → Should see event appear within 5 seconds.

### In Supabase

```sql
SELECT * FROM meta_conversion_events
ORDER BY created_at DESC LIMIT 10;
```

Should see your events logged here.

## 6️⃣ Common Integration Points

### Stripe Webhook

```typescript
// app/api/stripe/webhook/route.ts
import { trackMetaConversion } from '@/utils/analytics';

// In your charge.succeeded handler:
await trackMetaConversion('Purchase', {
  email: charge.billing_details.email,
  value: charge.amount / 100,
  currency: charge.currency.toUpperCase(),
  transactionId: charge.id,
});
```

### Email Campaign Send

```typescript
// In your email send handler:
import { trackMetaConversion } from '@/utils/analytics';

await trackMetaConversion('Lead', {
  email: subscriber.email,
  customData: {
    campaign_id: campaign.id,
    campaign_type: 'email',
  },
});
```

### Form Submission

```typescript
// In your contact form handler:
import { trackMetaConversion } from '@/utils/analytics';

const result = await trackMetaConversion('Lead', {
  email: formData.email,
  phone: formData.phone,
  firstName: formData.firstName,
  lastName: formData.lastName,
});

if (result.success) {
  // Submit form
}
```

## 7️⃣ Verify It's Working

**Checklist:**
- [ ] Environment variables set
- [ ] Dev server restarted
- [ ] Database migration applied
- [ ] Events appear in browser console (Network tab)
- [ ] Events logged to Supabase
- [ ] Events appear in Meta Events Manager (with testEventCode)
- [ ] No errors in server logs

**If something's wrong:**

```bash
# Check env vars are loaded
echo $META_CONVERSIONS_API_TOKEN

# Check server logs
npm run dev
# Look for: "📤 Sending Meta conversion event"
# Or: "❌ Error sending to Meta API"

# Check Supabase
# Go to SQL editor, run:
# SELECT * FROM meta_conversion_events WHERE status = 'failed'
```

## All Available Events

```typescript
trackMetaConversion('Purchase', {...})              // Sale/purchase
trackMetaConversion('CompleteRegistration', {...})  // Sign up
trackMetaConversion('Lead', {...})                  // Form submission
trackMetaConversion('Contact', {...})               // Contact attempt
trackMetaConversion('ViewContent', {...})           // Product/page view
trackMetaConversion('AddToCart', {...})             // Add to cart
trackMetaConversion('InitiateCheckout', {...})      // Start checkout
trackMetaConversion('AddPaymentInfo', {...})        // Enter payment
trackMetaConversion('Search', {...})                // Site search
trackMetaConversion('Subscribe', {...})             // Subscription
trackMetaConversion('Donate', {...})                // Donation
trackMetaConversion('PageView', {...})              // Page view
```

## That's It! 🎉

Your Meta cAPI is now live. All conversions will:
- ✅ Be sent to Meta's Conversions API
- ✅ Work even with ad blockers
- ✅ Work with privacy-focused browsers
- ✅ Be logged in Supabase for debugging
- ✅ Help improve your ad targeting

See `docs/META_CONVERSIONS_API.md` for advanced topics.


