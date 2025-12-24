/**
 * @fileoverview Styled-components registry for Next.js server-side rendering.
 * @module app/registry
 * @description Ensures styled-components works properly with Next.js SSR by collecting
 * styles on the server and injecting them into the HTML head. Prevents style flashing
 * and ensures proper hydration.
 */

'use client';

import React, { useState } from 'react';
import { useServerInsertedHTML } from 'next/navigation';
import { ServerStyleSheet, StyleSheetManager } from 'styled-components';

/**
 * @brief Styled-components registry component.
 * @description Manages styled-components stylesheet for SSR compatibility.
 * Collects styles on the server and injects them into the HTML head.
 * Only uses StyleSheetManager on the server; returns children directly on the client.
 * @param {Object} props - Component props.
 * @param {React.ReactNode} props.children - Child components to wrap with styled-components registry.
 * @returns {JSX.Element} Children wrapped with StyleSheetManager on server, or children directly on client.
 * @note This is necessary to ensure styled-components works properly with SSR.
 * @note See: https://styled-components.com/docs/advanced#nextjs
 * @note Clears the stylesheet after collecting styles to prevent memory leaks.
 */
export default function StyledComponentsRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  // Only create stylesheet once with lazy initial state
  // x-ref: https://reactjs.org/docs/hooks-reference.html#lazy-initial-state
  const [styledComponentsStyleSheet] = useState(() => new ServerStyleSheet());

  useServerInsertedHTML(() => {
    const styles = styledComponentsStyleSheet.getStyleElement();
    // Important: Clear the sheet after collecting styles to prevent memory leaks
    styledComponentsStyleSheet.instance.clearTag();
    return <>{styles}</>;
  });

  // Only use StyleSheetManager on the server
  if (typeof window !== 'undefined') return <>{children}</>;

  return (
    <StyleSheetManager sheet={styledComponentsStyleSheet.instance} enableVendorPrefixes>
      {children}
    </StyleSheetManager>
  );
} 