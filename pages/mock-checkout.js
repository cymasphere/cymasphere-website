import Head from 'next/head';
import MockCheckout from '../src/components/checkout/MockCheckout';

export default function MockCheckoutPage() {
  return (
    <>
      <Head>
        <title>Checkout - CymaSphere</title>
        <meta name="description" content="Complete your purchase" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <MockCheckout />
    </>
  );
} 