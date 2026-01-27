#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting VPS Setup for HMS Project..."

# 1. Update and Upgrade System
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Essentials
echo "🛠 Installing essential tools..."
sudo apt-get install -y curl git build-essential unzip

# 3. Install Node.js (v20 LTS)
echo "🟢 Installing Node.js v20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node installation
node -v
npm -v

# 4. Install PM2 globally
echo "🚀 Installing PM2..."
sudo npm install -g pm2

# 5. Install Nginx
echo "🌐 Installing Nginx..."
sudo apt-get install -y nginx

# 6. Install Certbot
echo "🔒 Installing Certbot..."
sudo apt-get install -y certbot python3-certbot-nginx

# 7. Setup Directory Structure
echo "📂 Creating web directories..."
sudo mkdir -p /var/www/hms-client

# Permissions (Assuming current user will deploy)
USER_NAME=$(whoami)
sudo chown -R $USER_NAME:$USER_NAME /var/www/hms-client

echo "✅ VPS Setup Complete! You are ready to run the deployment scripts."
