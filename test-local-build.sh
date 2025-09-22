#!/bin/bash

# Test local Docker builds for both services
echo "🔧 Testing local Docker builds..."

# Build backend
echo "Building backend..."
docker build -t personal-tracker-api:test ./api-service
if [ $? -eq 0 ]; then
    echo "✅ Backend build successful"
else
    echo "❌ Backend build failed"
    exit 1
fi

# Build frontend
echo "Building frontend..."
docker build -t personal-tracker-frontend:test ./web-frontend
if [ $? -eq 0 ]; then
    echo "✅ Frontend build successful"
else
    echo "❌ Frontend build failed"
    exit 1
fi

echo "🎉 All builds completed successfully!"
echo ""
echo "To test the builds:"
echo "1. Update docker-compose.staging.yml to use :test tags"
echo "2. Run: docker compose -f docker-compose.staging.yml up"
