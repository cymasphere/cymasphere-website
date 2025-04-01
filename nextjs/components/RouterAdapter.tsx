import { useRouter } from 'next/router';
import { useEffect, useContext, createContext, useState } from 'react';

// Create a context that emulates React Router's behavior
const RouterContext = createContext({
  navigate: () => {},
  location: { pathname: '/' },
});

// Create a provider that adapts Next.js router to React Router API
export const RouterAdapter = ({ children }) => {
  const router = useRouter();
  const [location, setLocation] = useState({ 
    pathname: typeof window !== 'undefined' ? window.location.pathname : '/' 
  });

  // Update location when route changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setLocation({
        pathname: window.location.pathname,
        search: window.location.search,
        hash: window.location.hash,
      });
    }
  }, [router.asPath]);

  // Navigate function that works like React Router's navigate
  const navigate = (to, options = {}) => {
    const { replace = false } = options;
    
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };

  // Create context value that emulates React Router
  const value = {
    navigate,
    location,
    history: {
      push: (to) => navigate(to),
      replace: (to) => navigate(to, { replace: true }),
    },
  };

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
};

// Hook to use our router adapter
export const useNavigate = () => {
  const context = useContext(RouterContext);
  return context.navigate;
};

// Hook to get the location
export const useLocation = () => {
  const context = useContext(RouterContext);
  return context.location;
};

export default RouterAdapter; 