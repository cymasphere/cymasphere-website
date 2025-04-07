/** @type {import("next").NextConfig} */
const fs = require('fs');
const path = require('path');

// This function creates a 500.html file in the necessary locations to avoid the build error
const create500Html = () => {
  if (process.env.NEXT_SKIP_500_ERROR === 'true') {
    const content = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>500 - Server Error</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 2rem; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; }
    .container { max-width: 600px; text-align: center; }
    h1 { font-size: 2rem; margin-bottom: 1rem; }
    p { color: #666; margin-bottom: 1.5rem; }
    button { background: #3b82f6; color: white; border: none; padding: 0.5rem 1.5rem; border-radius: 0.375rem; cursor: pointer; font-size: 1rem; }
  </style>
</head>
<body>
  <div class="container">
    <h1>500 - Server Error</h1>
    <p>We're sorry, but something went wrong on our server.</p>
    <button onclick="window.location.href='/'">Go back home</button>
  </div>
</body>
</html>`;

    // Ensure the directories exist
    const serverDir = path.join(process.cwd(), '.next', 'server', 'pages');
    const exportDir = path.join(process.cwd(), '.next', 'export');

    try {
      if (!fs.existsSync(serverDir)) {
        fs.mkdirSync(serverDir, { recursive: true });
      }

      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }

      // Create the 500.html file in both locations
      fs.writeFileSync(path.join(serverDir, '500.html'), content);
      fs.writeFileSync(path.join(exportDir, '500.html'), content);
      
      console.log('Created 500.html files to prevent build error');
    } catch (err) {
      console.error('Error creating 500.html files:', err);
    }
  }
};

const nextConfig = {
  output: "standalone",
  compiler: { styledComponents: true },
  images: { unoptimized: true },
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  // Consistent build ID generation
  generateBuildId: () => process.env.GIT_HASH || "development",
  // Disable static optimization for error pages to avoid the rename issue
  experimental: {
    // Disable static optimization for error pages
    disableOptimizedLoading: true,
    // Skip trailing slash redirect to avoid conflicts
    skipTrailingSlashRedirect: true,
    // Skip middleware URL normalization
    skipMiddlewareUrlNormalize: true,
    // Enable runtime JS for error pages
    runtime: 'nodejs',
    // Set a long timeout for static page generation
    staticPageGenerationTimeout: 1000
  },
  // Caching strategy
  async headers() {
    return [
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      },
      {
        source: "/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }]
      }
    ];
  },
  // Run custom function during build
  webpack: (config, { isServer, dev }) => {
    if (isServer && !dev) {
      create500Html();
    }
    return config;
  }
};

module.exports = nextConfig;
