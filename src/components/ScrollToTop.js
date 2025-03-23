import { useEffect } from 'react';
import { useRouter } from 'next/router';

// This component will scroll the window to the top whenever the pathname changes
const ScrollToTop = () => {
  const router = useRouter();

  useEffect(() => {
    // Scroll to top on page refresh or route change
    window.scrollTo(0, 0);
  }, [router.pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop; 