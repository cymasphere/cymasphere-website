"use client";

import { Suspense, lazy, useState, useEffect } from "react";
import dynamic from "next/dynamic";

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

// Dynamically import the actual sections with proper loading skeletons
const HeroSection = dynamic(() => import("@/components/sections/HeroSection"), {
  loading: () => <HeroSectionSkeleton />,
  ssr: false
});

const FeaturesSection = dynamic(() => import("@/components/sections/FeaturesSection"), {
  loading: () => <FeaturesSectionSkeleton />
});

const HowItWorksSection = dynamic(() => import("@/components/sections/HowItWorksSection"), {
  loading: () => <HowItWorksSectionSkeleton />
});

const PricingSection = dynamic(() => import("@/components/sections/PricingSection"), {
  loading: () => <GenericSectionSkeleton height="800px" />
});

const FAQSection = dynamic(() => import("@/components/sections/FAQSection"), {
  loading: () => <GenericSectionSkeleton height="600px" />
});

const ContactSection = dynamic(() => import("@/components/sections/ContactSection"), {
  loading: () => <GenericSectionSkeleton height="500px" />
});

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
