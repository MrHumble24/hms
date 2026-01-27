#!/bin/bash

# Exit on error
set -e

# Resolve paths dynamically based on script location
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
APP_DIR="$(dirname "$SCRIPT_DIR")"
CLIENT_BUILD_DEST="/var/www/hms-client"

echo "🔄 Starting Update Deployment..."

# 0. Pull Latest Code
echo "⬇️ Pulling latest changes from git..."
cd "$APP_DIR" || exit
git pull origin main

# 1. Update API
echo "🔹 Updating API..."
cd "$APP_DIR/api"

pnpm config set ignore-scripts false --global
# Install ALL dependencies (including devDependencies)
pnpm install --prod=false
pnpm rebuild
npx prisma generate

echo "🏗 Building API Project..."
npx nest build || { echo "❌ 'nest build' failed"; exit 1; }

if [ ! -f "dist/main.js" ]; then
    echo "❌ Error: API Build failed! dist/main.js not found."
    exit 1
fi

npx prisma migrate deploy

# Reload PM2
echo "🚀 Reloading API..."
pm2 reload hms-api

# 2. Update Client
echo "🔹 Updating Client..."
cd "$APP_DIR/client"
pnpm install
pnpm run build

# Deploy Client Files
echo "📂 Deploying Client files to $CLIENT_BUILD_DEST..."
# Ensure destination exists
sudo mkdir -p $CLIENT_BUILD_DEST
# Clean old build files (safe because we are targeting /var/www/...)
sudo rm -rf $CLIENT_BUILD_DEST/*
sudo cp -r dist/* $CLIENT_BUILD_DEST/

echo "✅ Update Complete!"
