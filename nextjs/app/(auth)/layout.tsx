import React from "react";
import Image from "next/image";
import Link from "next/link";

import { Geist, Geist_Mono } from "next/font/google";
import "../globals.css";
import Footer from "@/components_template/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col animate-fade-in">
      {/* Gradient background */}
      <div
        className="fixed inset-0 opacity-10 z-0"
        style={{
          background: `linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))`,
        }}
      ></div>

      {/* Animated circles for decoration */}
      <div
        className="fixed top-0 left-0 w-96 h-96 rounded-full filter blur-3xl opacity-10 animate-pulse -translate-x-1/2 -translate-y-1/2 z-0"
        style={{
          background: `linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))`,
        }}
      ></div>
      <div
        className="fixed bottom-0 right-0 w-96 h-96 rounded-full filter blur-3xl opacity-10 animate-pulse translate-x-1/2 translate-y-1/2 z-0"
        style={{
          background: `linear-gradient(to bottom right, var(--gradient-start), var(--gradient-end))`,
        }}
      ></div>

      <header className="relative z-10 py-4 border-b border-gray-800">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/">
            <div className="flex items-center">
              <Image
                src="/next.svg"
                alt="Logo"
                width={144}
                height={30}
                className="invert"
              />
            </div>
          </Link>
        </div>
      </header>

      <main className="relative z-10 flex-grow flex items-center justify-center py-12 px-4">
        <div className="w-full max-w-md animate-slide-up">{children}</div>
      </main>

      <Footer />
    </div>
  );
}
