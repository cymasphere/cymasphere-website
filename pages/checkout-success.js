import Head from 'next/head';
import CheckoutSuccess from '../src/components/checkout/CheckoutSuccess';

export default function CheckoutSuccessPage() {
  return (
    <>
      <Head>
        <title>Checkout Success - Cymasphere</title>
        <meta name="description" content="Your purchase was successful" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <CheckoutSuccess />
    </>
  );
} 