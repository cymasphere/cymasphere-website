"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// This component will scroll the window to the top whenever the pathname changes
const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to top on page refresh or route change
    window.scrollTo(0, 0);
  }, [pathname]);

  return null; // This component doesn't render anything
};

export default ScrollToTop;
