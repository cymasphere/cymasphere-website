import React from 'react';
import dynamic from 'next/dynamic';
import EmailVerification from '../src/components/EmailVerification';
import NextSEO from '../src/components/NextSEO';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

export default function VerifyEmailPage() {
  return (
    <DynamicNextLayout title="Verify Email - CymaSphere">
      <NextSEO 
        title="Verify Email - Cymasphere"
        description="Verify your email address for your Cymasphere account"
        canonical="/verify-email"
      />
      <EmailVerification />
    </DynamicNextLayout>
  );
} 