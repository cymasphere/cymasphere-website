/**
 * @fileoverview NextLayout Component
 * @module components/layout/NextLayout
 * 
 * Next.js-optimized layout component with optional header and footer.
 * Includes SEO meta tags, page title management, and smooth content transitions.
 * 
 * @example
 * // Basic usage
 * <NextLayout>
 *   <YourPageContent />
 * </NextLayout>
 * 
 * @example
 * // Without header and footer
 * <NextLayout 
 *   title="Custom Page Title" 
 *   showHeader={false} 
 *   showFooter={false} 
 * >
 *   <YourPageContent />
 * </NextLayout>
 */

import React from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import { motion } from "framer-motion";
import Head from "next/head";
import NextFooter from "./NextFooter";

const DynamicHeader = dynamic(() => import("./NextHeader"), { ssr: false });

const Main = styled.main`
  min-height: calc(100vh - 60px); // Adjust for footer height
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const ContentWrapper = styled(motion.div)`
  flex: 1;
  width: 100%;
`;

const pageVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeInOut",
    },
  },
  out: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut",
    },
  },
};

/**
 * @brief Props for NextLayout component
 */
interface NextLayoutProps {
  /** @param {React.ReactNode} children - Page content to render */
  children: React.ReactNode;
  /** @param {string} [title] - Page title for SEO and browser tab */
  title?: string;
  /** @param {boolean} [showHeader=true] - Whether to display the header */
  showHeader?: boolean;
  /** @param {boolean} [showFooter=true] - Whether to display the footer */
  showFooter?: boolean;
}

/**
 * @brief NextLayout component
 * 
 * Next.js-optimized layout wrapper with configurable header and footer display.
 * Includes SEO meta tags, viewport configuration, and smooth fade transitions
 * for page content.
 * 
 * @param {NextLayoutProps} props - Component props
 * @returns {JSX.Element} The rendered layout component
 * 
 * @note Header is dynamically imported with SSR disabled
 * @note Default title includes SEO-optimized description
 * @note Content uses fade-in/fade-out animations for smooth transitions
 */
const NextLayout: React.FC<NextLayoutProps> = ({
  children,
  title = "CYMASPHERE - Sound Therapy & Brainwave Entertainment",
  showHeader = true,
  showFooter = true,
}) => {
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1"
        />
        <meta
          name="description"
          content="CYMASPHERE offers sound therapy and brainwave entertainment through advanced frequency technology. Experience immersive soundscapes designed to enhance meditation, focus, creativity, and relaxation."
        />
      </Head>

      <Main>
        {showHeader && <DynamicHeader />}

        <ContentWrapper
          initial="initial"
          animate="in"
          exit="out"
          variants={pageVariants}
        >
          {children}
        </ContentWrapper>

        {showFooter && <NextFooter />}
      </Main>
    </>
  );
};

export default NextLayout;
