#!/bin/bash

# This script will be run in the GitHub Actions workflow to directly fix the server

echo "=== EMERGENCY FIX FOR WEBSITE ==="

# Create a guaranteed working Node.js server script
cat > minimal-server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Cymasphere - Emergency Mode</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .alert { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
      </style>
    </head>
    <body>
      <h1>Cymasphere Website</h1>
      <div class="alert">
        <p><strong>Emergency Mode:</strong> The site is currently running on a temporary server while we resolve technical issues.</p>
        <p>Server time: ${new Date().toISOString()}</p>
      </div>
      <p>We apologize for the inconvenience. Our team has been notified and is working to restore full functionality.</p>
    </body>
    </html>
  `);
});

// IMPORTANT: Explicitly listen on all interfaces with port 3000
server.listen(3000, '0.0.0.0', () => {
  console.log('Emergency server running at http://0.0.0.0:3000');
});
EOF

# Create a Dockerfile for the emergency server
cat > Dockerfile.emergency << 'EOF'
FROM node:slim
WORKDIR /app
COPY minimal-server.js /app/server.js
EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
CMD ["node", "/app/server.js"]
EOF

# Add the following to the GitHub workflow file:
echo "
# In your GitHub Actions workflow:

      - name: Build emergency container
        run: |
          docker build -t emergency-server -f Dockerfile.emergency .
      
      - name: Deploy emergency container to Lightsail
        run: |
          ssh -o StrictHostKeyChecking=no -i ~/.ssh/id_rsa ubuntu@\${{ secrets.LIGHTSAIL_IP }} << 'ENDSSH'
          # Stop any existing containers
          sudo docker stop cymasphere-container || true
          sudo docker rm cymasphere-container || true
          
          # Login to GitHub registry
          echo \"\${{ secrets.GITHUB_TOKEN }}\" | sudo docker login ghcr.io -u \"\${{ github.repository_owner }}\" --password-stdin
          
          # Pull and run our emergency image
          sudo docker pull ghcr.io/\${{ env.REPO_OWNER_LC }}/emergency-server:latest
          sudo docker run -d --restart always --name cymasphere-container -p 80:3000 -p 3000:3000 ghcr.io/\${{ env.REPO_OWNER_LC }}/emergency-server:latest
          
          # Check container status
          sudo docker ps -a | grep cymasphere
          sleep 5
          sudo docker logs cymasphere-container
          ENDSSH
"

echo "=== EMERGENCY FIX PREPARED ==="
echo "To use this fix:"
echo "1. Add the Docker build and deployment steps to your GitHub Actions workflow"
echo "2. Push the changes to GitHub to trigger the workflow"
echo "3. The emergency server will be deployed, ensuring your site is at least accessible" 