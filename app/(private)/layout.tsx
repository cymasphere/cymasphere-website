"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!auth.user && !auth.loading) {
      router.push("/login");
    }
  }, [auth.user, router, auth.loading]);

  if (!auth.user || auth.loading) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
}
