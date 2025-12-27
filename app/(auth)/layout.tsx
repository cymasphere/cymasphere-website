/**
 * @fileoverview Authentication layout component with page transition animations.
 * @module app/(auth)/layout
 * @description Provides a layout wrapper for authentication pages (login, signup, etc.)
 * with smooth page transition animations using Framer Motion.
 */

"use client";

import React from "react";
import styled from "styled-components";
import { motion, Variants } from "framer-motion";

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
      ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number],
    },
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      duration: 0.3,
      ease: [0.43, 0.13, 0.23, 0.96] as [number, number, number, number],
    },
  },
};

/**
 * @brief Interface for AuthLayout component props.
 * @description Defines the props structure for the authentication layout component.
 */
interface LayoutProps {
  children: React.ReactNode;
}

/**
 * @brief Authentication layout component.
 * @description Wraps authentication pages with a layout container and smooth
 * page transition animations using Framer Motion.
 * @param {LayoutProps} props - Component props.
 * @param {React.ReactNode} props.children - Child components to render.
 * @returns {JSX.Element} Layout wrapper with page transitions.
 */
export default function AuthLayout({ children }: LayoutProps) {
  return (
    <LayoutWrapper>
      <Main initial="initial" animate="in" exit="exit" variants={pageVariants}>
        {children}
      </Main>
    </LayoutWrapper>
  );
}
