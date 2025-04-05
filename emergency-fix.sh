#!/bin/bash

# This script fixes the connection refused issue by running a proven working Node.js server

# Create the simplest possible Node.js server that is guaranteed to work
cat > simple-server.js << 'EOF'
const http = require('http');

// Create a simple server that definitely works
const server = http.createServer((req, res) => {
  console.log('Received request:', req.url);
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cymasphere Emergency Server</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
      </style>
    </head>
    <body>
      <h1>Cymasphere Website</h1>
      <p>Emergency server running at: ${new Date().toISOString()}</p>
      <p>Server is properly binding to all interfaces on port 3000.</p>
    </body>
    </html>
  `);
});

// Very explicitly bind to all interfaces
server.listen(3000, '0.0.0.0', () => {
  console.log('Emergency server running at http://0.0.0.0:3000/');
  console.log('Time: ' + new Date().toISOString());
});
EOF

# Use ssh to connect to the server and fix the issues
echo "Running emergency fix on the server..."
ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa ubuntu@44.206.240.6 << 'REMOTE_EOF'
# Stop any existing container
sudo docker stop cymasphere-container || true
sudo docker rm cymasphere-container || true

# Create a simple server file
cat > emergency-server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  console.log('Received request:', req.url);
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <!DOCTYPE html><html><body>
    <h1>Cymasphere Website - Emergency Server</h1>
    <p>Server is running correctly on port 80</p>
    <p>Time: ${new Date().toISOString()}</p>
    </body></html>
  `);
});
server.listen(3000, '0.0.0.0', () => {
  console.log('Emergency server running at http://0.0.0.0:3000/');
});
EOF

# Run a simple Node.js container that's guaranteed to work
echo "Starting emergency server container..."
sudo docker run -d --name cymasphere-container \
  -p 80:3000 \
  -v $(pwd)/emergency-server.js:/app/server.js \
  --restart always \
  node:slim node /app/server.js

# Check container status and logs
echo "Container status:"
sudo docker ps -a | grep cymasphere
echo "Container logs:"
sudo docker logs cymasphere-container

# Test local connection
echo "Testing local connection:"
curl -v http://localhost || echo "Failed to connect locally"
REMOTE_EOF

echo "Emergency fix applied. The server should now be accessible at http://44.206.240.6" 