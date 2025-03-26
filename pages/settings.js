import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/NextAuthContext';
import NextSEO from '../src/components/NextSEO';

const DynamicSettingsWithLayout = dynamic(() => import('../src/components/Settings'), {
  ssr: false,
});

function SettingsPage() {
  const [isMounted, setIsMounted] = useState(false);
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  // Set isMounted to true on client side
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // AUTHENTICATION CHECK DISABLED FOR DEVELOPMENT
  /* Original authentication check:
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (!isMounted || loading) {
    return (
      <DynamicNextLayout title="Settings - CymaSphere">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <div>Loading...</div>
        </div>
      </DynamicNextLayout>
    );
  }

  if (!currentUser) {
    return null;
  }
  */

  // Don't render anything during SSR to avoid hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <NextSEO
        title="Settings - CymaSphere"
        description="Manage your CymaSphere settings"
        noindex={true} // This is a private page
      />
      <DynamicSettingsWithLayout />
    </>
  );
}

export default SettingsPage; 