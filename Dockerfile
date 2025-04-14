FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Build stage: build the application
FROM base AS builder
WORKDIR /app

# Copy necessary files
COPY . .

# Copy node_modules from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Ensure directories exist
RUN mkdir -p public
RUN mkdir -p .next

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Set the correct permission for prerender cache
RUN mkdir -p .next
RUN mkdir -p public
RUN chown nextjs:nodejs .next
RUN chown nextjs:nodejs public

# Copy necessary files from the build output
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"] 