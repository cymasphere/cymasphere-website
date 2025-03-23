import React from 'react';
import dynamic from 'next/dynamic';
import NextSEO from '../src/components/NextSEO';

// Components with browser-only APIs need to be dynamically imported with ssr:false
const DynamicNextLayout = dynamic(() => import('../src/components/layout/NextLayout'), { ssr: false });
const DynamicHeroSection = dynamic(() => import('../src/components/sections/HeroSection'), { ssr: false });
const FeaturesSection = dynamic(() => import('../src/components/sections/FeaturesSection'), { ssr: false });
const HowItWorksSection = dynamic(() => import('../src/components/sections/HowItWorksSection'), { ssr: false });
const PricingSection = dynamic(() => import('../src/components/sections/PricingSection'), { ssr: false });
const FAQSection = dynamic(() => import('../src/components/sections/FAQSection'), { ssr: false });
const ContactSection = dynamic(() => import('../src/components/sections/ContactSection'), { ssr: false });

export default function Home() {
  return (
    <DynamicNextLayout
      title="CymaSphere - Sound Therapy & Brainwave Entertainment"
      description="Experience the healing power of sound and light with CymaSphere. Our application uses science-backed techniques to help you relax, focus, and achieve deeper states of consciousness."
    >
      <NextSEO 
        title="CymaSphere - Sound Therapy & Brainwave Entertainment"
        description="Experience the healing power of sound and light with CymaSphere. Our application uses science-backed techniques to help you relax, focus, and achieve deeper states of consciousness."
        canonical="/"
      />
      <DynamicHeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <ContactSection />
    </DynamicNextLayout>
  );
} 