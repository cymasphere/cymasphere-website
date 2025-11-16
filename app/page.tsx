"use client";

// Performance optimized homepage
import { Suspense, lazy } from "react";
import HeroSection from "@/components/sections/HeroSection";
import dynamic from "next/dynamic";

// Lazy load non-critical sections with dynamic imports
const FeaturesSection = dynamic(() => import("@/components/sections/FeaturesSection"), {
  ssr: true,
  loading: () => <GenericSectionSkeleton height="600px" />,
});

const HowItWorksSection = dynamic(() => import("@/components/sections/HowItWorksSection"), {
  ssr: true,
  loading: () => <GenericSectionSkeleton height="800px" />,
});

const PricingSection = dynamic(() => import("@/components/sections/PricingSection"), {
  ssr: true,
  loading: () => <GenericSectionSkeleton height="800px" />,
});

const FAQSection = dynamic(() => import("@/components/sections/FAQSection"), {
  ssr: true,
  loading: () => <GenericSectionSkeleton height="600px" />,
});

const ContactSection = dynamic(() => import("@/components/sections/ContactSection"), {
  ssr: true,
  loading: () => <GenericSectionSkeleton height="500px" />,
});

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
      {/* Hero section is critical - render immediately */}
      <Suspense fallback={<GenericSectionSkeleton height="600px" />}>
        <HeroSection />
      </Suspense>
      
      {/* Secondary sections - lazy load to optimize FCP */}
      <FeaturesSection />
      <HowItWorksSection />
      <PricingSection />
      <FAQSection />
      <ContactSection />
    </>
  );
}
