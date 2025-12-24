/**
 * @fileoverview Utility function to suppress useLayoutEffect warnings in Next.js SSR.
 * @module hooks/suppressLayoutShift
 * @description Provides a workaround for React's useLayoutEffect warning during
 * server-side rendering by overriding useLayoutEffect with useEffect on the server.
 * Used in _app.ts to suppress warnings.
 */

import React from "react";

/**
 * @brief Suppresses useLayoutEffect warnings during server-side rendering.
 * @description Overrides React.useLayoutEffect with React.useEffect when running
 * on the server (when window is undefined). This prevents React warnings about
 * useLayoutEffect being used during SSR.
 * @returns {void}
 * @note Only modifies behavior on the server side (when window is undefined).
 * @note Preserves the original useLayoutEffect reference for potential restoration.
 * @note Also creates mock HTMLElement implementations for SSR compatibility.
 * @example
 * // Call this in _app.ts before rendering
 * suppressLayoutShift();
 */
export const suppressLayoutShift = (): void => {
  if (typeof window === "undefined") {
    // Using any is necessary here as we're dealing with global object modification
    (global as unknown as Record<string, any>).HTMLElement = function () {};
    (global as unknown as Record<string, any>).HTMLElement.prototype = {};

    // Create a mock implementation for useLayoutEffect
    const originalUseLayoutEffect = React.useLayoutEffect;

    // Override the useLayoutEffect with useEffect for SSR
    React.useLayoutEffect = function (
      callback: () => void | (() => void),
      deps?: React.DependencyList
    ) {
      return React.useEffect(callback, deps);
    };

    // Keep a reference to the original so it can be restored if needed
    (React.useLayoutEffect as unknown as Record<string, unknown>)._original =
      originalUseLayoutEffect;
  }
};
