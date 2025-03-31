import { useEffect, useLayoutEffect } from 'react';

// Use a safe version of useLayoutEffect that falls back to useEffect in SSR
const useSafeLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default useSafeLayoutEffect; 