import { Geist, Geist_Mono } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Metadata } from "next";
import StyledComponentsRegistry from "./registry";
import ClientLayout from "./ClientLayout";
import I18nProvider from "@/app/i18n/I18nProvider";
import { LanguageProvider } from "@/contexts/LanguageContext";
import "./globals.css";

// Metadata configuration
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
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

// Define the interface for the RootLayout props
interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children
}: RootLayoutProps) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable}`}>
      <body>
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
