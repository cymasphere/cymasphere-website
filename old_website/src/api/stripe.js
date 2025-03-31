// Import required packages
const stripe = require('stripe')(process.env.REACT_APP_STRIPE_SECRET_KEY);
const cors = require('cors')({ origin: true });

/**
 * Function to create a Stripe checkout session
 */
exports.createCheckoutSession = async (req, res) => {
  return cors(req, res, async () => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { priceId, billingPeriod } = req.body;

      if (!priceId) {
        return res.status(400).json({ error: 'Price ID is required' });
      }

      // The Stripe price IDs for different billing periods
      const priceIds = {
        monthly: process.env.REACT_APP_STRIPE_PRICE_MONTHLY || 'price_monthly',
        yearly: process.env.REACT_APP_STRIPE_PRICE_YEARLY || 'price_yearly',
        lifetime: process.env.REACT_APP_STRIPE_PRICE_LIFETIME || 'price_lifetime'
      };

      // Use the provided priceId or get it from our mapping
      const actualPriceId = priceId || priceIds[billingPeriod];

      if (!actualPriceId) {
        return res.status(400).json({ error: 'Invalid billing period' });
      }

      // Create Stripe checkout session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: actualPriceId,
            quantity: 1,
          },
        ],
        mode: billingPeriod === 'lifetime' ? 'payment' : 'subscription',
        success_url: `${req.headers.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.headers.origin}/pricing`,
      });

      // Return the session ID
      return res.status(200).json({ id: session.id });
    } catch (error) {
      console.error('Error creating checkout session:', error);
      return res.status(500).json({ 
        error: 'An error occurred while creating the checkout session',
        message: error.message 
      });
    }
  });
};

/**
 * Webhook to handle Stripe events (payment success, etc.)
 */
exports.stripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const endpointSecret = process.env.REACT_APP_STRIPE_WEBHOOK_SECRET;
  
  try {
    // Verify the event came from Stripe
    const event = stripe.webhooks.constructEvent(
      req.rawBody,
      signature,
      endpointSecret
    );

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleCheckoutSessionCompleted(session);
        break;
      
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        await handlePaymentIntentSucceeded(paymentIntent);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Return success
    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(400).json({ error: error.message });
  }
};

/**
 * Handle successful checkout sessions
 */
async function handleCheckoutSessionCompleted(session) {
  try {
    // TODO: Update user record in your database
    console.log('Checkout completed for session:', session.id);
    
    // Update user record in database
    // TODO: Update user record in your database
    
  } catch (error) {
    console.error('Error handling checkout completion:', error);
  }
}

/**
 * Handle successful payment intents
 */
async function handlePaymentIntentSucceeded(paymentIntent) {
  try {
    // TODO: Update order status or fulfillment records
    console.log('Payment succeeded for intent:', paymentIntent.id);
    
    // For example, update the user's subscription status in the database
    
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
} 