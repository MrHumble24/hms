# HMS Deployment Guide

This guide provides step-by-step instructions to manually deploy the HMS application to a VPS (Ubuntu 20.04/22.04/24.04).

## 1. Initial VPS Setup

Connect to your VPS and run the following commands to install necessary software.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git build-essential unzip nginx certbot python3-certbot-nginx

# Install Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 and pnpm globally
sudo npm install -g pm2 pnpm

# Create directory for client static files
sudo mkdir -p /var/www/hms-client
sudo chown -R $USER:$USER /var/www/hms-client
```

## 2. Project Setup

Clone your repository to the VPS (e.g., in `~/projects/hms`).

```bash
mkdir -p ~/projects
cd ~/projects
git clone <YOUR_REPO_URL> hms
cd hms
```

## 3. API Deployment

Navigate to the `api` directory and set up the backend.

### A. Environment Variables

Create the `.env` file with your production database credentials.

```bash
cd ~/projects/hms/api
nano .env
```

_Paste your `.env` content (DATABASE_URL, JWT_SECRET, etc.) and save (Ctrl+O, Enter, Ctrl+X)._

### B. Install & Build

```bash
# Allow pnpm to run build scripts
pnpm config set ignore-scripts false

# Install dependencies
pnpm install --prod=false

# Rebuild dependencies (ensure bcrypt/etc work)
pnpm rebuild

# Generate Prisma Client
npx prisma generate

# Build the NestJS app
npx nest build

# Run Database Migrations
npx prisma migrate deploy
```

### C. Start with PM2

```bash
# Start the API
pm2 start dist/main.js --name "hms-api"

# Save PM2 list so it restarts on reboot
pm2 save
pm2 startup
```

## 4. Client Deployment

Navigate to the `client` directory and build the frontend.

```bash
cd ~/projects/hms/client

# Install dependencies
pnpm install --prod=false

# Build the project
pnpm run build
```

### Deploy Files

Copy the built files to the Nginx web directory.

```bash
# Clear old files
sudo rm -rf /var/www/hms-client/*

# Copy new files (dist folder contents)
sudo cp -r dist/* /var/www/hms-client/
```

## 5. Nginx Configuration

You need to create two server blocks: one for the client (main domain) and one for the API (subdomain).

### A. Client Configuration

Create the file:

```bash
sudo nano /etc/nginx/sites-available/hms.centrify.uz.conf
```

Paste the following content:

```nginx
server {
    listen 80;
    server_name hms.centrify.uz;

    root /var/www/hms-client;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, no-transform";
    }

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

### B. API Configuration

Create the file:

```bash
sudo nano /etc/nginx/sites-available/api-hms.centrify.uz.conf
```

Paste the following content:

```nginx
server {
    listen 80;
    server_name api-hms.centrify.uz;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Forward IP headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Increase body size for file uploads if needed
    client_max_body_size 10M;
}
```

### C. Enable Sites & Restart Nginx

```bash
# Enable sites
sudo ln -sf /etc/nginx/sites-available/hms.centrify.uz.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api-hms.centrify.uz.conf /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 6. SSL Setup (HTTPS)

Secure your domains using Certbot.

```bash
sudo certbot --nginx -d hms.centrify.uz -d api-hms.centrify.uz
```

Follow the on-screen instructions. Certbot will automatically update your Nginx configs to use HTTPS.

---

**Deployment Complete!**

- Client: https://hms.centrify.uz
- API: https://api-hms.centrify.uz
