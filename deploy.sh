#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting deployment..."

# Update the repository
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📥 Fetching and forcing sync with origin/$CURRENT_BRANCH..."
git fetch origin
git reset --hard "origin/$CURRENT_BRANCH"

# Build the API
echo "🔌 Building API & Running Migrations..."
cd api
rm -rf dist
pnpm install
npx prisma migrate deploy
npx prisma generate
pnpm build
cd ..

# Build the client
echo "💻 Building Client..."
cd client
rm -rf dist
pnpm install
pnpm build
cd ..

# Restart PM2
echo "🔄 Restarting PM2 processes for fresh state..."
# Using restart instead of reload to guarantee environment and code refresh
pm2 delete all || true
pm2 start ecosystem.config.js --update-env

echo "✅ Deployment finished successfully!"
echo "💡 Tip: If you still see old changes, please clear your browser cache (Ctrl+F5)."