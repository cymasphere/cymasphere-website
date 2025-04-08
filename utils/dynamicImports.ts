import dynamic from "next/dynamic";
import React from "react";

/**
 * Wraps a component to disable server-side rendering
 * Useful for components that need to access browser-only APIs
 */
export function withNoSSR<P>(
  Component: React.ComponentType<P>
): React.ComponentType<P> {
  return dynamic(() => Promise.resolve(Component), {
    ssr: false,
  });
}
