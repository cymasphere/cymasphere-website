/**
 * @fileoverview Private route layout component for authenticated pages.
 * @module app/(private)/layout
 * @description Protects private routes by checking authentication status.
 * Redirects unauthenticated users to login page with redirect parameter.
 * Shows loading state while checking authentication.
 */

"use client";

import React, { useEffect } from "react";
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
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!auth.user && !auth.loading) {
      // Encode the current path to include it as a redirect parameter
      const redirectUrl = encodeURIComponent(pathname);
      router.push(`/login?redirect=${redirectUrl}`);
    }
  }, [auth.user, router, auth.loading, pathname]);

  if (!auth.user || auth.loading) {
    return <LoadingComponent fullScreen text="Loading..." />;
  }

  return <>{children}</>;
}
