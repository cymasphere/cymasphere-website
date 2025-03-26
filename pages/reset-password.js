import React from 'react';
import dynamic from 'next/dynamic';
import ResetPassword from '../src/components/ResetPassword';
import NextSEO from '../src/components/NextSEO';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

export default function ResetPasswordPage() {
  return (
    <DynamicNextLayout title="Reset Password - Cymasphere">
      <NextSEO 
        title="Reset Password - Cymasphere"
        description="Reset your Cymasphere account password"
        canonical="/reset-password"
      />
      <ResetPassword />
    </DynamicNextLayout>
  );
} 