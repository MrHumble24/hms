# HMS Deployment Guide (PM2 Ecosystem)

This guide provides step-by-step instructions to deploy the HMS application using a robust **PM2 Ecosystem** configuration.

**Note:** Configuration has been updated to use **Ports 3002 (API)** and **3003 (Client)** to prevent conflicts with existing applications on ports 3000/5173.

## 1. Initial VPS Setup

Connect to your VPS and run the following commands to install necessary software.

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git build-essential nginx certbot python3-certbot-nginx

# Install Node.js (v20 LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PM2 and pnpm globally
sudo npm install -g pm2 pnpm
```

## 2. Project Setup

Clone your repository to the VPS.

```bash
mkdir -p ~/projects
cd ~/projects
git clone <YOUR_REPO_URL> hms
cd hms
```

## 3. Environment & Build

Navigate to the project directory to set up dependencies and build the apps.

### A. API Setup

```bash
cd ~/projects/hms/api

# Create .env
nano .env
# Paste your production env variables and save.
# IMPORTANT: You do NOT need to set PORT here, PM2 will set it to 3002.

# Install, Build, Migrate
pnpm config set ignore-scripts false
pnpm install --prod=false
pnpm rebuild
npx prisma generate
npx nest build
npx prisma migrate deploy
```

### B. Client Setup

```bash
cd ~/projects/hms/client

# Create Production Config
echo "VITE_API_URL=https://api-hms.centrify.uz" > .env.production

# Install & Build
pnpm install --prod=false
pnpm run build
```

## 4. Start with PM2 Ecosystem

We use `ecosystem.config.js` to manage both the Client (served on port **3003**) and the API (Cluster Mode, port **3002**).

```bash
cd ~/projects/hms

# Start the Ecosystem
pm2 start ecosystem.config.js

# Save configuration to restart on reboot
pm2 save
pm2 startup
```

## 5. Nginx Configuration

Since PM2 is managing the application servers, Nginx acts as a reverse proxy for both.

### A. Client Configuration (Proxy to Port 3003)

```bash
sudo nano /etc/nginx/sites-available/hms.centrify.uz.conf
```

**Content:**

```nginx
server {
    listen 80;
    server_name hms.centrify.uz;

    location / {
        proxy_pass http://localhost:3003; # Defined in ecosystem.config.js
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### B. API Configuration (Proxy to Port 3002)

```bash
sudo nano /etc/nginx/sites-available/api-hms.centrify.uz.conf
```

**Content:**

```nginx
server {
    listen 80;
    server_name api-hms.centrify.uz;

    location / {
        proxy_pass http://localhost:3002; # Defined in ecosystem.config.js
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

    client_max_body_size 10M;
}
```

### C. Enable & Secure

```bash
# Enable sites
sudo ln -sf /etc/nginx/sites-available/hms.centrify.uz.conf /etc/nginx/sites-enabled/
sudo ln -sf /etc/nginx/sites-available/api-hms.centrify.uz.conf /etc/nginx/sites-enabled/

# Test & Reload
sudo nginx -t
sudo systemctl reload nginx

# SSL Certificate
sudo certbot --nginx -d hms.centrify.uz -d api-hms.centrify.uz
```

---

**Deployment Complete!**

- **Client**: Served by PM2 (port 3003) -> Proxied by Nginx.
- **API**: Served by PM2 Cluster (port 3002) -> Proxied by Nginx.
