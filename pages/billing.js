import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Billing from '../src/components/Billing';
import { useAuth } from '../src/contexts/NextAuthContext';
import NextSEO from '../src/components/NextSEO';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

export default function BillingPage() {
  const auth = useAuth() || {};
  const { currentUser } = auth;
  const router = useRouter();

  // Client-side protection
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // If no user, show loading or nothing
  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <DynamicNextLayout title="Billing - CymaSphere">
      <NextSEO
        title="Billing - CymaSphere"
        description="Manage your CymaSphere subscription"
        canonical="/billing"
        noindex={true} // Private page
      />
      <Billing />
    </DynamicNextLayout>
  );
} 