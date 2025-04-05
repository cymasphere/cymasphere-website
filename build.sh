#!/bin/bash
rm -rf .next
export NEXT_PUBLIC_SUPABASE_URL="https://mock-project.supabase.co"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="mock-anon-key"
export NEXT_LINT=false
export NEXT_SKIP_TYPECHECKING=true
export NODE_OPTIONS="--max-old-space-size=4096"
echo "Building with Supabase mock credentials and optimized settings..."
bun run next build
