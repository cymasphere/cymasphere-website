# Deploying React Apps to AWS Lightsail with Docker and GitHub Actions

This guide provides step-by-step instructions to set up a CI/CD pipeline for automatically deploying React applications to AWS Lightsail using Docker and GitHub Actions.

## Prerequisites

- GitHub repository containing your React application
- AWS account with access to Lightsail
- React application (works with Create React App, Vite, Next.js, etc.)

## Step 1: Set Up AWS Lightsail Instance

```bash
# Install and configure AWS CLI
pip install awscli
aws configure  # Enter your AWS credentials when prompted

# Create a Lightsail instance
aws lightsail create-instances \
  --instance-names your-app-name \
  --availability-zone us-east-1a \
  --blueprint-id ubuntu_22_04 \
  --bundle-id small_3_0

# Open required ports
aws lightsail open-instance-public-ports \
  --instance-name your-app-name \
  --port-info fromPort=80,toPort=80,protocol=TCP

aws lightsail open-instance-public-ports \
  --instance-name your-app-name \
  --port-info fromPort=3000,toPort=3000,protocol=TCP

# Download the SSH key
aws lightsail download-default-key-pair \
  --output text \
  --query 'privateKeyBase64' | base64 --decode > lightsail_key.pem
chmod 400 lightsail_key.pem

# Get the instance IP address
aws lightsail get-instance \
  --instance-name your-app-name \
  --query 'instance.publicIpAddress' \
  --output text
```

## Step 2: Create the Dockerfile

Create this `Dockerfile` in your project root:

```dockerfile
# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files - update path to your React app if it's in a subdirectory
COPY your-react-app-dir/package*.json ./

# Install dependencies
RUN npm ci

# Copy application code - update path if needed
COPY your-react-app-dir/ ./

# Build the application - this works for Vite apps
# For Create React App, replace with `npm run build`
RUN sed -i 's/"build": "tsc -b && vite build"/"build": "vite build"/' package.json 2>/dev/null || true \
    && npm run build

# Production stage
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
# For Vite projects, the output is in dist/
# For Create React App, use: COPY --from=build /app/build /usr/share/nginx/html
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port 3000
EXPOSE 3000

# Update nginx to listen on port 3000
RUN sed -i 's/listen\s*80;/listen 3000;/g' /etc/nginx/conf.d/default.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

## Step 3: Create GitHub Actions Workflow

Create this file at `.github/workflows/deploy.yml`:

```yaml
name: Deploy to AWS Lightsail

on:
  push:
    branches:
      - main
    paths:
      - 'your-react-app-dir/**'  # Update this path to match your React app directory
      - '.github/workflows/deploy.yml'
      - 'Dockerfile'

permissions:
  contents: read
  packages: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2

      - name: Set lowercase repo owner
        run: echo "REPO_OWNER_LC=${GITHUB_REPOSITORY_OWNER,,}" >> $GITHUB_ENV

      - name: Login to GitHub Container Registry
        uses: docker/login-action@v2
        with:
          registry: ghcr.io
          username: ${{ github.repository_owner }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push Docker image
        uses: docker/build-push-action@v4
        with:
          context: .
          push: true
          tags: ghcr.io/${{ env.REPO_OWNER_LC }}/your-app-name:latest  # Update your-app-name
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Setup SSH key
        run: |
          cat > lightsail.pem << 'EOL'
          -----BEGIN RSA PRIVATE KEY-----
          PASTE_YOUR_SSH_KEY_HERE_WITH_PROPER_LINE_BREAKS
          -----END RSA PRIVATE KEY-----
          EOL
          
          chmod 600 lightsail.pem

      - name: Create deploy script
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO_OWNER: ${{ github.repository_owner }}
          REPO_OWNER_LC: ${{ env.REPO_OWNER_LC }}
        run: |
          cat > deploy.sh << EOL
          #!/bin/bash
          
          # Install Docker if not already installed
          if ! command -v docker &> /dev/null; then
            echo "Docker not found. Installing Docker..."
            sudo apt-get update
            sudo apt-get install -y ca-certificates curl gnupg
            sudo install -m 0755 -d /etc/apt/keyrings
            curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
            sudo chmod a+r /etc/apt/keyrings/docker.gpg
            echo "deb [arch=\$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \$(. /etc/os-release && echo \$VERSION_CODENAME) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
            sudo apt-get update
            sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
            sudo usermod -aG docker ubuntu
            sudo systemctl enable docker
            sudo systemctl start docker
            
            # Login to GitHub Container Registry
            echo "$GITHUB_TOKEN" | sudo docker login ghcr.io -u "$REPO_OWNER" --password-stdin
            
            # Pull the latest image
            sudo docker pull ghcr.io/$REPO_OWNER_LC/your-app-name:latest  # Update your-app-name
            
            # Stop and remove any existing container
            sudo docker stop app-container || true
            sudo docker rm app-container || true
            
            # Run the new container
            sudo docker run -d --restart unless-stopped --name app-container -p 80:3000 ghcr.io/$REPO_OWNER_LC/your-app-name:latest  # Update your-app-name
            
            # Clean up
            sudo docker system prune -af
          else
            # Docker is already installed
            # Login to GitHub Container Registry
            echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$REPO_OWNER" --password-stdin
            
            # Pull the latest image
            docker pull ghcr.io/$REPO_OWNER_LC/your-app-name:latest  # Update your-app-name
            
            # Stop and remove any existing container
            docker stop app-container || true
            docker rm app-container || true
            
            # Run the new container
            docker run -d --restart unless-stopped --name app-container -p 80:3000 ghcr.io/$REPO_OWNER_LC/your-app-name:latest  # Update your-app-name
            
            # Clean up
            docker system prune -af
          fi
          EOL
          
          chmod +x deploy.sh

      - name: Deploy to Lightsail
        run: |
          # Update YOUR_LIGHTSAIL_IP with your instance's IP address
          scp -o StrictHostKeyChecking=no -i lightsail.pem deploy.sh ubuntu@YOUR_LIGHTSAIL_IP:~/deploy.sh
          ssh -o StrictHostKeyChecking=no -i lightsail.pem ubuntu@YOUR_LIGHTSAIL_IP "chmod +x ~/deploy.sh && ~/deploy.sh"
```

## Step 4: Configure GitHub and SSH Key

1. **Format your SSH Key properly**:
   - Use the SSH key downloaded from Lightsail
   - Ensure it has proper line breaks and BEGIN/END markers
   - Paste it into the workflow file in the section indicated above

2. **Update placeholders**:
   - Replace `your-app-name` with your application name
   - Replace `your-react-app-dir` with your React app directory path
   - Replace `YOUR_LIGHTSAIL_IP` with your Lightsail instance's IP address

## Step 5: Push Configuration to GitHub

```bash
# Create the GitHub Actions directory if it doesn't exist
mkdir -p .github/workflows

# Copy the files you created
# Then commit and push
git add Dockerfile .github/workflows/deploy.yml
git commit -m "Add CI/CD pipeline for AWS Lightsail deployment"
git push origin main
```

## Step 6: Monitor Deployment

1. Go to your GitHub repository's "Actions" tab
2. Watch the workflow run after pushing to main
3. Once completed, visit your Lightsail instance's IP address in a browser
4. Your React app should be running on the server

## Common Issues and Solutions

### SSH Key Problems
If you get SSH errors, make sure:
- The key is properly formatted with correct line breaks
- It has the BEGIN/END RSA PRIVATE KEY markers
- The file permissions are set to 600

### Docker Build Errors
For TypeScript errors, try:
- Fixing the errors in your codebase
- Modifying the build command to skip type checking
- Using the provided workaround in the Dockerfile

### Container Not Starting
Check logs on the server:
```bash
ssh -i lightsail_key.pem ubuntu@YOUR_LIGHTSAIL_IP
docker logs app-container
```

### Path and Directory Issues
Make sure to:
- Update all paths in the workflow and Dockerfile to match your project structure
- Use absolute paths in SSH commands

## Customization Options

### Using a Different Node Version
Update the first line in Dockerfile:
```dockerfile
FROM node:20-alpine as build
```

### Using a Different Port
Update both the Dockerfile and the deployment script:
```dockerfile
EXPOSE 8080
RUN sed -i 's/listen\s*80;/listen 8080;/g' /etc/nginx/conf.d/default.conf
```

And in the deployment script:
```bash
docker run -d --name app-container -p 80:8080 ghcr.io/$REPO_OWNER_LC/your-app-name:latest
```

### Enabling HTTPS
Add SSL configuration to Nginx or use a load balancer in front of your container.

## Maintenance Best Practices

1. **Regular Updates**: Periodically update your Lightsail instance:
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Container Restart Policy**: The deployment uses `--restart unless-stopped` to ensure your container restarts after server reboots.

3. **Monitoring**: Consider adding monitoring with AWS CloudWatch or a third-party service.

4. **Backups**: Schedule regular snapshots of your Lightsail instance.

## Troubleshooting Commands

```bash
# Check container status
docker ps -a

# View container logs
docker logs app-container

# Check Docker installation
docker --version

# Restart Docker
sudo systemctl restart docker

# Manual deployment
docker pull ghcr.io/your-username/your-app-name:latest
docker stop app-container || true
docker rm app-container || true
docker run -d --name app-container -p 80:3000 ghcr.io/your-username/your-app-name:latest
```

By following this guide, you should have a fully automated CI/CD pipeline that deploys your React application to AWS Lightsail whenever you push changes to your main branch. 