import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/AuthContext';
import NextSEO from '../src/components/NextSEO';

const DynamicSettings = dynamic(() => import('../src/components/Settings'), {
  ssr: false,
});

const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false,
});

function SettingsPage() {
  const [isClient, setIsClient] = useState(false);
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  if (!isClient || loading) {
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

  return (
    <DynamicNextLayout title="Settings - CymaSphere">
      <NextSEO
        title="Settings - CymaSphere"
        description="Manage your CymaSphere settings"
        noindex={true} // This is a private page
      />
      <DynamicSettings />
    </DynamicNextLayout>
  );
}

export default SettingsPage; 