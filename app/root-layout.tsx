/**
 * @fileoverview Alternative root layout component (legacy or alternative implementation).
 * @module app/root-layout
 * @description Provides a minimal root layout with basic metadata.
 * This appears to be an alternative or legacy implementation of the root layout.
 */

import React from "react";
import { Metadata } from "next";

/**
 * @brief Metadata configuration for the application.
 * @description Defines basic SEO metadata for the application.
 */
export const metadata: Metadata = {
  title: "Cymasphere",
  description: "Advanced Chord Generation",
};

/**
 * @brief Root layout component (alternative implementation).
 * @description Provides a minimal root layout that simply renders children.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 * @returns {JSX.Element} Children wrapped in a fragment.
 */
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