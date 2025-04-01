import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import PricingSection from "@/components/sections/PricingSection";
import FAQSection from "@/components/sections/FAQSection";
import ContactSection from "@/components/sections/ContactSection";
import { Metadata } from "next";
import ScrollToTop from "@/components/ScrollToTop";
import Hero from "@/components/sections/Hero";

export const metadata: Metadata = {
  title: "Cymasphere",
  description: "Advanced Chord Generation",
};

export default function Home() {
  return (
    <>
      <ScrollToTop />
      <Hero />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      {/* <TestimonialsSection /> */}
      <FAQSection />
      <ContactSection />
    </>
  );
}
