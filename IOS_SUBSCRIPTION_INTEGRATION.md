# iOS In-App Purchase Integration with Supabase/Stripe

This document describes the integration of iOS StoreKit in-app purchases with the existing Stripe/Supabase subscription system.

## Overview

The system now supports subscriptions from two sources:
1. **Stripe** - Web-based subscriptions (existing)
2. **iOS StoreKit** - Native iOS in-app purchases (new)

Both subscription types are stored in Supabase and the system automatically determines the user's active subscription by checking both sources.

## Architecture

### Database Schema

A new table `ios_subscriptions` tracks iOS purchases:
- `transaction_id` - Unique StoreKit transaction ID
- `original_transaction_id` - For subscription renewals
- `product_id` - App Store Connect product ID
- `subscription_type` - Maps to subscription_type enum (monthly, annual, lifetime)
- `receipt_data` - Base64 encoded receipt for validation
- `expires_date` - Subscription expiration
- `is_active` - Whether subscription is currently active
- `validation_status` - Receipt validation status

### API Endpoint

**POST `/api/ios/validate-receipt`**

Validates iOS receipts with Apple's App Store and syncs to Supabase.

**Request:**
```json
{
  "receiptData": "base64_encoded_receipt",
  "accessToken": "optional_user_access_token",
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "type": "monthly|annual|lifetime",
    "expiresDate": "2025-12-31T00:00:00Z",
    "isActive": true,
    "transactionId": "1000000123456789"
  }
}
```

### iOS App Integration

#### StoreKitManager Updates

1. **Receipt Validation**: After successful purchase, automatically validates receipt with server
2. **Authentication**: Includes user's access token in validation request if available
3. **Subscription Sync**: Server updates user's profile with subscription status

#### Purchase Flow

1. User initiates purchase in iOS app
2. StoreKit processes payment
3. On success, app retrieves receipt data
4. App calls `/api/ios/validate-receipt` with receipt
5. Server validates with Apple
6. Server stores subscription in `ios_subscriptions` table
7. Server updates user's `profiles.subscription` field
8. App receives confirmation and updates UI

### Subscription Priority

When checking user subscriptions, the system uses this priority:
1. **Lifetime** (highest)
2. **Annual**
3. **Monthly**
4. **None** (lowest)

If user has subscriptions from both Stripe and iOS, the higher priority subscription is used.

### Product ID Mapping

iOS product IDs map to subscription types:
- `com.NNAudio.Cymasphere.basic` → `lifetime`
- `com.NNAudio.Cymasphere.monthly.plan` → `monthly`
- `com.NNAudio.Cymasphere.annual.plan` → `annual`

## Setup Instructions

### 1. Environment Variables

Add to `.env`:
```bash
APPLE_SHARED_SECRET=your_apple_shared_secret_from_app_store_connect
```

### 2. Database Migration

Run the migration:
```bash
cd cymasphere-website
supabase db push
```

Or manually apply:
```bash
psql -f supabase/migrations/20250130000000_add_ios_subscriptions.sql
```

### 3. App Store Connect Configuration

1. Create subscription products in App Store Connect
2. Configure product IDs to match the mapping above
3. Set up subscription groups
4. Configure pricing and availability

### 4. Testing

#### Sandbox Testing
- Use sandbox test accounts in App Store Connect
- Receipts will be validated against Apple's sandbox environment
- The API automatically handles sandbox/production switching

#### Production Testing
- Test with real purchases (refundable within 14 days)
- Monitor `ios_subscriptions` table for successful validations
- Check user profiles for updated subscription status

## Authentication Flow

When a user logs in:

1. Standard Supabase authentication
2. Check Stripe subscription (existing)
3. **NEW**: Check iOS subscriptions
4. Merge results and use highest priority subscription
5. Update profile with final subscription status
6. Return subscription info to client

## Receipt Validation

### Apple Validation

The server validates receipts with Apple's App Store using:
- Production URL: `https://buy.itunes.apple.com/verifyReceipt`
- Sandbox URL: `https://sandbox.itunes.apple.com/verifyReceipt`

The system automatically retries with sandbox if production validation returns status 21007.

### Receipt Storage

- Receipts are stored as Base64 strings in `ios_subscriptions.receipt_data`
- Original Apple validation response stored in `apple_validation_response` JSONB field
- Receipts can be re-validated periodically to check for cancellations/refunds

## Subscription Status Checking

### Utility Function

Use `checkUserSubscription()` from `@/utils/subscriptions/check-subscription`:

```typescript
import { checkUserSubscription } from "@/utils/subscriptions/check-subscription";

const result = await checkUserSubscription(userId);
// Returns: { subscription, subscriptionExpiration, source: "stripe" | "ios" | "none" }
```

This function:
1. Checks iOS subscriptions
2. Checks Stripe subscriptions
3. Returns highest priority subscription
4. Updates user's profile automatically

## Monitoring

### Key Metrics

- `ios_subscriptions` table size
- Validation success/failure rates
- Subscription expiration dates
- Active vs expired subscriptions

### Logging

The API endpoint logs:
- Receipt validation attempts
- Apple API responses
- Subscription updates
- Errors and failures

## Troubleshooting

### Receipt Validation Fails

1. Check `APPLE_SHARED_SECRET` is correct
2. Verify receipt is Base64 encoded correctly
3. Check Apple's status codes in logs
4. Ensure product IDs match App Store Connect

### Subscription Not Updating

1. Check `ios_subscriptions` table for new records
2. Verify `validation_status` is "valid"
3. Check `is_active` is true
4. Verify `expires_date` is in the future
5. Check user's profile was updated

### Duplicate Subscriptions

- System uses `transaction_id` as unique constraint
- Duplicate transactions are updated, not inserted
- Check for `original_transaction_id` matches for renewals

## Security Considerations

1. **Receipt Validation**: Always validate on server, never trust client
2. **Access Tokens**: Receipt validation includes user auth token for security
3. **RLS Policies**: iOS subscriptions table has proper RLS policies
4. **Rate Limiting**: Consider adding rate limiting to validation endpoint

## Future Enhancements

- [ ] Periodic receipt re-validation for subscription status
- [ ] Webhook support for App Store Server Notifications
- [ ] Subscription renewal tracking
- [ ] Cancellation/refund handling
- [ ] Subscription upgrade/downgrade flows


