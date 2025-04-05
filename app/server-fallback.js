/**
 * Guaranteed-to-work fallback server
 * No dependencies or complex code
 */

const http = require('http');

// Simple server that always works
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  
  // Simple HTML response
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cymasphere - Fallback Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        .info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Cymasphere Website</h1>
      <div class="info">
        <p>This is a fallback server running in emergency mode.</p>
        <p>Server Time: ${new Date().toISOString()}</p>
        <p>Your application will be back online soon.</p>
      </div>
      
      <h2>Environment</h2>
      <pre>
NODE_ENV: ${process.env.NODE_ENV || 'not set'}
PORT: ${process.env.PORT || '3000'}  
HOSTNAME: ${process.env.HOSTNAME || '0.0.0.0'}
      </pre>
    </body>
    </html>
  `);
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Fallback server running at http://0.0.0.0:${PORT}/`);
}); 