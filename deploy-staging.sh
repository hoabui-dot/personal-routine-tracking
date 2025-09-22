#!/bin/bash

# Deployment script for staging environment
# Usage: ./deploy-staging.sh

echo "🚀 Starting staging deployment..."

# Pull latest images
echo "📥 Pulling latest images..."
docker compose -f docker-compose.staging.yml pull

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.staging.yml down

# Start services
echo "▶️ Starting services..."
docker compose -f docker-compose.staging.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service status
echo "🔍 Checking service status..."
docker compose -f docker-compose.staging.yml ps

# Show logs
echo "📋 Recent logs:"
docker compose -f docker-compose.staging.yml logs --tail=20

echo "✅ Deployment completed!"
echo ""
echo "🌐 Services available at:"
echo "  - Frontend: http://localhost:3000"
echo "  - Backend API: http://localhost:4000"
echo "  - Database: localhost:5432"
echo "  - Dozzle (Logs): http://localhost:5555"
echo ""
echo "📊 To monitor logs: docker compose -f docker-compose.staging.yml logs -f"
