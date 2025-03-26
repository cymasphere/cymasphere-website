import React from 'react';
import dynamic from 'next/dynamic';
import SignUp from '../src/components/SignUp';
import NextSEO from '../src/components/NextSEO';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

export default function SignUpPage() {
  return (
    <DynamicNextLayout title="Sign Up - Cymasphere" showHeader={false} showFooter={false}>
      <NextSEO 
        title="Sign Up - Cymasphere"
        description="Create your Cymasphere account"
        canonical="/signup"
      />
      <SignUp />
    </DynamicNextLayout>
  );
} 