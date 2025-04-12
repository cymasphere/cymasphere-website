import React from "react";
import { Metadata } from "next";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "Cymasphere",
  description: "Advanced Chord Generation",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClientLayout>
      {children}
    </ClientLayout>
  );
} 