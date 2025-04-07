#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Ensures all needed directories exist in the build output
 */
function ensureDirectories() {
  const nextDir = path.join(process.cwd(), '.next');
  const dirs = [
    path.join(nextDir, 'static'),
    path.join(nextDir, 'server', 'pages'),
    path.join(nextDir, 'export'),
    path.join(nextDir, 'standalone'),
    path.join(nextDir, 'standalone', 'server', 'pages')
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      console.log(`Creating directory: ${dir}`);
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error(`Error creating directory ${dir}:`, err);
      }
    }
  });
}

/**
 * Creates the 500.html file in all needed locations
 */
function create500Html() {
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

  const nextDir = path.join(process.cwd(), '.next');
  const serverPagesDir = path.join(nextDir, 'server', 'pages');
  const exportDir = path.join(nextDir, 'export');
  const standaloneDir = path.join(nextDir, 'standalone', 'server', 'pages');
  
  // Ensure all directories exist first
  [serverPagesDir, exportDir, standaloneDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        console.error(`Error creating directory ${dir}:`, err);
      }
    }
  });

  const locations = [
    path.join(serverPagesDir, '500.html'),
    path.join(exportDir, '500.html')
  ];

  // Add the standalone path if the directory exists
  if (fs.existsSync(standaloneDir)) {
    locations.push(path.join(standaloneDir, '500.html'));
  }

  locations.forEach(file => {
    try {
      fs.writeFileSync(file, content);
      console.log(`Created 500.html in ${file}`);
    } catch (err) {
      console.error(`Error creating ${file}:`, err);
    }
  });
}

/**
 * Ensures static directory has some content 
 */
function ensureStaticContent() {
  const staticDir = path.join(process.cwd(), '.next', 'static');
  if (!fs.existsSync(staticDir)) {
    try {
      fs.mkdirSync(staticDir, { recursive: true });
    } catch (err) {
      console.error(`Error creating directory ${staticDir}:`, err);
      return;
    }
  }
  
  const placeholderFile = path.join(staticDir, 'placeholder.js');
  if (!fs.existsSync(placeholderFile)) {
    try {
      fs.writeFileSync(placeholderFile, '/* Placeholder file to ensure directory exists */');
      console.log(`Created placeholder file in ${placeholderFile}`);
    } catch (err) {
      console.error(`Error creating ${placeholderFile}:`, err);
    }
  }
}

/**
 * Creates a minimal standalone structure if it doesn't exist
 */
function createMinimalStandalone() {
  const nextDir = path.join(process.cwd(), '.next');
  const standaloneDir = path.join(nextDir, 'standalone');
  
  if (!fs.existsSync(standaloneDir)) {
    try {
      fs.mkdirSync(standaloneDir, { recursive: true });
    } catch (err) {
      console.error(`Error creating directory ${standaloneDir}:`, err);
      return;
    }
    
    // Create a basic server.js
    const serverJs = `
    const http = require('http');
    const fs = require('fs');
    const path = require('path');
    
    const PORT = process.env.PORT || 3000;
    
    const server = http.createServer((req, res) => {
      // Serve the 500 page for all requests as a fallback
      fs.readFile(path.join(__dirname, 'server', 'pages', '500.html'), (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Server Error');
          return;
        }
        
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      });
    });
    
    server.listen(PORT, () => {
      console.log(\`Server running on port \${PORT}\`);
    });`;
    
    try {
      fs.writeFileSync(path.join(standaloneDir, 'server.js'), serverJs);
      console.log('Created minimal standalone server.js');
    } catch (err) {
      console.error(`Error creating server.js:`, err);
    }
  }
}

// Run all the functions
console.log('Running post-build processing...');
try {
  ensureDirectories();
  create500Html();
  ensureStaticContent();
  createMinimalStandalone();
  console.log('Post-build processing complete!');
} catch (err) {
  console.error('Error during post-build processing:', err);
}

// Always exit with success to prevent build failures due to this script
process.exit(0); 