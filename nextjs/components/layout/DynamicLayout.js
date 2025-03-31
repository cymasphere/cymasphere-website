import dynamic from 'next/dynamic';

// A simple loading component
const LoadingLayout = () => (
  <div style={{ 
    minHeight: "100vh", 
    display: "flex", 
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "#121212" 
  }}>
    <div style={{ 
      width: "50px", 
      height: "50px", 
      border: "3px solid rgba(108, 99, 255, 0.2)",
      borderRadius: "50%", 
      borderTop: "3px solid #6c63ff", 
      animation: "spin 1s linear infinite" 
    }} />
    <style jsx>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// Dynamically import Layout with loading state
const DynamicLayout = dynamic(
  () => import('./Layout'),
  { 
    loading: () => <LoadingLayout />,
    // Using ssr: true here because we'll handle specific components with ssr: false
    ssr: true
  }
);

export default DynamicLayout; 