import { useLayoutEffect, useEffect } from 'react';

// Use useLayoutEffect on client side, fallback to useEffect during SSR
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useIsomorphicLayoutEffect; 