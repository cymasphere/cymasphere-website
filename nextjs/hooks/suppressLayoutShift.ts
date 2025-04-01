// This file is specifically used to suppress the useLayoutEffect warning in Next.js
import React from "react";

// Used in _app.ts to suppress the useLayoutEffect warning
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
