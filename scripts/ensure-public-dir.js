const fs = require('fs');
const path = require('path');

// Define the directory structure
const dirs = [
  'public',
  'public/styles',
  'public/images',
  'public/audio'
];

// Define the files to create
const files = [
  { path: 'public/styles/main.css', content: `/* Main CSS file */
:root {
  --primary-color: #0070f3;
  --secondary-color: #1a1a1a;
}

body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}` },
  { path: 'public/images/.gitkeep', content: '' },
  { path: 'public/audio/.gitkeep', content: '' }
];

// Create directories
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`Created directory: ${dir}`);
  }
});

// Create files
files.forEach(file => {
  if (!fs.existsSync(file.path)) {
    fs.writeFileSync(file.path, file.content);
    console.log(`Created file: ${file.path}`);
  }
});

console.log('Public directory structure verified and created if necessary.'); 