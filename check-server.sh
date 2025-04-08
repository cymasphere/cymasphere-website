#!/bin/bash

# This script runs diagnostics on the Lightsail server

echo "=== BEGINNING SERVER DIAGNOSTICS ==="

# Create minimal standalone server that's guaranteed to work
cat > minimal-server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Server is working!');
});

server.listen(3000, '0.0.0.0', () => {
  console.log('MINIMAL TEST SERVER RUNNING ON 0.0.0.0:3000');
});
EOF

# SSH to the server and run diagnostics
ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa ubuntu@44.206.240.6 << 'ENDSSH'
echo "=== CHECKING DOCKER STATUS ==="
sudo systemctl status docker

echo "=== CHECKING CONTAINER STATUS ==="
sudo docker ps -a

echo "=== CHECKING CONTAINER LOGS ==="
sudo docker logs cymasphere-container 2>&1 | tail -50

echo "=== CHECKING LISTENING PORTS ==="
sudo netstat -tulpn | grep LISTEN || echo "netstat not found"
sudo ss -tulpn | grep LISTEN || echo "ss not found"

echo "=== CHECKING FIREWALL STATUS ==="
sudo ufw status || echo "ufw not found"
sudo iptables -L -n || echo "iptables not found"

echo "=== TRYING TO START TEST SERVER ==="
echo "Stopping any existing containers..."
sudo docker stop cymasphere-test 2>/dev/null || true
sudo docker rm cymasphere-test 2>/dev/null || true

# Create a simple test container
cat > test-server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end('Test server is working!');
});

server.listen(3000, '0.0.0.0', () => {
  console.log('TEST SERVER RUNNING ON 0.0.0.0:3000');
});
EOF

echo "Running test container..."
sudo docker run -d --name cymasphere-test -p 80:3000 -v $(pwd)/test-server.js:/app/server.js node:slim node /app/server.js

echo "Checking test container status..."
sleep 5
sudo docker ps -a | grep cymasphere-test
sudo docker logs cymasphere-test

echo "Trying to curl the test server..."
curl -v http://localhost:80
ENDSSH

echo "=== DIAGNOSTICS COMPLETE ==="
echo "Attempting to connect to the server from local machine..."
curl -v http://44.206.240.6

# Clean up temporary files
rm minimal-server.js test-server.js 