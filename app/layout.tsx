import { Geist, Geist_Mono } from "next/font/google";
import { Montserrat } from "next/font/google";
import { Metadata } from "next";
import StyledComponentsRegistry from "./registry";
import ClientLayout from "./ClientLayout";
import I18nProvider from "@/app/i18n/I18nProvider";
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

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable}`}
    >
      <body>
        <StyledComponentsRegistry>
          <I18nProvider>
            <ClientLayout>{children}</ClientLayout>
          </I18nProvider>
        </StyledComponentsRegistry>
      </body>
    </html>
  );
}
