import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

// This component provides a compatibility layer between React Router and Next.js Links
// It can be gradually introduced to replace React Router Links
const NextLink = ({ to, children, className, onClick, ...props }) => {
  const router = useRouter();
  
  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
    
    // If there's a # in the URL, it's an anchor link
    if (to.includes('#') && !to.startsWith('http')) {
      e.preventDefault();
      const [path, hash] = to.split('#');
      
      // If we're already on the right page, just scroll to the anchor
      if (router.pathname === path || path === '') {
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // Navigate to the page, then scroll to the anchor
        router.push(to);
      }
    }
  };
  
  // External links should use <a> tags
  if (to.startsWith('http')) {
    return (
      <a 
        href={to} 
        className={className}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        {...props}
      >
        {children}
      </a>
    );
  }
  
  return (
    <Link 
      href={to} 
      passHref 
      legacyBehavior
      {...props}
    >
      <a className={className} onClick={handleClick}>
        {children}
      </a>
    </Link>
  );
};

export default NextLink; 