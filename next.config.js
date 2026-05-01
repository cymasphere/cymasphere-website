/** @type {import('next').NextConfig} */

/**
 * @brief Hostname for Supabase public storage URLs used with `next/image`.
 * @returns Supabase project host from `NEXT_PUBLIC_SUPABASE_URL`, or production fallback.
 */
function supabaseImageHostname() {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) {
    return "jibirpbauzqhdiwjlrmf.supabase.co";
  }
  try {
    return new URL(raw).hostname;
  } catch {
    return "jibirpbauzqhdiwjlrmf.supabase.co";
  }
}

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: supabaseImageHostname(),
        pathname: "/storage/**",
      },
    ],
  },
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
