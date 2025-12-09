# Granting Lifetime Licenses via Stripe

This guide explains how to grant lifetime licenses to users who purchased through alternative payment methods (e.g., PayPal) or need manual lifetime access grants.

## Overview

The `grant-lifetime-license.js` script creates proper Stripe data (invoice + coupon) that the subscription system automatically detects. The granted licenses are **indistinguishable** from normal lifetime purchases made through the checkout flow.

## When to Use This

Use this script when:
- User purchased lifetime via PayPal (or other non-Stripe payment method)
- Manual lifetime grant needed (promotional, refund-to-lifetime, etc.)
- Need to grant lifetime access without using the NFR table
- User has a Stripe customer ID but no lifetime purchase in Stripe

## Prerequisites

1. User must have a Stripe customer ID (`cus_...`)
2. Environment variables must be set:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_PRICE_ID_LIFETIME`
   - `NEXT_PUBLIC_SITE_URL` (optional, for checkout URLs)

## Usage

### Basic Command

```bash
node grant-lifetime-license.js <email> <customer_id>
```

### Example

```bash
node grant-lifetime-license.js happypower@zonnet.nl cus_TYCvhXd0EU70sE
```

### Finding Customer ID

If you only have the user's email, you can find their customer ID using:

1. **Via Supabase MCP:**
   ```sql
   SELECT email, customer_id 
   FROM public.profiles 
   WHERE email = 'user@example.com';
   ```

2. **Via Stripe Dashboard:**
   - Go to Customers
   - Search by email
   - Copy the customer ID (starts with `cus_`)

3. **Via Stripe API:**
   ```javascript
   const customers = await stripe.customers.list({
     email: 'user@example.com',
     limit: 1
   });
   const customerId = customers.data[0]?.id;
   ```

## What the Script Does

The script creates the following Stripe objects:

1. **100% Off Coupon**
   - One-time use coupon
   - 100% discount
   - Applied to the invoice

2. **Invoice**
   - Contains the lifetime price (`STRIPE_PRICE_ID_LIFETIME`)
   - Has `purchase_type: "lifetime"` metadata (same as normal purchases)
   - Finalized and marked as paid ($0 via coupon)
   - Line items contain the lifetime price ID

3. **Checkout Session** (for reference)
   - Created but not used (since we create invoice directly)
   - Has proper lifetime metadata structure

## How Detection Works

The subscription check (`customerPurchasedProFromSupabase`) automatically detects lifetime licenses by:

1. **Checking Invoices First** (priority)
   - Looks for paid invoices with `purchase_type: "lifetime"` metadata
   - OR invoices with line items containing the lifetime price ID
   - This handles $0 invoices (with coupons) that don't create payment intents

2. **Checking Payment Intents** (fallback)
   - Looks for succeeded payment intents with `purchase_type: "lifetime"` metadata
   - Only needed if invoice check doesn't find anything

3. **Result**
   - Sets `subscription: "lifetime"` in the user's profile
   - Sets `subscription_source: "stripe"`
   - Sets `subscription_expiration: null`

## Verification

After running the script, verify the grant worked:

### 1. Check Invoice in Stripe Dashboard

- Go to Stripe Dashboard → Invoices
- Find the invoice (ID shown in script output)
- Verify:
  - Status: `paid`
  - Amount: `$0.00` (100% off)
  - Metadata: `purchase_type: "lifetime"`
  - Line items: Contains lifetime price

### 2. Check User Profile

```sql
SELECT email, subscription, subscription_source, subscription_expiration
FROM public.profiles
WHERE email = 'user@example.com';
```

Should show:
- `subscription: "lifetime"`
- `subscription_source: "stripe"`
- `subscription_expiration: null`

### 3. Test Subscription Check

The subscription will be automatically detected on:
- Next user login
- Next API call to `/api/auth/refresh`
- Next webhook event
- Manual subscription check

## Common Use Cases

### PayPal Purchase

User purchased lifetime via PayPal, needs Stripe record:

```bash
# 1. Find their Stripe customer ID (or create one if needed)
# 2. Grant lifetime license
node grant-lifetime-license.js user@example.com cus_ABC123
```

### Refund-to-Lifetime Conversion

User requested refund, you're converting to lifetime:

```bash
# Grant lifetime license
node grant-lifetime-license.js user@example.com cus_ABC123

# Then process refund in Stripe/PayPal
```

### Promotional Grant

Giving lifetime access as promotion:

```bash
node grant-lifetime-license.js user@example.com cus_ABC123
```

## Important Notes

1. **No Manual Database Updates Needed**
   - The script creates proper Stripe data
   - Subscription check automatically detects it
   - Don't manually set `subscription = 'lifetime'` in database

2. **Indistinguishable from Normal Purchases**
   - Uses same metadata format (`purchase_type: "lifetime"`)
   - Same invoice structure
   - Appears identical in Stripe dashboard

3. **Multiple Grants**
   - Script can be run multiple times
   - Each run creates a new invoice
   - Subscription check will find any lifetime invoice

4. **Customer ID Required**
   - User must have a Stripe customer ID
   - If they don't have one, they need to sign up first (creates customer ID)

## Troubleshooting

### Script Fails: "Customer not found"
- Verify customer ID is correct
- Check customer exists in Stripe dashboard
- Customer ID format: `cus_...`

### Script Fails: "STRIPE_PRICE_ID_LIFETIME not set"
- Check `.env.local` file has `STRIPE_PRICE_ID_LIFETIME`
- Value should be like `price_1ABC...`

### Subscription Not Detected
- Check invoice was created and is `paid`
- Verify invoice has `purchase_type: "lifetime"` metadata
- Check invoice line items contain lifetime price ID
- Check server logs for `[customerPurchasedProFromSupabase]` messages
- Subscription check runs on login/refresh - user may need to log out and back in

### Invoice Created But Subscription Still "none"
- Wait for subscription check to run (on next login/refresh)
- Or manually trigger: User logs out and back in
- Check server logs for subscription check errors
- Verify invoice is `paid` status in Stripe

## Script Output Example

```
📝 Granting lifetime license to: user@example.com
👤 Customer ID: cus_ABC123
💰 Lifetime Price ID: price_1O8vzICseiqA3Jn4I7o60DKJ

1️⃣ Creating 100% off coupon...
✅ Coupon created: e4MkiD6l

2️⃣ Creating checkout session with lifetime price and 100% coupon...
✅ Checkout session created: cs_live_...
   URL: https://checkout.stripe.com/...

3️⃣ Creating invoice with lifetime price...
✅ Invoice finalized: in_1ScaD4CseiqA3Jn4rM0ATPQ8

4️⃣ Verifying invoice has correct metadata...
✅ Invoice verified:
   ID: in_1ScaD4CseiqA3Jn4rM0ATPQ8
   Status: paid
   Metadata: { purchase_type: 'lifetime' }
   Amount Paid: $0.00
   Has Lifetime Price: true

✅ SUCCESS! Lifetime license granted

📋 Created Stripe Objects:
   Invoice: in_1ScaD4CseiqA3Jn4rM0ATPQ8
   Checkout Session: cs_live_...
   Coupon: e4MkiD6l

📝 How It Works:
   1. Invoice is created with lifetime price and 100% off coupon
   2. Invoice is finalized and marked as paid ($0)
   3. Invoice has lifetime metadata (purchase_type: "lifetime")
   4. Invoice line items contain the lifetime price ID
   5. The subscription check (customerPurchasedProFromSupabase) checks invoices directly
   6. No payment intent needed - invoice check handles $0 invoices
   7. Subscription will be automatically set to "lifetime" on next check
```

## Related Files

- `grant-lifetime-license.js` - The script that grants licenses
- `utils/stripe/supabase-stripe.ts` - Subscription check logic
- `utils/subscriptions/check-subscription.ts` - Main subscription check function
- `app/api/stripe/checkout/route.ts` - Normal checkout flow (for reference)

## Support

If you encounter issues:
1. Check server logs for `[customerPurchasedProFromSupabase]` messages
2. Verify invoice in Stripe dashboard
3. Check user profile in database
4. Test subscription check by having user log out/in
