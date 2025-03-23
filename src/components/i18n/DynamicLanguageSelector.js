import dynamic from 'next/dynamic';

// Import LanguageSelector dynamically to avoid SSR issues
const LanguageSelector = dynamic(() => import('./LanguageSelector'), {
  ssr: false
});

export default function DynamicLanguageSelector() {
  return <LanguageSelector />;
} 