import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/NextAuthContext';
import NextSEO from '../src/components/NextSEO';
import BillingWithLayout from '../src/components/Billing';

export default function BillingPage() {
  const [isMounted, setIsMounted] = useState(false);
  const auth = useAuth() || {};
  const { currentUser } = auth;
  const router = useRouter();

  // Set isMounted to true on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // AUTHENTICATION CHECK DISABLED FOR DEVELOPMENT
  /* Original authentication check:
  useEffect(() => {
    if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, router]);

  // If no user, show loading or nothing
  if (!currentUser) {
    return <div>Loading...</div>;
  }
  */

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <NextSEO
        title="Billing - CymaSphere"
        description="Manage your CymaSphere subscription"
        canonical="/billing"
        noindex={true} // Private page
      />
      <BillingWithLayout />
    </>
  );
} 