# Integration Examples

Real-world examples of how to integrate Meta Conversions API tracking into your application.

## Example 1: Stripe Webhook (Payment Processing)

**File**: `app/api/stripe/webhook/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { trackMetaConversion } from '@/utils/analytics';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export async function POST(request: NextRequest) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error) {
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  try {
    // Handle charge completed
    if (event.type === 'charge.succeeded') {
      const charge = event.data.object as Stripe.Charge;
      const customer = await stripe.customers.retrieve(charge.customer as string);

      // Track to Meta
      const result = await trackMetaConversion('Purchase', {
        email: charge.billing_details?.email || (customer.email as string),
        value: charge.amount / 100, // Convert cents to dollars
        currency: charge.currency.toUpperCase(),
        transactionId: charge.id,
        customData: {
          payment_method: charge.payment_method_details?.type,
          customer_id: customer.id,
          receipt_email: charge.receipt_email,
        },
      });

      if (!result.success) {
        console.error('Failed to track purchase to Meta:', result.error);
      }
    }

    // Handle subscription created
    if (event.type === 'customer.subscription.created') {
      const subscription = event.data.object as Stripe.Subscription;
      const customer = await stripe.customers.retrieve(subscription.customer as string);

      await trackMetaConversion('Subscribe', {
        email: customer.email as string,
        customData: {
          subscription_id: subscription.id,
          plan_id: subscription.items.data[0]?.plan.id,
          plan_amount: subscription.items.data[0]?.plan.amount
            ? (subscription.items.data[0].plan.amount as number) / 100
            : undefined,
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
  }
}
```

## Example 2: Email Campaign Sends

**File**: `app/api/email-campaigns/send/route.ts` (add this section)

```typescript
import { trackMetaConversion } from '@/utils/analytics';

// In your campaign sending function, add:
async function sendCampaignEmails(campaign: any, subscribers: any[]) {
  const results = [];

  for (const subscriber of subscribers) {
    try {
      // Send email
      await sendEmail({
        to: subscriber.email,
        subject: campaign.subject,
        html: campaign.html,
      });

      // Track to Meta
      await trackMetaConversion('Lead', {
        email: subscriber.email,
        firstName: subscriber.metadata?.first_name,
        lastName: subscriber.metadata?.last_name,
        customData: {
          campaign_id: campaign.id,
          campaign_name: campaign.name,
          campaign_type: 'email',
          subscriber_id: subscriber.id,
          list_id: campaign.audience_id,
        },
      });

      results.push({ subscriber_id: subscriber.id, status: 'sent' });
    } catch (error) {
      console.error(`Failed to send to ${subscriber.email}:`, error);
      results.push({ subscriber_id: subscriber.id, status: 'failed', error });
    }
  }

  return results;
}
```

## Example 3: User Sign Up / Registration

**File**: `app/api/auth/register/route.ts` (add this section)

```typescript
import { trackMetaConversion } from '@/utils/analytics';

export async function POST(request: NextRequest) {
  const { email, firstName, lastName, country } = await request.json();

  try {
    // Create user in database
    const user = await createUser({
      email,
      firstName,
      lastName,
    });

    // Track to Meta
    const trackResult = await trackMetaConversion('CompleteRegistration', {
      email,
      firstName,
      lastName,
      country,
      userId: user.id, // Your internal user ID
      customData: {
        user_id: user.id,
        signup_source: 'web',
        marketing_consent: true,
      },
    });

    if (!trackResult.success) {
      console.warn('Failed to track signup:', trackResult.error);
      // Don't fail the signup if tracking fails
    }

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ error: 'Signup failed' }, { status: 400 });
  }
}
```

## Example 4: Contact Form Submission

**File**: `app/api/contact/route.ts`

```typescript
'use server';

import { trackMetaConversion } from '@/utils/analytics';
import { sendEmail } from '@/utils/email';

export async function POST(request: NextRequest) {
  const formData = await request.json();
  const { email, name, phone, message, company } = formData;

  try {
    // Save contact to database
    const contact = await db.contacts.create({
      email,
      name,
      phone,
      message,
      company,
      createdAt: new Date(),
    });

    // Send confirmation email
    await sendEmail({
      to: email,
      subject: 'We received your message',
      template: 'contact-confirmation',
    });

    // Track to Meta
    const [firstName, lastName] = name.split(' ');
    await trackMetaConversion('Lead', {
      email,
      firstName,
      lastName,
      phone,
      customData: {
        company,
        message_length: message.length,
        contact_form_id: 'main_contact',
        source: 'contact_form',
      },
    });

    return NextResponse.json({ success: true, contactId: contact.id });
  } catch (error) {
    console.error('Contact form error:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}
```

## Example 5: Product Purchase Component

**File**: `components/ProductBuy.tsx`

```typescript
'use client';

import { useState } from 'react';
import { trackMetaConversion } from '@/utils/analytics';
import { useAuth } from '@/contexts/AuthContext';

export default function ProductBuy({ product }: { product: any }) {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!user) {
      // Redirect to login
      return;
    }

    setIsLoading(true);

    try {
      // Process payment
      const paymentResult = await processPayment({
        productId: product.id,
        amount: product.price,
      });

      if (!paymentResult.success) {
        throw new Error('Payment failed');
      }

      // Track purchase to Meta
      const trackResult = await trackMetaConversion('Purchase', {
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        userId: user.id,
        value: product.price,
        currency: 'USD',
        transactionId: paymentResult.transactionId,
        contentIds: [product.id],
        numItems: 1,
        customData: {
          product_name: product.name,
          product_category: product.category,
          product_id: product.id,
          quantity: 1,
          payment_method: 'credit_card',
        },
      });

      if (!trackResult.success) {
        console.warn('Failed to track purchase:', trackResult.error);
        // Still show success to user - tracking failure is not critical
      }

      // Show success message
      toast.success('Purchase completed!');
      router.push('/downloads');
    } catch (error) {
      console.error('Purchase error:', error);
      toast.error('Purchase failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handlePurchase}
      disabled={isLoading}
      className="btn btn-primary"
    >
      {isLoading ? 'Processing...' : `Buy for $${product.price}`}
    </button>
  );
}
```

## Example 6: Video View Tracking

**File**: `components/VideoPlayer.tsx`

```typescript
'use client';

import { useEffect, useState } from 'react';
import { trackMetaConversion } from '@/utils/analytics';
import { useAuth } from '@/contexts/AuthContext';

export default function VideoPlayer({ video }: { video: any }) {
  const { user } = useAuth();
  const [hasTrackedView, setHasTrackedView] = useState(false);

  useEffect(() => {
    // Track view content when video starts
    if (video && user && !hasTrackedView) {
      trackMetaConversion('ViewContent', {
        email: user.email,
        userId: user.id,
        contentIds: [video.id],
        customData: {
          content_type: 'video',
          video_title: video.title,
          video_duration: video.duration,
          category: video.category,
        },
      }).then(() => {
        setHasTrackedView(true);
      });
    }
  }, [video, user, hasTrackedView]);

  return (
    <video
      src={video.url}
      controls
      width="100%"
      onPlay={() => {
        // Track when user presses play
        trackMetaConversion('ViewContent', {
          email: user?.email,
          customData: {
            action: 'video_play',
            video_id: video.id,
          },
        });
      }}
    />
  );
}
```

## Example 7: Newsletter Signup

**File**: `components/NewsletterSignup.tsx`

```typescript
'use client';

import { useState } from 'react';
import { trackMetaConversion } from '@/utils/analytics';

export default function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Add to newsletter
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error('Subscription failed');

      // Extract name from email if possible
      const [firstName] = email.split('@')[0].split('.');

      // Track to Meta
      await trackMetaConversion('CompleteRegistration', {
        email,
        firstName,
        customData: {
          signup_type: 'newsletter',
          source: 'website_footer',
          newsletter_list: 'main',
        },
      });

      setEmail('');
      alert('Thanks for subscribing!');
    } catch (error) {
      console.error('Signup error:', error);
      alert('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="newsletter-signup">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Enter your email"
        required
      />
      <button type="submit" disabled={isLoading}>
        {isLoading ? 'Subscribing...' : 'Subscribe'}
      </button>
    </form>
  );
}
```

## Example 8: Course/Playlist Completion

**File**: `app/api/tutorials/progress/route.ts`

```typescript
import { trackMetaConversion } from '@/utils/analytics';

export async function POST(request: NextRequest) {
  const { playlistId, userId, completedAt } = await request.json();

  try {
    // Save progress
    await savePlaylistProgress({
      playlistId,
      userId,
      completedAt,
    });

    // Get user and playlist data
    const user = await getUser(userId);
    const playlist = await getPlaylist(playlistId);

    // Track completion to Meta
    await trackMetaConversion('CompleteRegistration', {
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      userId,
      customData: {
        action: 'course_completed',
        course_id: playlistId,
        course_name: playlist.name,
        completion_time: completedAt,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Progress tracking error:', error);
    return NextResponse.json({ error: 'Failed to track progress' }, { status: 500 });
  }
}
```

## Example 9: Donation / Support

**File**: `components/SupportButton.tsx`

```typescript
'use client';

import { trackMetaConversion } from '@/utils/analytics';
import { useAuth } from '@/contexts/AuthContext';

export default function SupportButton() {
  const { user } = useAuth();

  const handleDonate = async (amount: number) => {
    try {
      const result = await initiateDonation(amount);

      if (result.success) {
        await trackMetaConversion('Donate', {
          email: user?.email,
          userId: user?.id,
          value: amount,
          currency: 'USD',
          customData: {
            donation_type: 'one_time',
            source: 'website',
          },
        });
      }
    } catch (error) {
      console.error('Donation error:', error);
    }
  };

  return (
    <div className="support-options">
      <button onClick={() => handleDonate(5)}>Support with $5</button>
      <button onClick={() => handleDonate(10)}>Support with $10</button>
      <button onClick={() => handleDonate(25)}>Support with $25</button>
    </div>
  );
}
```

## Example 10: A/B Test Tracking

**File**: `components/ABTest.tsx`

```typescript
'use client';

import { useEffect } from 'react';
import { trackMetaConversion } from '@/utils/analytics';
import { useAuth } from '@/contexts/AuthContext';

interface ABTestProps {
  testName: string;
  variantId: string;
  children: React.ReactNode;
}

export default function ABTest({ testName, variantId, children }: ABTestProps) {
  const { user } = useAuth();

  useEffect(() => {
    // Track that user saw this variant
    trackMetaConversion('ViewContent', {
      email: user?.email,
      userId: user?.id,
      customData: {
        ab_test_name: testName,
        ab_test_variant: variantId,
        timestamp: new Date().toISOString(),
      },
    });
  }, [testName, variantId, user]);

  return <>{children}</>;
}

// Usage:
// <ABTest testName="checkout_button" variantId="red">
//   <PurchaseButton color="red" />
// </ABTest>
```

---

## Best Practices

1. **Always check if tracking succeeds before failing the user action**
   ```typescript
   const result = await trackMetaConversion(...);
   // Tracking failure should not break the user experience
   ```

2. **Include relevant context in customData**
   ```typescript
   customData: {
     source: 'email_campaign',
     campaign_id: campaign.id,
     ab_variant: 'version_b',
   }
   ```

3. **Test with testEventCode first**
   ```typescript
   testEventCode: 'TEST123' // Remove after testing
   ```

4. **Consistent user identification**
   ```typescript
   // Always use the same email for a user
   // Don't switch between personal and work email
   ```

5. **Don't track sensitive data**
   ```typescript
   // ❌ Don't do this
   customData: { password: 'secret123' }
   
   // ✅ Do this
   customData: { action_type: 'login_attempt' }
   ```

---

These examples should cover most use cases in your application. Adapt them as needed for your specific requirements.

