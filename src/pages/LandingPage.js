import React from 'react';
import HeroSection from '../components/sections/HeroSection';
import FeaturesSection from '../components/sections/FeaturesSection';
import HowItWorksSection from '../components/sections/HowItWorksSection';
import ContactSection from '../components/sections/ContactSection';
import FAQSection from '../components/sections/FAQSection';
import PricingSection from '../components/sections/PricingSection';
// import TestimonialsSection from '../components/sections/TestimonialsSection';
import NextLayout from '../components/layout/NextLayout';

const LandingPage = () => {
  return (
    <NextLayout>
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      {/* <TestimonialsSection /> */}
      <FAQSection />
      <ContactSection />
    </NextLayout>
  );
};

export default LandingPage;
