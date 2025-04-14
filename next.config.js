/** @type {import('next').NextConfig} */

const nextConfig = {
  output: 'standalone',
  eslint: {
    ignoreDuringBuilds: true,
  },
  compiler: {
    styledComponents: true,
  },
  webpack: (config) => {
    // Add null-loader for CSS files
    config.module.rules.push({
      test: /\.css$/,
      use: 'null-loader'
    });
    
    return config;
  }
};

module.exports = nextConfig; 