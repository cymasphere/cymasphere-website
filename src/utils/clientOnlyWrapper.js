import React, { useState, useEffect } from 'react';

// This component acts as a wrapper for components that use useLayoutEffect
// It only renders on the client, avoiding server-side rendering issues
export default function ClientOnly({ children, ...delegated }) {
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
  }, []);
  
  if (!hasMounted) {
    return null;
  }
  
  return (
    <div {...delegated}>
      {children}
    </div>
  );
} 