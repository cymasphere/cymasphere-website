import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Settings from '../src/components/Settings';
import { useAuth } from '../src/contexts/NextAuthContext';
import NextSEO from '../src/components/NextSEO';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

export default function SettingsPage() {
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
    <DynamicNextLayout title="Settings - CymaSphere">
      <NextSEO
        title="Settings - CymaSphere"
        description="Your CymaSphere account settings"
        canonical="/settings"
        noindex={true} // Private page
      />
      <Settings />
    </DynamicNextLayout>
  );
} 