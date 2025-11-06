# Marketing & Analytics Integration Summary

This document summarizes all marketing and analytics tools integrated into Cymasphere.

## 🎯 What's Integrated

### ✅ Part 1: Tracking Infrastructure (GTM, GA, Meta Pixel)
- **Google Tag Manager** - Central tag management system
- **Google Analytics** - Website analytics & behavior tracking  
- **Meta Pixel** - Facebook/Instagram ad pixel

**Status**: ✅ Complete and ready to use  
**Setup**: Add 3 environment variables  
**Documentation**: `docs/MARKETING_ANALYTICS_SETUP.md`

### ✅ Part 2: Meta Conversions API (cAPI) - Server-Side Conversion Tracking
- **Custom API Endpoint** - `/api/meta/events`
- **Event Logging** - Supabase `meta_conversion_events` table
- **PII Hashing** - SHA-256 hashing of emails, phone, names
- **Deduplication** - Built-in event ID deduplication
- **Rate Limiting** - 100 requests per 60 seconds per IP

**Status**: ✅ Complete and ready to deploy  
**Setup**: Add 2 environment variables + run database migration  
**Documentation**: `docs/META_CAPI_QUICK_START.md` and `docs/META_CONVERSIONS_API.md`

---

## 📋 Complete Setup Checklist

### Phase 1: Google Tag Manager & Analytics (15 minutes)

```bash
☐ Create GTM container (https://tagmanager.google.com)
☐ Get GTM Container ID (GTM-XXXXXXX)
☐ Create GA4 property (https://analytics.google.com)
☐ Get GA Measurement ID (G-XXXXXXXXXX)
☐ Add to .env.local:
    NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
    NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
    NEXT_PUBLIC_META_PIXEL_ID=123456789012345
☐ Restart dev server
☐ Verify with Google Tag Assistant Chrome extension
☐ Invite team members to GTM & GA
    - matterandrew@gmail.com
    - willradio08@gmail.com
    - maciej.raszke@gmail.com
```

### Phase 2: Meta Conversions API (20 minutes)

```bash
☐ Get Meta Pixel ID from Events Manager
☐ Generate Access Token from Meta Business Suite
☐ Add to .env.local:
    META_CONVERSIONS_API_TOKEN=your_token_here
☐ Run database migration:
    npx supabase migration apply
☐ Restart dev server
☐ Test with trackMetaConversion('Purchase', {...})
☐ Verify events in Meta Events Manager with testEventCode
☐ Check Supabase logs
```

### Phase 3: Integration Points (varies by feature)

```bash
☐ Track Stripe purchases in webhook
☐ Track email campaign sends
☐ Track form submissions
☐ Track user sign ups
☐ Track important page views
```

---

## 🚀 Quick Start Code Examples

### Track a Purchase

```typescript
import { trackMetaConversion } from '@/utils/analytics';

await trackMetaConversion('Purchase', {
  email: user.email,
  value: 99.99,
  currency: 'USD',
  transactionId: order.id,
});
```

### Track a Sign Up

```typescript
import { trackMetaConversion } from '@/utils/analytics';

await trackMetaConversion('CompleteRegistration', {
  email: newUser.email,
  firstName: newUser.firstName,
  lastName: newUser.lastName,
});
```

### Track a Lead / Form Submission

```typescript
import { trackMetaConversion } from '@/utils/analytics';

await trackMetaConversion('Lead', {
  email: formData.email,
  phone: formData.phone,
  firstName: formData.firstName,
  lastName: formData.lastName,
});
```

### Track in Stripe Webhook

```typescript
// app/api/stripe/webhook/route.ts
import { trackMetaConversion } from '@/utils/analytics';

if (event.type === 'charge.succeeded') {
  const charge = event.data.object;
  await trackMetaConversion('Purchase', {
    email: charge.billing_details.email,
    value: charge.amount / 100,
    currency: charge.currency.toUpperCase(),
    transactionId: charge.id,
  });
}
```

---

## 📁 Files Created/Modified

### New Files Created

**Components:**
- `components/analytics/Analytics.tsx` - Main analytics component

**API Endpoints:**
- `app/api/meta/events/route.ts` - Meta cAPI endpoint (250+ lines)

**Utilities:**
- `utils/meta-conversions-api.ts` - Meta event builders (400+ lines)
- `utils/analytics.ts` - Analytics tracking functions (382 lines)

**Database:**
- `supabase/migrations/20250115000001_create_meta_conversion_events.sql` - Event logging table

**Documentation:**
- `docs/MARKETING_ANALYTICS_SETUP.md` - Full GTM/GA/Pixel setup guide
- `docs/META_CONVERSIONS_API.md` - Comprehensive cAPI documentation (500+ lines)
- `docs/META_CAPI_QUICK_START.md` - Quick reference guide
- `docs/INTEGRATION_SUMMARY.md` - This file

### Modified Files

**Components:**
- `components/common/NextScript.tsx` - Added GTM & Meta Pixel components

**Layouts:**
- `app/layout.tsx` - Integrated Analytics component

---

## 🔑 Environment Variables Required

### For Local Development (`.env.local`)

```bash
# Google Tag Manager (optional but recommended)
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX

# Google Analytics (optional if using GTM)
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX

# Meta Pixel (optional for pixel-only tracking)
NEXT_PUBLIC_META_PIXEL_ID=123456789012345

# Meta Conversions API (optional but recommended)
META_CONVERSIONS_API_TOKEN=your_access_token_here
```

### For Production (GitHub Secrets / Platform Environment Variables)

```bash
# Same as above, but set as secrets:
NEXT_PUBLIC_GTM_ID
NEXT_PUBLIC_GA_ID
NEXT_PUBLIC_META_PIXEL_ID
META_CONVERSIONS_API_TOKEN
```

**Important**: Never commit `META_CONVERSIONS_API_TOKEN` to git. Always use environment secrets.

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Browser)                                          │
│                                                             │
│  User Action → trackMetaConversion('Purchase', {email})    │
│       ↓                                                      │
│  POST /api/meta/events                                      │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend (Next.js API)                                       │
│                                                             │
│  1. Validate request                                        │
│  2. Normalize & hash PII (SHA-256)                          │
│  3. Log to Supabase                                         │
│  4. Forward to Meta API                                     │
└────────────────┬────────────────────────────────────────────┘
                 │
         ┌───────┴────────┐
         ↓                ↓
    ┌────────────┐   ┌──────────────┐
    │ Supabase   │   │ Meta cAPI    │
    │ Logging    │   │ (Permanent)  │
    └────────────┘   └──────────────┘
```

---

## ✨ Key Features

### Auto-Hashing of PII
All personally identifiable information is automatically hashed using SHA-256:
- Email addresses
- Phone numbers
- First names
- Last names
- City, state, zip
- Automatically normalized (lowercase, trimmed)

### Event Deduplication
- Uses `eventId` / `transactionId` for deduplication
- Prevents double-counting from pixel + cAPI
- Meta handles deduplication server-side

### Comprehensive Logging
All events logged to Supabase for:
- Debugging
- Compliance audits
- Error tracking
- Success rate monitoring

### Rate Limiting
Built-in rate limiting: 100 requests per IP per 60 seconds

### Full Error Handling
- Graceful error messages
- Detailed logging
- Failed events tracked in database
- Non-blocking (doesn't interrupt user flow)

---

## 🧪 Testing Checklist

**Before going live:**

```bash
☐ Test with GTM in development
  - Install Google Tag Assistant
  - Verify GTM container loads
  - Check tags fire correctly

☐ Test GA tracking
  - Go to GA4 → Realtime
  - Visit website
  - Verify your session appears

☐ Test Meta Pixel
  - Install Meta Pixel Helper
  - Verify pixel fires on page load
  - Check events in Pixel Helper UI

☐ Test Meta cAPI
  - Call trackMetaConversion with testEventCode
  - Check /api/meta/events in Network tab (should be 200)
  - Go to Meta Events Manager → Test Events
  - Verify event appears within 5 seconds

☐ Test Supabase logging
  - Run: SELECT * FROM meta_conversion_events
  - Verify events are logged
  - Check status is 'success'

☐ Test production environment
  - Deploy to production
  - Verify env vars are set
  - Perform test conversion
  - Verify in Meta Events Manager
  - Check Supabase logs
```

---

## 🐛 Troubleshooting

### Nothing Appearing in Meta Events Manager

1. Check `META_CONVERSIONS_API_TOKEN` is correct
2. Verify `NEXT_PUBLIC_META_PIXEL_ID` is correct  
3. Make sure you're using `testEventCode` when testing
4. Check `/api/meta/events` in browser Network tab (should be 200)
5. Check Supabase: `SELECT * FROM meta_conversion_events WHERE status = 'failed'`

### Rate Limited (429 Error)

- Normal if testing aggressively
- Limits reset every 60 seconds
- In production, add exponential backoff retry logic

### Invalid Access Token Error

- Token has expired
- Generate new token from Meta Business Suite
- Not rotated in environment

### Events Not in Supabase

- Check database migration was applied
- Verify table exists: `\dt meta_conversion_events`
- Check user permissions

---

## 📊 Monitoring

### Daily Monitoring

```sql
-- Check success rate
SELECT 
  status,
  COUNT(*) as count,
  COUNT(*) * 100.0 / (SELECT COUNT(*) FROM meta_conversion_events) as percentage
FROM meta_conversion_events
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY status;

-- Check for errors
SELECT error_message, COUNT(*) as count
FROM meta_conversion_events
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '1 day'
GROUP BY error_message
ORDER BY count DESC;
```

### Weekly Analytics

```sql
-- Events by type
SELECT event_name, COUNT(*) as count
FROM meta_conversion_events
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY event_name
ORDER BY count DESC;

-- Top error messages
SELECT error_message, COUNT(*) as count
FROM meta_conversion_events
WHERE status = 'failed'
AND created_at > NOW() - INTERVAL '7 days'
GROUP BY error_message
ORDER BY count DESC LIMIT 5;
```

---

## 🚦 Next Steps

1. **This Week**: Add environment variables and test GTM/GA/Pixel
2. **This Week**: Get Meta Pixel ID and API Token
3. **Next Week**: Deploy cAPI to production
4. **Next Week**: Invite team members to Meta Business Account
5. **Ongoing**: Monitor conversion tracking accuracy

---

## 📚 Documentation Files

- **`docs/MARKETING_ANALYTICS_SETUP.md`** (500 lines)
  - Complete GTM/GA/Pixel setup guide
  - Team member invitations
  - Testing procedures

- **`docs/META_CONVERSIONS_API.md`** (500+ lines)
  - Comprehensive cAPI documentation
  - Architecture explanation
  - Best practices
  - Troubleshooting guide
  - SQL monitoring queries

- **`docs/META_CAPI_QUICK_START.md`** (150 lines)
  - 7-step quick start
  - Code examples
  - Common integration points
  - Verification checklist

---

## 🎯 Why This Approach?

### No Stape.io Needed
- ✅ You own the integration
- ✅ No monthly fees
- ✅ Full control over data
- ✅ Better for privacy/compliance
- ✅ Custom event data possible

### Server-Side is Better
- ✅ Works with ad blockers
- ✅ Works with privacy browsers (Safari, Firefox)
- ✅ Higher conversion accuracy
- ✅ Better deduplication
- ✅ Full audit trail

### Scalable & Production-Ready
- ✅ Rate limiting built-in
- ✅ Error handling & logging
- ✅ Database audit trail
- ✅ Comprehensive documentation
- ✅ Easy to extend

---

## ❓ FAQ

**Q: Do I need all three (GTM, GA, Pixel)?**  
A: No. Start with Meta Pixel + cAPI. GTM/GA optional but recommended.

**Q: Can I use just the Pixel?**  
A: Yes, but cAPI is more reliable. Use both for best results.

**Q: Do I need to track both Browser + cAPI?**  
A: Yes. Pixel for remarketing + browser data, cAPI for conversions + server-side.

**Q: What about GDPR?**  
A: All data hashed. You still need proper consent. See privacy policy.

**Q: Can I track authenticated users only?**  
A: Yes, check for user session before calling `trackMetaConversion`.

**Q: Can I track historical data?**  
A: Yes, Meta accepts events up to 7 days old. Use any timestamp.

---

## 🤝 Need Help?

- **Meta Documentation**: https://developers.facebook.com/docs/marketing-api/conversions-api
- **Meta Events Manager**: https://business.facebook.com/events_manager2
- **Google Tag Manager Docs**: https://support.google.com/tagmanager
- **Pixel Helper Extension**: Available in Chrome Web Store

---

**Last Updated**: November 2025  
**Status**: ✅ Production Ready  
**Maintained by**: Ryan (Development Team)

