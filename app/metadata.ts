/**
 * @fileoverview Next.js metadata and viewport configuration.
 * @module app/metadata
 * @description Defines SEO metadata and viewport settings for the application.
 */

import { Metadata, Viewport } from "next";

/**
 * @brief Application metadata configuration.
 * @description Defines SEO metadata including title and description.
 */
export const metadata: Metadata = {
  title: "Cymasphere",
  description: "Advanced Chord Generation",
};

/**
 * @brief Viewport configuration for responsive design.
 * @description Sets viewport settings for mobile responsiveness and theme color.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#121212",
};
