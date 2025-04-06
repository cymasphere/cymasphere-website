/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Completely disable static page generation
  staticPageGenerationTimeout: 0,
  
  reactStrictMode: true,
  swcMinify: true,
  
  // Add experimental flags needed for Next.js 15
  experimental: {
    // Force dynamic rendering for all routes
    appDocumentPreloading: false,
    optimizeCss: true
  },

  // Force dynamic rendering for everything
  env: {
    NEXT_DISABLE_PRERENDER: 'true',
  },

  // Remove any references to serverComponentsExternalPackages
}

export default nextConfig;
