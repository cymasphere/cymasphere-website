#!/bin/bash

# Exit if any command fails
set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting deployment process for Next.js app...${NC}"

# Clean the build directory
echo -e "${YELLOW}Cleaning previous build...${NC}"
rm -rf .next out

# Install dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
npm install --legacy-peer-deps

# Build the app
echo -e "${YELLOW}Building the Next.js app...${NC}"
npm run build

# Check if DEPLOY_TARGET is set to 'container'
if [ "$1" = "container" ]; then
  echo -e "${YELLOW}Building Docker container...${NC}"
  
  # Check if Docker is installed
  if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed. Please install Docker to continue.${NC}"
    exit 1
  fi
  
  # Build the Docker image
  docker build -f Dockerfile.next -t cymasphere-next:latest .
  
  echo -e "${GREEN}Container build complete!${NC}"
  echo -e "${BLUE}To run the container:${NC}"
  echo -e "docker run -p 3000:3000 cymasphere-next:latest"
  
elif [ "$1" = "static" ]; then
  # Export as static HTML
  echo -e "${YELLOW}Exporting as static HTML...${NC}"
  npm run export
  
  # Create .nojekyll file for GitHub Pages
  touch out/.nojekyll
  
  echo -e "${GREEN}Static export complete!${NC}"
  echo -e "${BLUE}Static files are in the 'out' directory.${NC}"
  
else
  # Default to standard production build
  echo -e "${YELLOW}Starting production server...${NC}"
  npm run start
fi

echo -e "${GREEN}Deployment process complete!${NC}" 