#!/bin/bash
PORT=${1:-3000}
echo "Starting Next.js server on port $PORT..."
NEXT_TELEMETRY_DISABLED=1 bun run next start -p $PORT
