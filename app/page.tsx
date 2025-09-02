"use client";

import { Suspense, useState, useEffect } from "react";
import HeroSection from "@/components/sections/HeroSection";
import FeaturesSection from "@/components/sections/FeaturesSection";
import HowItWorksSection from "@/components/sections/HowItWorksSection";
import PricingSection from "@/components/sections/PricingSection";
import FAQSection from "@/components/sections/FAQSection";
import ContactSection from "@/components/sections/ContactSection";

// Hook to add a delay for testing the skeleton loading
const useLoadingDelay = (delay = 1000) => {
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return isLoading;
};

// Simple Skeleton Components
const SkeletonBox = ({ height, width = "100%", style = {} }: { height: string, width?: string, style?: React.CSSProperties }) => (
  <div className="skeleton-loading" style={{ height, width, ...style }} />
);

// Hero Section Skeleton
const HeroSectionSkeleton = () => (
  <div style={{ padding: "100px 20px", maxWidth: "1200px", margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
    <SkeletonBox height="60px" width="60%" style={{ marginBottom: "20px" }} />
    <SkeletonBox height="30px" width="80%" style={{ marginBottom: "40px" }} />
    <div style={{ display: "flex", gap: "20px", marginBottom: "60px" }}>
      <SkeletonBox height="50px" width="180px" />
      <SkeletonBox height="50px" width="180px" />
    </div>
    <SkeletonBox height="400px" width="100%" />
  </div>
);

// Features Section Skeleton
const FeaturesSectionSkeleton = () => (
  <div style={{ padding: "100px 20px", maxWidth: "1200px", margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: "50px" }}>
      <SkeletonBox height="50px" width="40%" style={{ margin: "0 auto 20px" }} />
      <SkeletonBox height="30px" width="60%" style={{ margin: "0 auto" }} />
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "30px" }}>
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} style={{ padding: "30px", borderRadius: "10px", background: "var(--card-bg)" }}>
          <SkeletonBox height="50px" width="50px" style={{ marginBottom: "20px" }} />
          <SkeletonBox height="30px" width="70%" style={{ marginBottom: "15px" }} />
          <SkeletonBox height="100px" width="100%" />
        </div>
      ))}
    </div>
  </div>
);

// How It Works Section Skeleton
const HowItWorksSectionSkeleton = () => (
  <GenericSectionSkeleton height="800px" />
);

// Generic Section Skeleton for simpler sections
const GenericSectionSkeleton = ({ height = "600px" }: { height?: string }) => (
  <div style={{ padding: "100px 20px", maxWidth: "1200px", margin: "0 auto" }}>
    <div style={{ textAlign: "center", marginBottom: "50px" }}>
      <SkeletonBox height="50px" width="40%" style={{ margin: "0 auto 20px" }} />
      <SkeletonBox height="30px" width="60%" style={{ margin: "0 auto" }} />
    </div>
    <SkeletonBox height={height} width="100%" />
  </div>
);

export default function Home() {
  // Force loading skeletons to be visible for debugging
  const isForceLoading = useLoadingDelay(2000);
  
  if (isForceLoading) {
    return (
      <>
        <HeroSectionSkeleton />
        <FeaturesSectionSkeleton />
        <HowItWorksSectionSkeleton />
        <GenericSectionSkeleton height="800px" /> {/* Pricing */}
        <GenericSectionSkeleton height="600px" /> {/* FAQ */}
        <GenericSectionSkeleton height="500px" /> {/* Contact */}
      </>
    );
  }

  return (
    <>
      <Suspense fallback={<HeroSectionSkeleton />}>
        <HeroSection />
      </Suspense>
      <Suspense fallback={<FeaturesSectionSkeleton />}>
        <FeaturesSection />
      </Suspense>
      <Suspense fallback={<HowItWorksSectionSkeleton />}>
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
