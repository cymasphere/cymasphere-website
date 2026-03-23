/**
 * @fileoverview Private route layout component for authenticated pages.
 * @module app/(private)/layout
 * @description Protects private routes by checking authentication status.
 * Redirects unauthenticated users to login page with redirect parameter.
 * Shows loading state while checking authentication.
 */

"use client";

import React, { useLayoutEffect } from "react";
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
 * @note Unauthenticated redirects run in useLayoutEffect so navigation starts before paint.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  /**
   * @brief Send unauthenticated visitors to login with a safe return path.
   * @note Full navigation avoids stuck App Router client transitions (same rationale as login page assign).
   */
  useLayoutEffect(() => {
    if (auth.user || auth.loading) {
      return;
    }
    const redirectUrl = encodeURIComponent(pathname);
    const target = `/login?redirect=${redirectUrl}`;
    if (typeof window !== "undefined") {
      window.location.replace(`${window.location.origin}${target}`);
    } else {
      router.replace(target);
    }
  }, [auth.user, auth.loading, pathname, router]);

  if (auth.loading) {
    return <LoadingComponent fullScreen text="Loading..." />;
  }

  if (!auth.user) {
    return (
      <LoadingComponent
        fullScreen
        text="Redirecting to sign in..."
      />
    );
  }

  return <>{children}</>;
}
