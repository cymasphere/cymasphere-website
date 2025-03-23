# Deployment Guide for CymaSphere Next.js

This document outlines the various methods for deploying the Next.js version of the CymaSphere website.

## Prerequisites

- Node.js 16.x or higher
- npm or yarn
- Git
- (Optional) Docker for container deployment

## Deployment Methods

### 1. Standard Node.js Deployment

This method runs Next.js in production mode on a Node.js server.

```bash
# Clone the repository
git clone https://github.com/yourusername/cymasphere-website.git
cd cymasphere-website

# Install dependencies
npm install --legacy-peer-deps

# Build the application
npm run build

# Start the production server
npm run start
```

The server will start on port 3000 by default. You can configure the port with:

```bash
PORT=8080 npm run start
```

### 2. Container Deployment

This method packages the application in a Docker container for easy deployment anywhere Docker is supported.

```bash
# Build and run with our deployment script
./deploy-next.sh container

# Or manually:
docker build -f Dockerfile.next -t cymasphere-next:latest .
docker run -p 3000:3000 cymasphere-next:latest
```

#### Using with Docker Compose

Create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  cymasphere:
    build:
      context: .
      dockerfile: Dockerfile.next
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
```

Then run:

```bash
docker-compose up -d
```

### 3. Static Export

For hosting environments that don't support Node.js (like GitHub Pages, Netlify, or simple static hosting):

```bash
# Export as static HTML
./deploy-next.sh static

# Or manually:
npm run export
```

This will generate a static version of the site in the `out` directory, which can be deployed to any static hosting service.

### 4. Continuous Deployment Services

#### Vercel (Recommended for Next.js)

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your project on [Vercel](https://vercel.com)
3. Vercel will automatically detect Next.js and deploy it

#### Netlify

1. Push your code to GitHub/GitLab/Bitbucket
2. Import your project on [Netlify](https://netlify.com)
3. Set the build command to `npm run export`
4. Set the publish directory to `out`

## Environment Variables

For production deployment, make sure to set the following environment variables:

```
NODE_ENV=production
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
```

## Troubleshooting

### 1. Build Failures

If you encounter build failures:

```bash
# Clean the build directory
rm -rf .next out

# Force reinstall dependencies
npm ci --legacy-peer-deps

# Try building again
npm run build
```

### 2. Static Export Limitations

Remember that static export has limitations:

- No server-side rendering (SSR)
- No API routes
- No server-side environment variables

### 3. Docker Issues

If Docker deployment fails:

```bash
# Check Docker logs
docker logs <container-id>

# Shell into the container
docker exec -it <container-id> /bin/sh
```

## Performance Monitoring

To monitor your production Next.js application:

1. Enable built-in analytics in Vercel
2. Or add a tool like New Relic or Datadog
3. Set up status checks and alerts for your deployment

## Security Considerations

1. Always use HTTPS in production
2. Set appropriate security headers (configured in next.config.js)
3. Keep dependencies updated regularly
4. Consider enabling Content Security Policy (CSP) 