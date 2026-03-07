/**
 * @fileoverview Private route layout component for authenticated pages.
 * @module app/(private)/layout
 * @description Protects private routes by checking authentication status.
 * Redirects unauthenticated users to login page with redirect parameter.
 * Shows loading state while checking authentication.
 */

"use client";

import React, { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import LoadingComponent from "@/components/common/LoadingComponent";

/**
 * @brief Private route layout component.
 * @description Protects routes by requiring authentication. Redirects unauthenticated
 * users to login page with the current path as a redirect parameter.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 * @returns {JSX.Element} Children if authenticated, loading component while checking, or redirects to login.
 * @note Encodes current pathname as redirect parameter for post-login navigation.
 * @note Redirect is triggered only once per unauthenticated transition to avoid infinite redirect loops.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const hasRedirectedRef = useRef(false);

  useEffect(() => {
    if (!auth.user && !auth.loading) {
      // Redirect only once when we transition to unauthenticated to prevent
      // multiple router.push calls and UI flashing / infinite loop on logout
      if (!hasRedirectedRef.current) {
        hasRedirectedRef.current = true;
        const redirectUrl = encodeURIComponent(pathname);
        router.push(`/login?redirect=${redirectUrl}`);
      }
    } else if (auth.user) {
      // Reset so a future logout can redirect again
      hasRedirectedRef.current = false;
    }
  }, [auth.user, router, auth.loading, pathname]);

  if (!auth.user || auth.loading) {
    return <LoadingComponent fullScreen text="Loading..." />;
  }

  return <>{children}</>;
}
