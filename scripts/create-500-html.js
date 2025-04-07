#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Creates a 500.html file in the necessary locations to prevent build errors
 */
function create500Html() {
  console.log('Creating 500.html files for build...');
  
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

  // Create the .next directory if it doesn't exist
  const nextDir = path.join(process.cwd(), '.next');
  if (!fs.existsSync(nextDir)) {
    fs.mkdirSync(nextDir, { recursive: true });
  }

  // Ensure the directories exist
  const serverPagesDir = path.join(nextDir, 'server', 'pages');
  const exportDir = path.join(nextDir, 'export');

  // Create all needed directories recursively
  const directories = [
    serverPagesDir,
    exportDir,
    path.join(serverPagesDir, '_next'),
    path.join(exportDir, '_next')
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create the 500.html file in both locations
  const filesToCreate = [
    path.join(serverPagesDir, '500.html'),
    path.join(exportDir, '500.html')
  ];

  filesToCreate.forEach(file => {
    try {
      fs.writeFileSync(file, content);
      console.log(`Created 500.html in ${file}`);
    } catch (err) {
      console.error(`Error creating ${file}:`, err);
    }
  });
  
  console.log('Successfully created 500.html files');
}

// Execute the function
create500Html(); 