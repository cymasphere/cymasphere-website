import dynamic from 'next/dynamic';

// Use this to dynamically import components that use useLayoutEffect
// to avoid SSR warnings
export const withNoSSR = (Component) => 
  dynamic(() => Promise.resolve(Component), { ssr: false });

// For components that should still render a skeleton/loading state during SSR
export const withDynamicImport = (importFunc, loadingComponent = null) =>
  dynamic(importFunc, { 
    loading: () => loadingComponent,
  });

// Example usage:
// const ClientOnlyComponent = withNoSSR(ComponentWithLayoutEffect);
// const DynamicComponent = withDynamicImport(() => import('../components/HeavyComponent'), <LoadingSkeleton />); 