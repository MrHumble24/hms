# Deployment Scripts for HMS

This directory contains scripts to help you deploy the HMS application to a VPS server (e.g., Ubuntu/Debian).

## Prerequisites

- A VPS with a fresh OS (preferable Ubuntu 20.04/22.04).
- Root or Sudo access.
- Domain names pointing to the VPS IP:
  - `hms.centrify.uz`
  - `api-hms.centrify.uz`

## 1. Initial VPS Setup

Run this script once on your fresh VPS to install Nginx, Node.js, PM2, and Certbot.

```bash
cd deploy
./setup_vps.sh
```

## 2. Configuration

Before deploying, ensure you have your `.env` file ready for the API.
Create `api/.env` and populate it with your production secrets.

## 3. Initial Deployment

Run this script to deploy the application for the first time. It will build the apps, configure Nginx, specific SSL certs, and start the processes.

```bash
./deploy_initial.sh
```

## 4. Updates

To update the application after pushing changes to git, run:

```bash
./deploy_update.sh
```

## Directory Structure

- `nginx/`: Contains Nginx server block configurations.
- `setup_vps.sh`: Installs system dependencies.
- `deploy_initial.sh`: First-time deployment logic.
- `deploy_update.sh`: Routine update logic.
