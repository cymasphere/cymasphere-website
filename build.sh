#!/bin/bash
echo "Building with Supabase credentials from .env.local..."
NEXT_LINT=false NODE_OPTIONS="--max-old-space-size=4096" bun run next build
