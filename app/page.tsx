/**
 * @fileoverview Homepage component with performance optimizations.
 * @module app/page
 * @description The main landing page featuring hero, features, pricing, FAQ, and contact sections.
 * Uses dynamic imports and lazy loading for non-critical sections to optimize First Contentful Paint (FCP).
 */

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

/**
 * @brief Reusable skeleton loading component for sections.
 * @description Provides a generic loading skeleton with customizable height
 * for use while sections are being loaded.
 * @param {Object} props - Component props.
 * @param {string} [props.height="600px"] - Height of the skeleton component.
 * @returns {JSX.Element} Skeleton loading component.
 */
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

/**
 * @brief Homepage component.
 * @description Renders the main landing page with hero section rendered immediately
 * and secondary sections lazy-loaded for performance optimization.
 * @returns {JSX.Element} Homepage with all sections.
 * @note Hero section is critical and rendered immediately with Suspense.
 * @note Secondary sections use dynamic imports to optimize FCP.
 */
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
