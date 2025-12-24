/**
 * @fileoverview DynamicLayout Component
 * @module components/layout/DynamicLayout
 * 
 * Dynamically imported layout component with loading state. Wraps the main
 * Layout component to enable code splitting and show a loading indicator
 * while the layout is being loaded.
 * 
 * @example
 * // Import and use
 * import DynamicLayout from "@/components/layout/DynamicLayout";
 * 
 * <DynamicLayout>
 *   <YourPageContent />
 * </DynamicLayout>
 */

import dynamic from "next/dynamic";
import LoadingComponent from "@/components/common/LoadingComponent";

/**
 * @brief LoadingLayout component
 * 
 * Displays a full-screen loading indicator while the main layout is being loaded.
 * 
 * @returns {JSX.Element} Full-screen loading component
 */
const LoadingLayout = () => (
  <div style={{ minHeight: "100vh", backgroundColor: "#121212" }}>
    <LoadingComponent fullScreen text="Loading..." />
  </div>
);

/**
 * @brief DynamicLayout component
 * 
 * Dynamically imports the main Layout component with code splitting.
 * Shows a loading state while the layout is being loaded.
 * 
 * @note Uses SSR: true to enable server-side rendering of the layout
 * @note Individual components within the layout can still use SSR: false
 */
const DynamicLayout = dynamic(() => import("./Layout"), {
  loading: () => <LoadingLayout />,
  // Using ssr: true here because we'll handle specific components with ssr: false
  ssr: true,
});

export default DynamicLayout;
