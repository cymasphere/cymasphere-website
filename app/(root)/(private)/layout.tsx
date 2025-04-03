"use client";

import React from "react";
import { useAuth } from "@/contexts/AuthContext";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const auth = useAuth();

  return <>{children}</>;
}
