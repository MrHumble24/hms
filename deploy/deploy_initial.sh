#!/bin/bash

# Exit on error
set -e

APP_DIR="/root/projects/hms"
CLIENT_BUILD_DEST="/var/www/hms-client"

echo "🚀 Starting Initial Deployment from $APP_DIR"

# Check for .env in API
if [ ! -f "$APP_DIR/api/.env" ]; then
    echo "❌ Error: api/.env file not found!"
    echo "Please create api/.env and populate it with necessary variables (DATABASE_URL, etc.) before running this script."
    exit 1
fi

# 1. API Setup
echo "🔹 Setting up API..."
cd "$APP_DIR/api"
# Ensure pnpm runs build scripts (critical for bcrypt, nest, prisma)
pnpm config set ignore-scripts false
pnpm install
# Generate Prisma Client (Required for build)
npx prisma generate
pnpm run build
npx prisma migrate deploy

# Start PM2
echo "🚀 Starting API with PM2..."
# Check if pm2 process already exists to avoid errors, or just use atomic start/restart
pm2 describe hms-api > /dev/null 2>&1 && pm2 reload hms-api || pm2 start dist/main.js --name "hms-api"
pm2 save

# 2. Client Setup
echo "🔹 Setting up Client..."
cd "$APP_DIR/client"
pnpm install
pnpm run build

# Deploy Client Files
echo "📂 Deploying Client to $CLIENT_BUILD_DEST..."
sudo mkdir -p $CLIENT_BUILD_DEST
# Remove old files if any (be careful)
sudo rm -rf $CLIENT_BUILD_DEST/*
sudo cp -r dist/* $CLIENT_BUILD_DEST/

# 3. Nginx Configuration
echo "🌐 Configuring Nginx..."
# Ensure deploy directory path is correct relative to script or hardcoded
DEPLOY_CONFIG_DIR="$APP_DIR/deploy/nginx"

sudo cp "$DEPLOY_CONFIG_DIR/hms.centrify.uz.conf" /etc/nginx/sites-available/
sudo cp "$DEPLOY_CONFIG_DIR/api-hms.centrify.uz.conf" /etc/nginx/sites-available/

# Link sites
sudo ln -sf /etc/nginx/sites-available/hms.centrify.uz.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api-hms.centrify.uz.conf /etc/nginx/sites-enabled/

# Test Nginx
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx

# 4. SSL Certification
echo "🔒 Setting up SSL with Certbot..."
# Interactive or using flags if emails are provided. using --register-unsafely-without-email for automation or prompting user.
# Better to let the user run this manually or prompt them.
echo "Run the following command manually if you want to set up SSL now, or I can try to run it interactively."
read -p "Do you want to run certbot now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
    sudo certbot --nginx -d hms.centrify.uz -d api-hms.centrify.uz
fi

echo "✅ Deployment Complete!"
echo "Client: https://hms.centrify.uz"
echo "API: https://api-hms.centrify.uz"
