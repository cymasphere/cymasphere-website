import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import PricingSection from "@/components/sections/PricingSection";
import FAQSection from "@/components/sections/FAQSection";
import ContactSection from "@/components/sections/ContactSection";
import { Metadata } from "next";
import ScrollToTop from "@/components/ScrollToTop";
import HeroSection from "@/components/sections/HeroSection";

export const metadata: Metadata = {
  title: "Cymasphere",
  description: "Advanced Chord Generation",
};

export default function Home() {
  return (
    <>
      <ScrollToTop />
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      {/* <TestimonialsSection /> */}
      <FAQSection />
      <ContactSection />
    </>
  );
}
