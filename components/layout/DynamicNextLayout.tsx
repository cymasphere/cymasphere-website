/**
 * @fileoverview DynamicNextLayout Component
 * @module components/layout/DynamicNextLayout
 * 
 * Dynamically imported Next.js layout with optional header and footer.
 * Both header and footer are dynamically loaded with SSR disabled for
 * client-side features. Includes SEO meta tags and page transitions.
 * 
 * @example
 * // Basic usage
 * <DynamicNextLayout>
 *   <YourPageContent />
 * </DynamicNextLayout>
 * 
 * @example
 * // Custom title without header
 * <DynamicNextLayout 
 *   title="Custom Page" 
 *   showHeader={false} 
 * >
 *   <YourPageContent />
 * </DynamicNextLayout>
 */

import React from "react";
import dynamic from "next/dynamic";
import styled from "styled-components";
import { motion, Variants } from "framer-motion";
import Head from "next/head";

/**
 * @brief Dynamically imported header component
 * 
 * Header is dynamically imported with SSR disabled to support client-side
 * features like authentication state and interactive elements.
 */
const DynamicHeader = dynamic(() => import("./NextHeader"), { ssr: false });

/**
 * @brief Dynamically imported footer component
 * 
 * Footer is dynamically imported with SSR disabled to support client-side
 * features like modals and interactive elements.
 */
const NextFooter = dynamic(() => import("./NextFooter"), { ssr: false });

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

const pageVariants: Variants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
    transition: {
      duration: 0.4,
      ease: "easeInOut" as const,
    },
  },
  out: {
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut" as const,
    },
  },
};

/**
 * @brief Props for DynamicNextLayout component
 */
interface DynamicNextLayoutProps {
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
 * @brief DynamicNextLayout component
 * 
 * Next.js layout with dynamically loaded header and footer components.
 * Both components are loaded client-side only (SSR disabled) to support
 * interactive features. Includes SEO meta tags and smooth content transitions.
 * 
 * @param {DynamicNextLayoutProps} props - Component props
 * @returns {JSX.Element} The rendered layout component
 * 
 * @note Header and footer are dynamically imported with SSR: false
 * @note Default title includes SEO-optimized description
 * @note Content uses fade-in/fade-out animations
 */
const DynamicNextLayout: React.FC<DynamicNextLayoutProps> = ({
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

export default DynamicNextLayout;
