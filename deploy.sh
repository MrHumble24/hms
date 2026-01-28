#!/bin/bash

# Exit immediately if a command exits with a non-zero status
set -e

echo "🚀 Starting deployment..."

# Update the repository
echo "📥 Fetching and forcing sync with origin/main..."
git fetch origin
git reset --hard origin/main

# Build the API
echo "🔌 Building API & Running Migrations..."
cd api
pnpm install
npx prisma migrate deploy
npx prisma generate
pnpm build
cd ..

# Build the client
echo "💻 Building Client..."
cd client
pnpm install
pnpm build
cd ..

# Restart PM2
echo "🔄 Reloading PM2 processes..."
pm2 reload ecosystem.config.js --update-env

echo "✅ Deployment finished successfully!"