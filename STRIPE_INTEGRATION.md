# Stripe Integration for Cymasphere

This document explains how to set up and configure the Stripe payment integration for the Cymasphere application.

## Setup Instructions

### 1. Create a Stripe Account

If you don't already have one, sign up for a Stripe account at [stripe.com](https://stripe.com).

### 2. Get API Keys

1. Go to the [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
2. Copy your **Publishable Key** and **Secret Key**
   - For development, use the **test** keys
   - For production, use the **live** keys

### 3. Create Products and Prices

1. In your Stripe Dashboard, go to **Products**
2. Create products for each of your plans:
   - Monthly Subscription
   - Yearly Subscription
   - Lifetime (one-time payment)
3. For each product, create a price:
   - Monthly: Recurring, billed monthly
   - Yearly: Recurring, billed yearly
   - Lifetime: One-time payment
4. Note the **Price ID** for each plan (format: `price_xxxxxxxxxxxxxxxx`)

### 4. Set Up Environment Variables

1. Copy the `.env.example` file to `.env`
2. Update the following values:
   ```
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_YourTestPublishableKey
   REACT_APP_STRIPE_SECRET_KEY=sk_test_YourTestSecretKey
   REACT_APP_STRIPE_PRICE_MONTHLY=price_id_for_monthly_subscription
   REACT_APP_STRIPE_PRICE_YEARLY=price_id_for_yearly_subscription
   REACT_APP_STRIPE_PRICE_LIFETIME=price_id_for_lifetime_purchase
   ```

### 5. Set Up Webhook (Optional for Development)

For handling successful payments and updating user subscriptions automatically:

1. In your Stripe Dashboard, go to **Developers > Webhooks**
2. Add an endpoint that points to your backend URL: `https://your-backend.com/api/stripe-webhook`
3. Select the following events to listen for:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
4. Copy the **Signing Secret** and add it to your `.env` file:
   ```
   REACT_APP_STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```

## Integration Details

### Frontend Components

- **StripeCheckout.js**: Handles creating checkout sessions and redirecting to Stripe
- **CheckoutSuccess.js**: Handles post-payment success page

### Backend Functions

- **createCheckoutSession**: Creates a Stripe checkout session
- **stripeWebhook**: Handles Stripe webhook events

## Testing the Integration

1. Start the application with `npm start`
2. Navigate to the pricing page
3. Select a plan and click the purchase button
4. You should be redirected to Stripe Checkout
5. Use Stripe test cards to simulate payments:
   - Success: `4242 4242 4242 4242` (any future date, any CVC)
   - Decline: `4000 0000 0000 0002` (any future date, any CVC)

## Deploying to Production

When moving to production:

1. Update your environment variables to use live keys:
   ```
   REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_live_YourLivePublishableKey
   REACT_APP_STRIPE_SECRET_KEY=sk_live_YourLiveSecretKey
   REACT_APP_ENV=production
   ```
2. Set up a production webhook endpoint in the Stripe Dashboard
3. Update your API URL to point to your production backend:
   ```
   REACT_APP_API_URL=https://your-production-api.com
   ```

## Security Considerations

- Never expose your Stripe secret key in client-side code
- Always use environment variables to store sensitive information
- Keep your webhook endpoint secure
- Use HTTPS for all API calls

## Troubleshooting

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Check your Firebase Functions logs for backend errors
3. Verify your Stripe Dashboard for payment events and logs
4. Ensure your API URLs are correct for your environment

For more help, refer to [Stripe's documentation](https://stripe.com/docs). 