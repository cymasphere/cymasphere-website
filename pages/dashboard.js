import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../src/contexts/NextAuthContext';
import DashboardWithLayout from '../src/components/dashboard/DashboardContent';
import NextSEO from '../src/components/NextSEO';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

export default function DashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const auth = useAuth() || {};
  const { currentUser, loading } = auth;
  const router = useRouter();

  // Set isMounted to true on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // AUTHENTICATION CHECK DISABLED FOR DEVELOPMENT
  /* Original authentication check:
  useEffect(() => {
    if (!loading && !currentUser && isMounted) {
      router.push('/login');
    }
  }, [currentUser, loading, router, isMounted]);
  */

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  // Always render dashboard in development mode
  return (
    <>
      <NextSEO 
        title="Dashboard | CymaSphere" 
        description="Access your CymaSphere account dashboard"
        index={false}
        robots="noindex, nofollow"
      />
      <DashboardWithLayout />
    </>
  );
} 