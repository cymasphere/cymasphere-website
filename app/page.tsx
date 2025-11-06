"use client";

// Test deployment - automatic deployment working! 🚀
import { Suspense } from "react";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import PricingSection from "@/components/sections/PricingSection";
import FAQSection from "@/components/sections/FAQSection";
import ContactSection from "@/components/sections/ContactSection";

// Simple reusable skeleton for all sections
const GenericSectionSkeleton = ({ height = "600px" }: { height?: string }) => {
  const SkeletonBox = ({ h, w = "100%", style = {} }: { h: string, w?: string, style?: React.CSSProperties }) => (
    <div className="skeleton-loading" style={{ height: h, width: w, ...style }} />
  );

  return (
    <div style={{ padding: "100px 20px", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <SkeletonBox h="50px" w="40%" style={{ margin: "0 auto 20px" }} />
        <SkeletonBox h="30px" w="60%" style={{ margin: "0 auto" }} />
      </div>
      <SkeletonBox h={height} w="100%" />
    </div>
  );
};

export default function Home() {
  return (
    <>
      <Suspense fallback={<GenericSectionSkeleton height="600px" />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<GenericSectionSkeleton height="600px" />}>
        <FeaturesSection />
      </Suspense>
      <Suspense fallback={<GenericSectionSkeleton height="800px" />}>
        <HowItWorksSection />
      </Suspense>
      <Suspense fallback={<GenericSectionSkeleton height="800px" />}>
        <PricingSection />
      </Suspense>
      <Suspense fallback={<GenericSectionSkeleton height="600px" />}>
        <FAQSection />
      </Suspense>
      <Suspense fallback={<GenericSectionSkeleton height="500px" />}>
        <ContactSection />
      </Suspense>
    </>
  );
}
