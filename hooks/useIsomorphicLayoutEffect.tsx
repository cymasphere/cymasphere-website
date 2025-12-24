/**
 * @fileoverview Isomorphic layout effect hook for Next.js SSR compatibility.
 * @module hooks/useIsomorphicLayoutEffect
 * @description Provides a layout effect hook that works in both client and server environments.
 * Uses useLayoutEffect on the client side and falls back to useEffect during server-side rendering.
 */

import { useLayoutEffect, useEffect } from 'react';

/**
 * @brief Isomorphic layout effect hook.
 * @description Returns useLayoutEffect on the client side and useEffect during SSR.
 * This prevents React warnings about useLayoutEffect being used during server-side rendering.
 * @returns {typeof useLayoutEffect | typeof useEffect} The appropriate effect hook for the environment.
 * @note This is a common pattern in Next.js applications to avoid SSR warnings.
 * @example
 * useIsomorphicLayoutEffect(() => {
 *   // This runs synchronously on client, asynchronously on server
 *   updateDOM();
 * }, [dependencies]);
 */
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect; 