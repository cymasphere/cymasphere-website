"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import LoadingComponent from "@/components/common/LoadingComponent";

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
