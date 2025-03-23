import React from 'react';
import dynamic from 'next/dynamic';
import { HeaderSkeleton } from '../common/LoadingSkeleton';

// Dynamically import Header component with no SSR
const DynamicHeader = dynamic(
  () => import('./Header'),
  { 
    ssr: false,
    loading: () => <HeaderSkeleton />
  }
);

export default DynamicHeader; 