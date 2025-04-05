/**
 * Server Health Verification Script
 * For AWS Lightsail connectivity debugging
 */

const http = require('http');
const os = require('os');
const { exec } = require('child_process');

// Port to listen on
const PORT = process.env.PORT || 3000;
// Hostname to bind to - important to use 0.0.0.0 to listen on all interfaces
const HOSTNAME = process.env.HOSTNAME || '0.0.0.0';

// Get network interfaces
function getNetworkInfo() {
  const interfaces = os.networkInterfaces();
  let result = "Network Interfaces:\n";
  
  for (const [name, netInterface] of Object.entries(interfaces)) {
    result += `Interface: ${name}\n`;
    netInterface.forEach(iface => {
      result += `  Address: ${iface.address} - ${iface.family} ${iface.internal ? '(internal)' : '(external)'}\n`;
    });
  }
  
  return result;
}

// Check if a port is in use
function checkPort(port) {
  return new Promise((resolve) => {
    exec(`netstat -tulpn | grep :${port}`, (error, stdout, stderr) => {
      resolve({
        inUse: !error && stdout.trim() !== '',
        details: error ? 'Not in use or netstat not available' : stdout
      });
    });
  });
}

// Create a simple web server
const server = http.createServer(async (req, res) => {
  // Basic request logging
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  
  // Check for health endpoint
  if (req.url === '/health' || req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }
  
  // Check for detailed diagnostics
  if (req.url === '/diagnostics') {
    const portStatus = await checkPort(PORT);
    
    const diagnosticInfo = {
      timestamp: new Date().toISOString(),
      hostname: os.hostname(),
      platform: os.platform(),
      architecture: os.arch(),
      nodeVersion: process.version,
      memory: {
        total: `${Math.round(os.totalmem() / (1024 * 1024))} MB`,
        free: `${Math.round(os.freemem() / (1024 * 1024))} MB`,
      },
      uptime: `${Math.floor(os.uptime() / 60)} minutes`,
      networkInterfaces: os.networkInterfaces(),
      port: {
        configured: PORT,
        status: portStatus
      },
      env: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        HOSTNAME: process.env.HOSTNAME
      }
    };
    
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(diagnosticInfo, null, 2));
    return;
  }
  
  // Default handler
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Server Health Check</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        pre { background: #f5f5f5; padding: 10px; border-radius: 5px; }
        .info { background: #e8f4f8; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Server is running!</h1>
      <div class="info">
        <p><strong>Server Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Hostname:</strong> ${os.hostname()}</p>
        <p><strong>Platform:</strong> ${os.platform()} (${os.arch()})</p>
        <p><strong>Node.js:</strong> ${process.version}</p>
        <p><strong>Server listening on:</strong> ${HOSTNAME}:${PORT}</p>
      </div>
      
      <h2>Network Information</h2>
      <pre>${getNetworkInfo()}</pre>
      
      <h2>Environment Variables</h2>
      <pre>
NODE_ENV: ${process.env.NODE_ENV || 'not set'}
PORT: ${process.env.PORT || 'not set'}
HOSTNAME: ${process.env.HOSTNAME || 'not set'}
      </pre>
      
      <p><a href="/diagnostics">View Detailed Diagnostics (JSON)</a></p>
    </body>
    </html>
  `);
});

// Start the server
server.listen(PORT, HOSTNAME, () => {
  console.log(`Server running at http://${HOSTNAME}:${PORT}/`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Detailed diagnostics available at http://${HOSTNAME}:${PORT}/diagnostics`);
  console.log(`Health check endpoint available at http://${HOSTNAME}:${PORT}/health`);
  console.log(`\nNetwork Information:\n${getNetworkInfo()}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
}); 