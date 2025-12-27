/** @type {import('next').NextConfig} */

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['react-icons'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit to 10MB for file uploads
    },
    // Disable Turbopack to avoid symlink issues
    turbo: false,
  },
  // Exclude problematic symlinks from build
  outputFileTracingExcludes: {
    '*': [
      'cymasphere/svg_conv/**/*',
    ],
  },
};

module.exports = nextConfig;
