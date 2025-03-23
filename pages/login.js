import React from 'react';
import dynamic from 'next/dynamic';
import Login from '../src/components/Login';
import NextSEO from '../src/components/NextSEO';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

export default function LoginPage() {
  return (
    <DynamicNextLayout title="Login - CymaSphere" showHeader={false} showFooter={false}>
      <NextSEO 
        title="Login - CymaSphere"
        description="Log in to your CymaSphere account"
        canonical="/login"
      />
      <Login />
    </DynamicNextLayout>
  );
} 