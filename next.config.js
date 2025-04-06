/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  
  // Basic options
  reactStrictMode: true,
  swcMinify: true,
  
  // Disable typescript and eslint checks during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Enable styled-components
  compiler: {
    styledComponents: true,
  },
  
  // Disable image optimization for simpler deployment
  images: {
    unoptimized: true
  },
  
  // Force dynamic rendering
  env: {
    NEXT_DISABLE_PRERENDER: 'true',
  }
}

module.exports = nextConfig
