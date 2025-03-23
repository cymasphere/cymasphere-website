import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import dynamic from 'next/dynamic';
import { useAuth } from '../src/contexts/NextAuthContext';
import DashboardContent from '../src/components/dashboard/DashboardContent';
import NextSEO from '../src/components/NextSEO';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

export default function DashboardPage() {
  const auth = useAuth() || {};
  const { currentUser, loading } = auth;
  const router = useRouter();
  const [isClient, setIsClient] = useState(false);

  // Set isClient to true on component mount
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Client-side protection - redirect if not authenticated
  useEffect(() => {
    if (!loading && !currentUser && isClient) {
      router.push('/login');
    }
  }, [currentUser, loading, router, isClient]);

  // Show loading state if still determining authentication
  if (!isClient || loading) {
    return <div className="loading-container">Loading...</div>;
  }

  // If not authenticated after loading, don't render the dashboard
  if (!currentUser) {
    return null;
  }

  return (
    <DynamicNextLayout title="Dashboard - CymaSphere">
      <NextSEO 
        title="Dashboard | CymaSphere" 
        description="Access your CymaSphere account dashboard"
        index={false}
        robots="noindex, nofollow"
      />
      <DashboardContent />
    </DynamicNextLayout>
  );
} 