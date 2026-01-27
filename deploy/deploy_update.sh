#!/bin/bash

# Exit on error
set -e

APP_DIR=$(pwd)
CLIENT_BUILD_DEST="/var/www/hms-client"

echo "🔄 Starting Update Deployment..."

# 0. Pull Latest Code
echo "⬇️ Pulling latest changes from git..."
git pull origin main

# 1. Update API
echo "🔹 Updating API..."
cd "$APP_DIR/api"
npm install
npm run build
npx prisma migrate deploy

# Reload PM2
echo "🚀 Reloading API..."
pm2 reload hms-api

# 2. Update Client
echo "🔹 Updating Client..."
cd "$APP_DIR/client"
npm install
npm run build

# Deploy Client Files
echo "📂 Deploying Client files..."
rm -rf $CLIENT_BUILD_DEST/*
cp -r dist/* $CLIENT_BUILD_DEST/

echo "✅ Update Complete!"
