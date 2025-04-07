import dynamic from "next/dynamic";
import LoadingComponent from "@/components/common/LoadingComponent";

// A simple loading component for layout
const LoadingLayout = () => (
  <div style={{ minHeight: "100vh", backgroundColor: "#121212" }}>
    <LoadingComponent fullScreen text="Loading..." />
  </div>
);

// Dynamically import Layout with loading state
const DynamicLayout = dynamic(() => import("./Layout"), {
  loading: () => <LoadingLayout />,
  // Using ssr: true here because we'll handle specific components with ssr: false
  ssr: true,
});

export default DynamicLayout;
