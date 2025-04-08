// Basic standalone server script for Next.js
const { createServer } = require('node:http');
const { createReadStream } = require('node:fs');
const path = require('node:path');

const PORT = process.env.PORT || 3000;

// Check if Next.js app can be required
let nextHandler;
try {
  // Try to load the Next.js app
  const { default: next } = require('next');
  const app = next({ dev: false, dir: __dirname });
  nextHandler = app.getRequestHandler();
  app.prepare().then(() => {
    console.log('Next.js app loaded successfully');
  }).catch(err => {
    console.error('Failed to prepare Next.js app:', err);
    nextHandler = null;
  });
} catch (err) {
  console.warn('Could not load Next.js app, using fallback server:', err);
  nextHandler = null;
}

// Create a basic HTTP server
const server = createServer(async (req, res) => {
  try {
    // If Next.js handler is available, use it
    if (nextHandler) {
      await nextHandler(req, res);
      return;
    }

    // Fallback to basic static file serving
    if (req.url === '/' || req.url === '') {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
      res.end('<html><body><h1>Server is running</h1><p>Next.js app is not available.</p></body></html>');
      return;
    }

    // Serve 404 for unknown paths
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/html');
    res.end('<html><body><h1>404 - Not Found</h1></body></html>');
  } catch (error) {
    console.error('Error handling request:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/html');
    res.end('<html><body><h1>500 - Server Error</h1></body></html>');
  }
});

// Start the server
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);
}); 