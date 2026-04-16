/** @type {import('next').NextConfig} */

const nextConfig = {
  async redirects() {
    return [
      {
        source: "/profile",
        destination: "/settings",
        permanent: true,
      },
    ];
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  compiler: {
    styledComponents: true,
  },
  transpilePackages: ['react-icons'],
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb', // Increase limit to 10MB for file uploads
    },
  },
  // Exclude problematic symlinks from build
  outputFileTracingExcludes: {
    '*': [
      'cymasphere/svg_conv/**/*',
    ],
  },
};

module.exports = nextConfig;
