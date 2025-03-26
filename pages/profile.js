import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../src/contexts/NextAuthContext';
import ProfileWithLayout from '../src/components/Profile';
import NextSEO from '../src/components/NextSEO';

export default function ProfilePage() {
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
        title="Profile - CymaSphere"
        description="Your CymaSphere profile"
        canonical="/profile"
        noindex={true} // Private page
      />
      <ProfileWithLayout />
    </>
  );
} 