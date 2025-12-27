/**
 * @fileoverview ClientLayout Component
 * @module components/layout/ClientLayout
 * 
 * Client-side only layout component for Next.js App Router. Provides header,
 * animated main content area, and footer. Optimized for client-side rendering
 * with smooth page transitions.
 * 
 * @example
 * // Basic usage in a client component
 * <ClientLayout>
 *   <YourPageContent />
 * </ClientLayout>
 */

"use client";

import React from "react";
import styled from "styled-components";
import { motion, Variants } from "framer-motion";
import Footer from "@/components/layout/Footer";
import NextHeader from "@/components/layout/NextHeader";

const LayoutWrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--background);
`;

const Main = styled(motion.main)`
  flex: 1;
  display: flex;
  flex-direction: column;
  width: 100%;

  /* Content within can set their own max-width if needed */
  > * {
    margin: 0 auto;
    width: 100%;
  }
`;

// Animation variants
const pageVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.43, 0.13, 0.23, 0.96],
    },
  },
};

/**
 * @brief Props for ClientLayout component
 */
interface ClientLayoutProps {
  /** @param {React.ReactNode} children - Page content to render */
  children: React.ReactNode;
}

/**
 * @brief ClientLayout component
 * 
 * Client-side layout wrapper for Next.js App Router pages. Provides header,
 * animated main content area with page transitions, and footer. Uses Framer
 * Motion for smooth animations.
 * 
 * @param {ClientLayoutProps} props - Component props
 * @returns {JSX.Element} The rendered layout component
 * 
 * @note This component is marked with "use client" directive
 * @note Uses NextHeader and Footer components
 * @note Main content includes fade and slide animations
 * @note Layout uses full viewport height with flexbox
 */
export default function ClientLayout({ children }: ClientLayoutProps) {
  return (
    <LayoutWrapper>
      <NextHeader />
      <Main initial="initial" animate="in" exit="exit" variants={pageVariants}>
        {children}
      </Main>
      <Footer />
    </LayoutWrapper>
  );
} 