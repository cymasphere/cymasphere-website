import { Geist, Geist_Mono } from "next/font/google";
import { Montserrat } from "next/font/google";
import StyledComponentsRegistry from "./registry";
import ClientLayout from "./ClientLayout";
import "./globals.css";
// Import will be created during CI build
// import ClientScript from "./head-script/client-script";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${montserrat.variable}`}>
      {/* Script to load CSS will be added during CI build */}
      <body>
        <StyledComponentsRegistry>
          <ClientLayout>{children}</ClientLayout>
        </StyledComponentsRegistry>
        {/* Production-only script to load CSS */}
        <script 
          dangerouslySetInnerHTML={{ 
            __html: `
              if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
                (function() {
                  // Create link element immediately
                  const link = document.createElement('link');
                  link.rel = 'stylesheet';
                  link.href = '/styles/main.css';
                  
                  // Add it to head as soon as possible
                  if (document.head) {
                    document.head.appendChild(link);
                  } else {
                    // If head isn't available yet, wait for it
                    document.addEventListener('DOMContentLoaded', function() {
                      document.head.appendChild(link);
                    });
                  }
                })();
              }
            `
          }} 
        />
      </body>
    </html>
  );
}
