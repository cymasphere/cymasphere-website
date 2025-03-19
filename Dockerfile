# Build stage
FROM node:18-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy-peer-deps to handle TypeScript version conflicts
RUN npm ci --legacy-peer-deps

# Copy application code
COPY src/ ./src/
COPY public/ ./public/
COPY *.js ./
# Make tsconfig.json optional since it doesn't exist
RUN touch tsconfig.json

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy the build output to replace the default nginx contents
COPY --from=build /app/build /usr/share/nginx/html

# Expose port 3000
EXPOSE 3000

# Update nginx to listen on port 3000
RUN sed -i 's/listen\s*80;/listen 3000;/g' /etc/nginx/conf.d/default.conf

# Start Nginx
CMD ["nginx", "-g", "daemon off;"] 