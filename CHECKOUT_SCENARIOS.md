# Complete Checkout & Subscription Scenarios

This document outlines EVERY possible scenario for purchasing/subscribing to Cymasphere Pro.

---

## Scenario Categories

1. **User Authentication Status**
   - Logged In
   - Not Logged In

2. **Trial History**
   - Never Had Trial
   - Has Had Trial Before
   - Currently Trialing

3. **Plan Types**
   - Monthly Subscription
   - Annual Subscription
   - Lifetime (One-time Payment)

4. **Payment Method Collection**
   - With Payment Method (14-day trial)
   - Without Payment Method (7-day trial)

---

## SCENARIO 1: Logged In User - First Time - Monthly - No Payment Method (7-Day Trial)

**User State:**
- ✅ Logged in
- ❌ Never had a trial
- ❌ No active subscription
- Plan: Monthly
- Payment Method: Not collected

**Checkout Flow:**
1. User clicks "Start Free Trial" (no card required)
2. `collectPaymentMethod = false`
3. `hasHadTrial = false`
4. Stripe creates subscription with `trial_period_days: 7`
5. No payment collected
6. Subscription status: `trialing`

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!"
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your free trial has been successfully started. Explore all premium features with no payment required during your trial period."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === 7`
- `subscription.trial_end` exists (7 days from now)
- `subscription.status === "trialing"`
- `sessionResult.amountTotal === 0` or `null`

**Billing Page:**
- Shows "Monthly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - 7 days left"
- Trial expires in 7 days
- Next billing date: 7 days from now

---

## SCENARIO 2: Logged In User - First Time - Monthly - With Payment Method (14-Day Trial)

**User State:**
- ✅ Logged in
- ❌ Never had a trial
- ❌ No active subscription
- Plan: Monthly
- Payment Method: Collected

**Checkout Flow:**
1. User clicks "Start Trial with Card"
2. `collectPaymentMethod = true`
3. `hasHadTrial = false`
4. Stripe creates subscription with `trial_period_days: 14`
5. Payment method collected but NOT charged
6. Subscription status: `trialing`

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!"
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your free trial has been successfully started. Explore all premium features with no payment required during your trial period."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === 14`
- `subscription.trial_end` exists (14 days from now)
- `subscription.status === "trialing"`
- `sessionResult.amountTotal === 0` or `null` (no charge yet)

**Billing Page:**
- Shows "Monthly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - 14 days left"
- Trial expires in 14 days
- Next billing date: 14 days from now

---

## SCENARIO 3: Logged In User - First Time - Annual - No Payment Method (7-Day Trial)

**User State:**
- ✅ Logged in
- ❌ Never had a trial
- ❌ No active subscription
- Plan: Annual
- Payment Method: Not collected

**Checkout Flow:**
1. User clicks "Start Free Trial" (no card required)
2. `collectPaymentMethod = false`
3. `hasHadTrial = false`
4. Stripe creates subscription with `trial_period_days: 7`
5. No payment collected
6. Subscription status: `trialing`

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!"
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your free trial has been successfully started. Explore all premium features with no payment required during your trial period."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === 7`
- `subscription.trial_end` exists (7 days from now)
- `subscription.status === "trialing"`

**Billing Page:**
- Shows "Yearly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - 7 days left"
- Trial expires in 7 days
- Next billing date: 7 days from now

---

## SCENARIO 4: Logged In User - First Time - Annual - With Payment Method (14-Day Trial)

**User State:**
- ✅ Logged in
- ❌ Never had a trial
- ❌ No active subscription
- Plan: Annual
- Payment Method: Collected

**Checkout Flow:**
1. User clicks "Start Trial with Card"
2. `collectPaymentMethod = true`
3. `hasHadTrial = false`
4. Stripe creates subscription with `trial_period_days: 14`
5. Payment method collected but NOT charged
6. Subscription status: `trialing`

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!"
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your free trial has been successfully started. Explore all premium features with no payment required during your trial period."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === 14`
- `subscription.trial_end` exists (14 days from now)
- `subscription.status === "trialing"`

**Billing Page:**
- Shows "Yearly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - 14 days left"
- Trial expires in 14 days
- Next billing date: 14 days from now

---

## SCENARIO 5: Logged In User - Has Had Trial - Monthly - Immediate Charge

**User State:**
- ✅ Logged in
- ✅ Has had a trial before
- ❌ No active subscription
- Plan: Monthly
- Payment Method: Required (always)

**Checkout Flow:**
1. User clicks "Subscribe"
2. `collectPaymentMethod = true` (forced)
3. `hasHadTrial = true`
4. Stripe creates subscription with NO `trial_period_days`
5. Payment method collected AND charged immediately
6. Subscription status: `active`

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. You now have full access to Cymasphere Pro."
- No Trial Info Box
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === undefined` (not set)
- `subscription.trial_end === null` (no trial)
- `subscription.status === "active"`
- `sessionResult.amountTotal > 0` (payment collected)

**Billing Page:**
- Shows "Monthly" plan type
- No Trial Badge
- Shows price: "$6 / month"
- Next billing date: 1 month from now

---

## SCENARIO 6: Logged In User - Has Had Trial - Annual - Immediate Charge

**User State:**
- ✅ Logged in
- ✅ Has had a trial before
- ❌ No active subscription
- Plan: Annual
- Payment Method: Required (always)

**Checkout Flow:**
1. User clicks "Subscribe"
2. `collectPaymentMethod = true` (forced)
3. `hasHadTrial = true`
4. Stripe creates subscription with NO `trial_period_days`
5. Payment method collected AND charged immediately
6. Subscription status: `active`

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. You now have full access to Cymasphere Pro."
- No Trial Info Box
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === undefined`
- `subscription.trial_end === null`
- `subscription.status === "active"`
- `sessionResult.amountTotal > 0`

**Billing Page:**
- Shows "Yearly" plan type
- No Trial Badge
- Shows price: "$59 / year"
- Next billing date: 1 year from now

---

## SCENARIO 7: Logged In User - Currently Trialing - Upgrade to Lifetime

**User State:**
- ✅ Logged in
- ✅ Currently trialing (7 or 14 days)
- ✅ Active trial subscription
- Plan: Lifetime
- Payment Method: Required

**Checkout Flow:**
1. User clicks "Upgrade to Lifetime"
2. `planType = "lifetime"`
3. `mode = "payment"` (one-time)
4. Stripe creates one-time payment
5. Payment collected and charged immediately
6. Old trial subscription is canceled
7. New lifetime purchase is recorded

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. You now have full access to Cymasphere Pro."
- No Trial Info Box
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "payment"` (not subscription)
- `isTrial = false` (lifetime is not a trial)
- `isLifetime = true`
- `sessionResult.amountTotal > 0`

**Billing Page:**
- Shows "Lifetime" plan type
- No Trial Badge
- Shows: "Full access to all features forever with free updates"
- No next billing date

---

## SCENARIO 8: Logged In User - Active Subscription - Change Plan (Monthly to Annual)

**User State:**
- ✅ Logged in
- ✅ Has active monthly subscription
- Plan Change: Monthly → Annual
- Payment Method: Already on file

**Checkout Flow:**
1. User clicks "Change Plan" → Selects Annual
2. `isPlanChange = true`
3. `hasHadTrial = true` (they have a subscription)
4. Stripe creates new checkout session
5. User confirms plan change
6. Old subscription is updated to annual
7. Prorated charge/credit applied

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. You now have full access to Cymasphere Pro."
- No Trial Info Box
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `isPlanChange = true` (no trial on plan changes)
- `subscription.trial_end === null`
- `subscription.status === "active"`

**Billing Page:**
- Shows "Yearly" plan type
- No Trial Badge
- Shows price: "$59 / year"
- Next billing date: 1 year from now

---

## SCENARIO 9: Logged In User - Active Subscription - Change Plan (Annual to Monthly)

**User State:**
- ✅ Logged in
- ✅ Has active annual subscription
- Plan Change: Annual → Monthly
- Payment Method: Already on file

**Checkout Flow:**
1. User clicks "Change Plan" → Selects Monthly
2. `isPlanChange = true`
3. Stripe creates new checkout session
4. User confirms plan change
5. Old subscription is updated to monthly
6. Prorated charge/credit applied

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. You now have full access to Cymasphere Pro."
- No Trial Info Box
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `isPlanChange = true`
- `subscription.trial_end === null`
- `subscription.status === "active"`

**Billing Page:**
- Shows "Monthly" plan type
- No Trial Badge
- Shows price: "$6 / month"
- Next billing date: 1 month from now

---

## SCENARIO 10: Logged In User - Active Subscription - Upgrade to Lifetime

**User State:**
- ✅ Logged in
- ✅ Has active monthly/annual subscription
- Plan: Lifetime
- Payment Method: May or may not be on file

**Checkout Flow:**
1. User clicks "Upgrade to Lifetime"
2. `planType = "lifetime"`
3. `mode = "payment"` (one-time)
4. Stripe creates one-time payment
5. Payment collected and charged immediately
6. Old subscription is canceled
7. New lifetime purchase is recorded

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. You now have full access to Cymasphere Pro."
- No Trial Info Box
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "payment"`
- `isTrial = false`
- `isLifetime = true`
- `sessionResult.amountTotal > 0`

**Billing Page:**
- Shows "Lifetime" plan type
- No Trial Badge
- Shows: "Full access to all features forever with free updates"
- No next billing date

---

## SCENARIO 11: NOT Logged In - First Time - Monthly - No Payment Method (7-Day Trial)

**User State:**
- ❌ Not logged in
- ❌ Never had a trial (unknown, but treated as first time)
- Plan: Monthly
- Payment Method: Not collected

**Checkout Flow:**
1. User enters email
2. Stripe customer created/found by email
3. User clicks "Start Free Trial" (no card required)
4. `collectPaymentMethod = false`
5. `hasHadTrial = false` (checked by email)
6. Stripe creates subscription with `trial_period_days: 7`
7. No payment collected
8. Subscription status: `trialing`

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!"
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your free trial has been successfully started. Check your email to create your account and start exploring all premium features - no payment required during your trial period."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Invite Message: "Account Invitation Sent! We've sent an invitation email to [email]. Please check your inbox (and spam folder) and click the link to set your password and access your account."
- No Buttons (user must wait for email)

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === 7`
- `subscription.trial_end` exists
- `subscription.status === "trialing"`
- `sessionResult.amountTotal === 0` or `null`

**After User Creates Account:**
- Billing Page shows "Monthly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - X days left"
- Trial expires in X days
- Next billing date: X days from now

---

## SCENARIO 12: NOT Logged In - First Time - Monthly - With Payment Method (14-Day Trial)

**User State:**
- ❌ Not logged in
- ❌ Never had a trial
- Plan: Monthly
- Payment Method: Collected

**Checkout Flow:**
1. User enters email
2. Stripe customer created/found by email
3. User clicks "Start Trial with Card"
4. `collectPaymentMethod = true`
5. `hasHadTrial = false`
6. Stripe creates subscription with `trial_period_days: 14`
7. Payment method collected but NOT charged
8. Subscription status: `trialing`

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!"
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your free trial has been successfully started. Check your email to create your account and start exploring all premium features - no payment required during your trial period."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Invite Message: "Account Invitation Sent! We've sent an invitation email to [email]. Please check your inbox (and spam folder) and click the link to set your password and access your account."
- No Buttons (user must wait for email)

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === 14`
- `subscription.trial_end` exists (14 days from now)
- `subscription.status === "trialing"`

**After User Creates Account:**
- Billing Page shows "Monthly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - X days left"
- Trial expires in X days
- Next billing date: X days from now

---

## SCENARIO 13: NOT Logged In - First Time - Annual - No Payment Method (7-Day Trial)

**User State:**
- ❌ Not logged in
- ❌ Never had a trial
- Plan: Annual
- Payment Method: Not collected

**Checkout Flow:**
1. User enters email
2. Stripe customer created/found by email
3. User clicks "Start Free Trial" (no card required)
4. `collectPaymentMethod = false`
5. `hasHadTrial = false`
6. Stripe creates subscription with `trial_period_days: 7`
7. No payment collected
8. Subscription status: `trialing`

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!"
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your free trial has been successfully started. Check your email to create your account and start exploring all premium features - no payment required during your trial period."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Invite Message: "Account Invitation Sent!"
- No Buttons

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === 7`
- `subscription.trial_end` exists
- `subscription.status === "trialing"`

**After User Creates Account:**
- Billing Page shows "Yearly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - X days left"
- Trial expires in X days
- Next billing date: X days from now

---

## SCENARIO 14: NOT Logged In - First Time - Annual - With Payment Method (14-Day Trial)

**User State:**
- ❌ Not logged in
- ❌ Never had a trial
- Plan: Annual
- Payment Method: Collected

**Checkout Flow:**
1. User enters email
2. Stripe customer created/found by email
3. User clicks "Start Trial with Card"
4. `collectPaymentMethod = true`
5. `hasHadTrial = false`
6. Stripe creates subscription with `trial_period_days: 14`
7. Payment method collected but NOT charged
8. Subscription status: `trialing`

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!"
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your free trial has been successfully started. Check your email to create your account and start exploring all premium features - no payment required during your trial period."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Invite Message: "Account Invitation Sent!"
- No Buttons

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === 14`
- `subscription.trial_end` exists (14 days from now)
- `subscription.status === "trialing"`

**After User Creates Account:**
- Billing Page shows "Yearly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - X days left"
- Trial expires in X days
- Next billing date: X days from now

---

## SCENARIO 15: NOT Logged In - Has Had Trial (by Email) - Monthly - Immediate Charge

**User State:**
- ❌ Not logged in
- ✅ Has had a trial before (detected by email → customer_id → subscription history)
- Plan: Monthly
- Payment Method: Required (always)

**Checkout Flow:**
1. User enters email
2. Stripe customer found by email
3. `hasHadTrial = true` (checked from customer's subscription history)
4. User clicks "Subscribe"
5. `collectPaymentMethod = true` (forced)
6. Stripe creates subscription with NO `trial_period_days`
7. Payment method collected AND charged immediately
8. Subscription status: `active`

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. Check your email to create your account and access Cymasphere Pro."
- No Trial Info Box
- Invite Message: "Account Invitation Sent!"
- No Buttons (user must wait for email)

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === undefined`
- `subscription.trial_end === null`
- `subscription.status === "active"`
- `sessionResult.amountTotal > 0`

**After User Creates Account:**
- Billing Page shows "Monthly" plan type
- No Trial Badge
- Shows price: "$6 / month"
- Next billing date: 1 month from now

---

## SCENARIO 16: NOT Logged In - Has Had Trial (by Email) - Annual - Immediate Charge

**User State:**
- ❌ Not logged in
- ✅ Has had a trial before
- Plan: Annual
- Payment Method: Required (always)

**Checkout Flow:**
1. User enters email
2. Stripe customer found by email
3. `hasHadTrial = true`
4. User clicks "Subscribe"
5. `collectPaymentMethod = true` (forced)
6. Stripe creates subscription with NO `trial_period_days`
7. Payment method collected AND charged immediately
8. Subscription status: `active`

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. Check your email to create your account and access Cymasphere Pro."
- No Trial Info Box
- Invite Message: "Account Invitation Sent!"
- No Buttons

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === undefined`
- `subscription.trial_end === null`
- `subscription.status === "active"`
- `sessionResult.amountTotal > 0`

**After User Creates Account:**
- Billing Page shows "Yearly" plan type
- No Trial Badge
- Shows price: "$59 / year"
- Next billing date: 1 year from now

---

## SCENARIO 17: NOT Logged In - Lifetime Purchase

**User State:**
- ❌ Not logged in
- Plan: Lifetime
- Payment Method: Required

**Checkout Flow:**
1. User enters email
2. Stripe customer created/found by email
3. User clicks "Buy Lifetime"
4. `planType = "lifetime"`
5. `mode = "payment"` (one-time)
6. Stripe creates one-time payment
7. Payment collected and charged immediately
8. No subscription created (one-time payment)

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. Check your email to create your account and access Cymasphere Pro."
- No Trial Info Box
- Invite Message: "Account Invitation Sent!"
- No Buttons

**Trial Detection:**
- `sessionResult.mode === "payment"` (not subscription)
- `isTrial = false`
- `isLifetime = true`
- `sessionResult.amountTotal > 0`

**After User Creates Account:**
- Billing Page shows "Lifetime" plan type
- No Trial Badge
- Shows: "Full access to all features forever with free updates"
- No next billing date

---

## SCENARIO 18: Logged In User - Currently Trialing - Change Plan (Monthly to Annual)

**User State:**
- ✅ Logged in
- ✅ Currently trialing monthly (7 or 14 days remaining)
- Plan Change: Monthly → Annual
- Payment Method: May or may not be on file

**Checkout Flow:**
1. User clicks "Change Plan" → Selects Annual
2. `isPlanChange = true`
3. Stripe creates new checkout session
4. User confirms plan change
5. Old trial subscription is updated to annual
6. Trial period continues (same trial_end date)
7. No immediate charge (still in trial)

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!" (still in trial)
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your plan has been updated. Your free trial continues with the annual plan."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `isPlanChange = true`
- `subscription.trial_end` still exists (trial continues)
- `subscription.status === "trialing"`

**Billing Page:**
- Shows "Yearly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - X days left"
- Trial expires in X days (original trial end date)
- Next billing date: X days from now (when trial ends)

---

## SCENARIO 19: Logged In User - Currently Trialing - Change Plan (Annual to Monthly)

**User State:**
- ✅ Logged in
- ✅ Currently trialing annual (7 or 14 days remaining)
- Plan Change: Annual → Monthly
- Payment Method: May or may not be on file

**Checkout Flow:**
1. User clicks "Change Plan" → Selects Monthly
2. `isPlanChange = true`
3. Stripe creates new checkout session
4. User confirms plan change
5. Old trial subscription is updated to monthly
6. Trial period continues (same trial_end date)
7. No immediate charge (still in trial)

**Checkout Success Page:**
- Title: "🎉 Free Trial Activated!" (still in trial)
- Subtitle: "Welcome to Cymasphere Pro - No Charge Today"
- Message: "Your plan has been updated. Your free trial continues with the monthly plan."
- Trial Info Box: "✨ Zero Cost Trial - You will NOT be charged during your trial period"
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `isPlanChange = true`
- `subscription.trial_end` still exists
- `subscription.status === "trialing"`

**Billing Page:**
- Shows "Monthly" plan type
- Trial Badge: "🎉 You're on a FREE TRIAL - X days left"
- Trial expires in X days
- Next billing date: X days from now

---

## SCENARIO 20: Logged In User - Active Subscription (Post-Trial) - Cancel Then Resubscribe

**User State:**
- ✅ Logged in
- ✅ Had active subscription (trial ended, was paying)
- ✅ Canceled subscription
- ❌ No active subscription now
- Plan: Monthly or Annual
- Payment Method: May or may not be on file

**Checkout Flow:**
1. User clicks "Subscribe"
2. `hasHadTrial = true` (they had a trial before)
3. `collectPaymentMethod = true` (forced - no trial for returning users)
4. Stripe creates subscription with NO `trial_period_days`
5. Payment method collected AND charged immediately
6. Subscription status: `active`

**Checkout Success Page:**
- Title: "Payment Successful!"
- Subtitle: "Thank you for your purchase"
- Message: "Your payment has been processed successfully. You now have full access to Cymasphere Pro."
- No Trial Info Box
- Buttons: "Downloads" + "Getting Started"

**Trial Detection:**
- `sessionResult.mode === "subscription"`
- `sessionResult.subscriptionData.trial_period_days === undefined`
- `subscription.trial_end === null`
- `subscription.status === "active"`
- `sessionResult.amountTotal > 0`

**Billing Page:**
- Shows plan type (Monthly or Yearly)
- No Trial Badge
- Shows price
- Next billing date: 1 month/year from now

---

## Summary Table

| Scenario | Logged In | Trial History | Plan | Payment Method | Trial Days | Success Page Title | Trial Badge |
|----------|-----------|--------------|------|----------------|------------|-------------------|-------------|
| 1 | ✅ | Never | Monthly | No | 7 | Free Trial Activated | ✅ |
| 2 | ✅ | Never | Monthly | Yes | 14 | Free Trial Activated | ✅ |
| 3 | ✅ | Never | Annual | No | 7 | Free Trial Activated | ✅ |
| 4 | ✅ | Never | Annual | Yes | 14 | Free Trial Activated | ✅ |
| 5 | ✅ | Had Before | Monthly | Yes | 0 | Payment Successful | ❌ |
| 6 | ✅ | Had Before | Annual | Yes | 0 | Payment Successful | ❌ |
| 7 | ✅ | Trialing | Lifetime | Yes | N/A | Payment Successful | ❌ |
| 8 | ✅ | Active Sub | Monthly→Annual | Yes | 0 | Payment Successful | ❌ |
| 9 | ✅ | Active Sub | Annual→Monthly | Yes | 0 | Payment Successful | ❌ |
| 10 | ✅ | Active Sub | Lifetime | Yes | N/A | Payment Successful | ❌ |
| 11 | ❌ | Never | Monthly | No | 7 | Free Trial Activated | ✅ |
| 12 | ❌ | Never | Monthly | Yes | 14 | Free Trial Activated | ✅ |
| 13 | ❌ | Never | Annual | No | 7 | Free Trial Activated | ✅ |
| 14 | ❌ | Never | Annual | Yes | 14 | Free Trial Activated | ✅ |
| 15 | ❌ | Had Before | Monthly | Yes | 0 | Payment Successful | ❌ |
| 16 | ❌ | Had Before | Annual | Yes | 0 | Payment Successful | ❌ |
| 17 | ❌ | N/A | Lifetime | Yes | N/A | Payment Successful | ❌ |
| 18 | ✅ | Trialing | Monthly→Annual | Maybe | Continue | Free Trial Activated | ✅ |
| 19 | ✅ | Trialing | Annual→Monthly | Maybe | Continue | Free Trial Activated | ✅ |
| 20 | ✅ | Had Before | Monthly/Annual | Yes | 0 | Payment Successful | ❌ |

---

## Key Detection Logic

### Trial Detection (in checkout-result route):
```typescript
// 1. Check session subscription_data.trial_period_days
if (sessionResult.subscriptionData?.trial_period_days) {
  isTrial = true;
}

// 2. Retrieve subscription and check trial_end
if (subscriptionId) {
  subscription = await stripe.subscriptions.retrieve(subscriptionId);
  if (subscription.trial_end) {
    isTrial = true; // DEFINITIVE - if trial_end exists, it's a trial
  } else if (subscription.status === "trialing") {
    isTrial = true; // Status is explicitly trialing
  }
}
```

### Success Page Display Logic:
```typescript
if (isTrial) {
  // Show "Free Trial Activated!"
} else {
  // Show "Payment Successful!"
}
```

### Billing Page Display Logic:
```typescript
if (isInTrialPeriod && daysLeftInTrial > 0) {
  // Show Trial Badge with days remaining
  // Show plan type (Monthly/Yearly)
} else {
  // Show regular subscription info
  // No trial badge
}
```

---

## Edge Cases

1. **Trial Expired But Subscription Not Yet Active**: User's trial ended but subscription hasn't been charged yet (past_due status)
   - Billing page: No trial badge, shows subscription status

2. **Trial Expired, Payment Failed**: Trial ended but payment method failed
   - Billing page: Shows "Past Due" status, no trial badge

3. **Multiple Active Subscriptions**: User somehow has multiple subscriptions (should be prevented, but handled)
   - System keeps most recent, cancels others

4. **Subscription Created But Webhook Not Processed**: Race condition where subscription exists but profile not updated
   - `updateUserProStatus` is called to refresh immediately

5. **User Logs In After Trial Started**: User started trial while logged out, then logs in
   - Profile is updated via `inviteUserAndRefreshProStatus` or webhook

---

## Testing Checklist

- [ ] Logged in, first time, monthly, no payment method → Shows "Free Trial Activated"
- [ ] Logged in, first time, monthly, with payment method → Shows "Free Trial Activated"
- [ ] Logged in, first time, annual, no payment method → Shows "Free Trial Activated"
- [ ] Logged in, first time, annual, with payment method → Shows "Free Trial Activated"
- [ ] Logged in, had trial, monthly → Shows "Payment Successful"
- [ ] Logged in, had trial, annual → Shows "Payment Successful"
- [ ] Logged in, trialing, upgrade to lifetime → Shows "Payment Successful"
- [ ] Logged in, active subscription, change plan → Shows "Payment Successful"
- [ ] Not logged in, first time, monthly, no payment method → Shows "Free Trial Activated" + invite
- [ ] Not logged in, first time, monthly, with payment method → Shows "Free Trial Activated" + invite
- [ ] Not logged in, first time, annual, no payment method → Shows "Free Trial Activated" + invite
- [ ] Not logged in, first time, annual, with payment method → Shows "Free Trial Activated" + invite
- [ ] Not logged in, had trial, monthly → Shows "Payment Successful" + invite
- [ ] Not logged in, had trial, annual → Shows "Payment Successful" + invite
- [ ] Not logged in, lifetime → Shows "Payment Successful" + invite
- [ ] Billing page shows trial badge when trialing
- [ ] Billing page shows correct days remaining
- [ ] Billing page shows plan type (Monthly/Yearly) even during trial
- [ ] Billing page shows no trial badge when not trialing

---

**Last Updated:** 2025-12-28
**Version:** 1.0
