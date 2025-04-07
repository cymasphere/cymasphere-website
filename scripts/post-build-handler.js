#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('Running post-build handler...');

// Create the content for the 500.html file
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

// Define the output locations for the 500.html file
const nextDir = path.join(process.cwd(), '.next');
const serverPagesDir = path.join(nextDir, 'server', 'pages');
const exportDir = path.join(nextDir, 'export');
const standalonePagesDir = path.join(nextDir, 'standalone', 'server', 'pages');

// Ensure all directories exist
[serverPagesDir, exportDir, path.dirname(standalonePagesDir)].forEach(dir => {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`Created directory: ${dir}`);
    } catch (err) {
      console.error(`Error creating directory ${dir}:`, err);
    }
  }
});

// Write the 500.html file to all locations (write directly rather than trying to rename/copy)
const targetPaths = [
  path.join(serverPagesDir, '500.html'),
  path.join(exportDir, '500.html')
];

// Also try the standalone directory if it exists
if (fs.existsSync(path.dirname(standalonePagesDir))) {
  targetPaths.push(path.join(standalonePagesDir, '500.html'));
}

targetPaths.forEach(filePath => {
  try {
    // Write directly to each location instead of trying to rename/copy
    fs.writeFileSync(filePath, content);
    console.log(`Successfully created: ${filePath}`);
  } catch (err) {
    console.error(`Error creating ${filePath}:`, err);
  }
});

console.log('Post-build handling completed');

// Always exit with success to prevent build failures due to this step
process.exit(0); 