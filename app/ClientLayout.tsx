"use client";

import React, { useEffect, Suspense } from "react";
import styled from "styled-components";
import { ThemeProvider } from "styled-components";
import { ToastProvider } from "@/contexts/ToastContext";
import { AuthProvider } from "@/contexts/AuthContext";
import NextHeader from "@/components/layout/NextHeader";
import Footer from "@/components/layout/Footer";
import { usePathname } from "next/navigation";
import dynamic from "next/dynamic";

// Lazy load ChatWidget - not needed on first paint
const ChatWidget = dynamic(() => import("@/components/chat/ChatWidget"), {
  ssr: false,
  loading: () => null,
});

// Theme configuration
const theme = {
  colors: {
    primary: "#6c63ff",
    accent: "#4ecdc4",
    background: "#121212",
    cardBg: "#1e1e1e",
    inputBg: "#2a2a2a",
    text: "#ffffff",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textTertiary: "rgba(255, 255, 255, 0.4)",
    border: "rgba(255, 255, 255, 0.1)",
    success: "#00c9a7",
    error: "#ff5e62",
    warning: "#ffc107",
  },
  breakpoints: {
    mobile: "576px",
    tablet: "768px",
    desktop: "1024px",
    largeDesktop: "1200px",
  },
  shadows: {
    small: "0 2px 8px rgba(0, 0, 0, 0.15)",
    medium: "0 4px 12px rgba(0, 0, 0, 0.2)",
    large: "0 8px 20px rgba(0, 0, 0, 0.25)",
  },
};

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background);
`;

// Use simple div by default, upgrade to motion.main when animations are needed
const Main = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;

  /* Content within can set their own max-width if needed */
  > * {
    margin: 0 auto;
    width: 100%;
  }
`;

interface ClientLayoutProps {
  children: React.ReactNode;
}

export default function ClientLayout({ children }: ClientLayoutProps) {
  const pathname = usePathname();

  // Defer YouTube Iframe API loading - not needed for FCP
  // Load it after a delay to avoid blocking initial render
  useEffect(() => {
    // Only load YouTube API on routes that actually need it
    const needsYoutube = pathname?.includes('/admin') || pathname?.includes('/dashboard') || pathname?.includes('/tutorials');
    
    if (!needsYoutube) {
      // Load after 3 seconds for non-admin routes
      const timer = setTimeout(() => {
        if (typeof window !== 'undefined' && !window.YT) {
          console.log('Loading YouTube Iframe API...');
          const script = document.createElement('script');
          script.src = 'https://www.youtube.com/iframe_api';
          script.async = true;
          script.onload = () => {
            console.log('YouTube Iframe API script loaded');
          };
          script.onerror = () => {
            console.error('Failed to load YouTube Iframe API script');
          };
          document.head.appendChild(script);
          
          window.onYouTubeIframeAPIReady = () => {
            console.log('YouTube Iframe API ready callback triggered');
          };
        }
      }, 3000);
      
      return () => clearTimeout(timer);
    } else {
      // Load immediately for admin/dashboard routes
      if (typeof window !== 'undefined' && !window.YT) {
        console.log('Loading YouTube Iframe API...');
        const script = document.createElement('script');
        script.src = 'https://www.youtube.com/iframe_api';
        script.async = true;
        script.onload = () => {
          console.log('YouTube Iframe API script loaded');
        };
        script.onerror = () => {
          console.error('Failed to load YouTube Iframe API script');
        };
        document.head.appendChild(script);
        
        window.onYouTubeIframeAPIReady = () => {
          console.log('YouTube Iframe API ready callback triggered');
        };
      } else if (window.YT) {
        console.log('YouTube API already loaded');
      }
    }
  }, [pathname]);

  // Timezone tracking is now handled directly in AuthContext

  // Check if the route is in the auth directory
  const isAuthRoute =
    pathname?.startsWith("/login") ||
    pathname?.startsWith("/signup") ||
    pathname?.startsWith("/reset-password") ||
    pathname?.startsWith("/create-password") ||
    pathname?.startsWith("/checkout-success") ||
    pathname?.startsWith("/checkout-canceled");

  // Check if the route is in the dashboard section
  const isDashboardRoute =
    pathname?.includes("/dashboard") ||
    pathname?.includes("/profile") ||
    pathname?.includes("/billing") ||
    pathname?.includes("/downloads") ||
    pathname?.includes("/settings");

  // Check if the route is in the admin section
  const isAdminRoute = pathname?.includes("/admin");

  // Hide header and footer for auth routes, dashboard routes, and admin routes
  const shouldHideHeaderFooter =
    isAuthRoute || isDashboardRoute || isAdminRoute;

  // Hide chat assistant on auth routes (login, signup, reset-password)
  const shouldHideChat = isAuthRoute;

  return (
    <ThemeProvider theme={theme}>
      <ToastProvider>
        <AuthProvider>
          <LayoutWrapper>
            {!shouldHideHeaderFooter && <NextHeader />}
            <Main>
              {children}
            </Main>
            {!shouldHideHeaderFooter && <Footer />}
            {!shouldHideChat && <ChatWidget />}
          </LayoutWrapper>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}
