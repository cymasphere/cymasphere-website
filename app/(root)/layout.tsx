import React from "react";
import { Metadata } from "next";

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
    <>
      {children}
    </>
  );
} 