/**
 * @fileoverview Layout Component
 * @module components/layout/Layout
 * 
 * Main layout wrapper component for pages. Provides header, main content area,
 * and footer with page transition animations. Uses dynamic header loading for
 * client-side rendering optimization.
 * 
 * @example
 * // Basic usage
 * <Layout>
 *   <YourPageContent />
 * </Layout>
 */

import React from "react";
import styled from "styled-components";
import dynamic from "next/dynamic";
import Footer from "./Footer";
import { motion } from "framer-motion";

const DynamicHeader = dynamic(() => import("./NextHeader"), { ssr: false });

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
const pageVariants = {
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
 * @brief Props for Layout component
 */
interface LayoutProps {
  /** @param {React.ReactNode} children - Page content to render within the layout */
  children: React.ReactNode;
}

/**
 * @brief Layout component
 * 
 * Provides the main page structure with header, animated main content area,
 * and footer. Includes smooth page transition animations using Framer Motion.
 * 
 * @param {LayoutProps} props - Component props
 * @returns {JSX.Element} The rendered layout component
 * 
 * @note Header is dynamically imported with SSR disabled for client-side features
 * @note Main content uses Framer Motion for fade and slide animations
 * @note Layout uses full viewport height with flexbox for proper footer positioning
 */
const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <LayoutWrapper>
      <DynamicHeader />
      <Main initial="initial" animate="in" exit="exit" variants={pageVariants}>
        {children}
      </Main>
      <Footer />
    </LayoutWrapper>
  );
};

export default Layout;
