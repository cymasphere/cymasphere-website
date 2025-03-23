import Head from 'next/head';
import LoadingDemo from '../src/pages/LoadingDemo';

export default function LoadingDemoPage() {
  return (
    <>
      <Head>
        <title>Loading Demo - CymaSphere</title>
        <meta name="description" content="CymaSphere loading demo" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <LoadingDemo />
    </>
  );
} 