/**
 * @fileoverview Root layout component for the Next.js application.
 * @module app/layout
 * @description Provides the root HTML structure, font configuration, metadata,
 * and wraps the application with necessary providers (styled-components, i18n, language).
 * Includes analytics and performance monitoring.
 */

import { Geist } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Metadata } from "next";
import StyledComponentsRegistry from "./registry";
import ClientLayout from "./ClientLayout";
import I18nProvider from "@/app/i18n/I18nProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import Analytics from "@/components/analytics/Analytics";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

/**
 * @brief Metadata configuration for the application.
 * @description Defines SEO metadata, title, description, and favicon configurations.
 */
export const metadata: Metadata = {
  title: "Cymasphere",
  description: "Advanced Chord Generation",
  icons: {
    icon: [
      {
        url: "/favicon.ico",
        sizes: "any",
      },
      {
        url: "/images/cm-logo-icon.png",
        type: "image/png",
        sizes: "32x32",
      },
      {
        url: "/images/cm-logo-icon.png",
        type: "image/png",
        sizes: "16x16",
      },
    ],
    apple: [
      {
        url: "/images/cm-logo-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    shortcut: "/favicon.ico",
  },
};

// Theme configuration
const theme = {
  colors: {
    primary: "#6c63ff",
    accent: "#4ecdc4",
    background: "#121212",
    cardBg: "#1e1e1e",
    inputBg: "#2a2a2a",
    text: "#ffffff",
    textSecondary: "rgba(255, 255, 255, 0.7)",
    textTertiary: "rgba(255, 255, 255, 0.4)",
    border: "rgba(255, 255, 255, 0.1)",
    success: "#00c9a7",
    error: "#ff5e62",
    warning: "#ffc107",
  },
  breakpoints: {
    mobile: "576px",
    tablet: "768px",
    desktop: "1024px",
    largeDesktop: "1200px",
  },
  shadows: {
    small: "0 2px 8px rgba(0, 0, 0, 0.15)",
    medium: "0 4px 12px rgba(0, 0, 0, 0.2)",
    large: "0 8px 20px rgba(0, 0, 0, 0.25)",
  },
};

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap", // Prevents text reflow - shows fallback font while loading
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["600", "700"], // Only essential weights - reduces font file size by ~60%
  display: "swap", // Prevents text reflow
});

/**
 * @brief Interface for RootLayout component props.
 * @description Defines the props structure for the root layout component.
 */
interface RootLayoutProps {
  children: React.ReactNode;
}

/**
 * @brief Root layout component.
 * @description Provides the root HTML structure with font configuration,
 * metadata, and provider wrappers. Includes DNS prefetching for external services.
 * @param {RootLayoutProps} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 * @returns {JSX.Element} Root HTML structure with providers.
 * @note Uses font-display: swap to prevent text reflow during font loading.
 * @note Includes DNS prefetching for Google Tag Manager and YouTube.
 */
export default function RootLayout({
  children
}: RootLayoutProps) {
  return (
    <html lang="en" className={`${geistSans.variable} ${montserrat.variable}`} suppressHydrationWarning>
      <head>
        {/* DNS prefetch for external services */}
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//www.youtube.com" />
      </head>
      <body>
        <Analytics />
        <SpeedInsights />
        <StyledComponentsRegistry>
          <LanguageProvider>
          <I18nProvider>
          <ClientLayout>{children}</ClientLayout>
          </I18nProvider>
          </LanguageProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
