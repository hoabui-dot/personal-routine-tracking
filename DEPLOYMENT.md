# Deployment Guide

## Overview

This guide covers deploying the Personal Tracker application using Docker containers in a production environment. The application supports multi-platform deployment (ARM64/AMD64) and is optimized for AWS EC2 deployment.

## Prerequisites

- Docker and Docker Compose installed
- Access to a server (AWS EC2 t2.micro or higher)
- Docker Hub account for image hosting
- Basic knowledge of Linux command line

## Architecture

The application consists of:
- **Frontend**: Next.js application (port 3000) - Multi-stage build with standalone output
- **Backend**: Node.js API (port 4000) - TypeScript with Express
- **Database**: PostgreSQL 15 (port 5432) - With health checks and data persistence
- **Monitoring**: Dozzle for log viewing (port 5555) - Real-time container logs

## Multi-Platform Support

This application supports both ARM64 (Mac M1/M2) and AMD64 (AWS Linux) architectures through Docker buildx multi-platform builds.

## Deployment Steps

### 1. Local Development & Testing

```bash
# Test local build
./test-local-build.sh

# Test with test configuration
docker compose -f docker-compose.test.yml up -d
```

### 2. Build and Push Images

```bash
# Build and push multi-platform images to Docker Hub
./build-and-push.sh latest your-dockerhub-username

# Example:
./build-and-push.sh v1.0.0 vanhoadotbui2628
```

### 3. Server Setup (AWS EC2 Linux 2023)

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again for group changes to take effect
exit
```

### 4. Deploy Application on Server

```bash
# Clone repository or upload files
git clone <your-repo-url>
cd personal-tracker

# Or upload just the necessary files:
# - docker-compose.staging.yml
# - init-staging-db.sh
# - api-service/sql/ (directory with SQL files)

# Pull and start services
docker compose -f docker-compose.staging.yml pull
docker compose -f docker-compose.staging.yml up -d

# Wait for services to be healthy (check with docker ps)
docker ps

# Initialize database (IMPORTANT: Run this only once after first deployment)
chmod +x init-staging-db.sh
./init-staging-db.sh
```

### 5. Verify Deployment

```bash
# Check service status
docker compose -f docker-compose.staging.yml ps

# Test API health
curl http://localhost:4000/health

# Test frontend
curl -I http://localhost:3000

# View logs
docker compose -f docker-compose.staging.yml logs --tail 50
```

### 6. Access Application

- **Frontend**: http://your-server-ip:3000
- **Backend API**: http://your-server-ip:4000
- **API Health**: http://your-server-ip:4000/health
- **Logs Viewer**: http://your-server-ip:5555
