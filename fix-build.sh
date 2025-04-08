#!/bin/bash
set -e

echo "🔧 Starting build environment setup script..."

# Create necessary directory structure
mkdir -p .next/static
mkdir -p .next/server/pages
mkdir -p .next/export
mkdir -p .next/standalone/server/pages
mkdir -p public

# Create dummy file in .next/static to prevent Docker build errors
echo "/* Placeholder file to ensure directory exists */" > .next/static/placeholder.js

# Create basic 500.html files in all required locations
cat > .next/server/pages/500.html << EOL
<!DOCTYPE html>
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
</html>
EOL

# Copy to other locations
cp .next/server/pages/500.html .next/export/500.html
cp .next/server/pages/500.html .next/standalone/server/pages/500.html

# Check for conflicting files
if [ -f "app/(root)/500/page.tsx" ] && [ -f "pages/500.js" ]; then
  echo "⚠️ Warning: Found conflicting 500 error pages:"
  echo "  - app/(root)/500/page.tsx"
  echo "  - pages/500.js"
  echo "This may cause build errors. Removing app/(root)/500/page.tsx..."
  rm -f "app/(root)/500/page.tsx"
fi

# Create simple public folder structure if it doesn't exist
if [ ! -f "public/favicon.ico" ]; then
  echo "Creating basic public files..."
  echo "/* Placeholder */" > public/placeholder.txt
fi

echo "✅ Build environment setup complete!"
echo "Run your build or Docker commands now." 