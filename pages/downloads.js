import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Downloads from '../src/components/Downloads';
import { useAuth } from '../src/contexts/NextAuthContext';
import NextSEO from '../src/components/NextSEO';

// Dynamically import the layout component for client-side only
const DynamicNextLayout = dynamic(() => import('../src/components/layout/DynamicNextLayout'), {
  ssr: false
});

export default function DownloadsPage() {
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
    <DynamicNextLayout title="Downloads - CymaSphere">
      <NextSEO
        title="Downloads - CymaSphere"
        description="Your CymaSphere downloads"
        canonical="/downloads"
        noindex={true} // Private page
      />
      <Downloads />
    </DynamicNextLayout>
  );
} 