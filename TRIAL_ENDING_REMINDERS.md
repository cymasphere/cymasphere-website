# Trial Ending Reminder Emails

This system automatically sends reminder emails to users before their free trial ends, prompting them to add a payment method.

## Overview

- **14-day trials**: Sends reminder 7 days before trial ends
- **7-day trials**: Sends reminder 4 days before trial ends
- **Format**: Matches the welcome email template style and formatting
- **Automation**: Runs daily via cron job at 9 AM UTC

## Implementation

### Files Created

1. **`utils/email-campaigns/trial-ending-reminder.ts`**
   - Email template generator (HTML and plain text)
   - Matches welcome email formatting and styling
   - Includes Stripe update payment method button

2. **`app/api/trial-ending-reminders/send/route.ts`**
   - API endpoint that finds subscriptions with trials ending soon
   - Sends reminder emails via AWS SES
   - Generates Stripe billing portal URLs for payment method updates

3. **`vercel.json`** (updated)
   - Added daily cron job: `0 9 * * *` (9 AM UTC daily)
   - Calls `/api/trial-ending-reminders/send`

## How It Works

1. **Daily Cron Job**: Runs at 9 AM UTC every day
2. **Subscription Lookup**: Queries Stripe for all `trialing` subscriptions
3. **Date Calculation**: 
   - Calculates days until trial end
   - Determines trial duration (7 or 14 days)
   - Checks if reminder should be sent based on timing
4. **Email Sending**: 
   - Finds user in database by customer_id or email
   - Generates personalized email with trial end date
   - Creates Stripe billing portal session URL
   - Sends email via AWS SES

## Email Content

The email includes:
- Trial end date (formatted: "January 16, 2026")
- Plan name and pricing information
- "Update payment method" button linking to Stripe billing portal
- Support contact information
- Footer with links (Support, Terms, Privacy)

## Testing

### Manual Test (Dry Run)

```bash
curl -X POST "http://localhost:3000/api/trial-ending-reminders/send?dryRun=true" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

This will show what emails would be sent without actually sending them.

### Manual Test (Send Real Emails)

```bash
curl -X POST "http://localhost:3000/api/trial-ending-reminders/send" \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

### Check Logs

The endpoint returns detailed information:
```json
{
  "success": true,
  "processed": 10,
  "sent": 5,
  "errors": 0,
  "details": [
    {
      "subscriptionId": "sub_xxx",
      "customerEmail": "user@example.com",
      "trialEndDate": "2026-01-16T00:00:00.000Z",
      "reminderType": "14-day trial (7 days before)",
      "status": "sent"
    }
  ]
}
```

## Timing Logic

- **14-day trials**: Sends when trial ends in 6.5-7.5 days (7 days ± 12 hours)
- **7-day trials**: Sends when trial ends in 3.5-4.5 days (4 days ± 12 hours)

The ±12 hour window accounts for cron job timing variations.

## Stripe Billing Portal URL

The email includes a button that links to Stripe's billing portal where users can:
- Add or update payment method
- View subscription details
- Manage billing

The URL is generated using Stripe's billing portal session API with a return URL that includes `referer=free_trial_ending` for tracking.

## Environment Variables

Required:
- `STRIPE_SECRET_KEY`: Stripe API secret key
- `CRON_SECRET`: Secret for authenticating cron job calls
- `NEXT_PUBLIC_SITE_URL`: Base URL for return links
- `AWS_ACCESS_KEY_ID`: AWS credentials for SES
- `AWS_SECRET_ACCESS_KEY`: AWS credentials for SES

## Monitoring

Check the logs for:
- `✅ Sent trial ending reminder to {email} ({reminderType})`
- `⚠️ Skipping subscription {id}: {reason}`
- `❌ Error processing subscription {id}: {error}`

## Future Enhancements

Potential improvements:
1. Add tracking table to prevent duplicate sends
2. Add retry logic for failed sends
3. Add admin dashboard to view sent reminders
4. Add A/B testing for email content
5. Add unsubscribe handling
