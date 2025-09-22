#!/bin/bash

# Build and push multi-platform Docker images
# Usage: ./build-and-push.sh [tag]

TAG=${1:-latest}
DOCKER_USERNAME="vanhoadotbui2628"

echo "Building and pushing multi-platform images with tag: $TAG"

# Create buildx builder if it doesn't exist
docker buildx create --name multiplatform --use 2>/dev/null || docker buildx use multiplatform

# Build and push backend
echo "Building backend..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t $DOCKER_USERNAME/personal-tracker-api:$TAG \
  --push \
  ./api-service

# Build and push frontend
echo "Building frontend..."
docker buildx build --platform linux/amd64,linux/arm64 \
  -t $DOCKER_USERNAME/personal-tracker-frontend:$TAG \
  --push \
  ./web-frontend

echo "Build and push completed!"
echo "Images pushed:"
echo "  - $DOCKER_USERNAME/personal-tracker-api:$TAG"
echo "  - $DOCKER_USERNAME/personal-tracker-frontend:$TAG"
