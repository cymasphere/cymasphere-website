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
  },

  // Fix for 500.html build issues
  experimental: {
    disableOptimizedLoading: true,
    runtime: 'nodejs'
  },

  // Consistent build ID
  generateBuildId: () => process.env.GIT_HASH || 'development',

  // Caching strategy
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      },
      {
        source: '/static/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }]
      }
    ];
  }
}

module.exports = nextConfig
