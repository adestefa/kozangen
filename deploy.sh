#!/bin/bash
# Kozangen NextJS VPS Deployment Script

set -e

echo "🚀 Starting Kozangen NextJS v1.0.0 deployment..."

# Configuration
APP_NAME="kozangen-nextjs"
DOCKER_IMAGE="$APP_NAME:latest"
CONTAINER_NAME="$APP_NAME-container"

# Build the Docker image
echo "📦 Building Docker image..."
docker build -t $DOCKER_IMAGE .

# Stop and remove existing container if it exists
echo "🔄 Stopping existing container..."
docker stop $CONTAINER_NAME 2>/dev/null || true
docker rm $CONTAINER_NAME 2>/dev/null || true

# Create required directories if they don't exist
echo "📁 Creating required directories..."
mkdir -p ./data
mkdir -p ./input/models
mkdir -p ./input/outfits
mkdir -p ./static/results

# Set proper permissions
chmod 755 ./data ./input ./static
chmod -R 644 ./input/models ./input/outfits 2>/dev/null || true

# Run the new container
echo "🚀 Starting new container..."
docker run -d \
  --name $CONTAINER_NAME \
  --restart unless-stopped \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/input:/app/input \
  -v $(pwd)/static:/app/static \
  -e NODE_ENV=production \
  -e PORT=3000 \
  $DOCKER_IMAGE

# Wait for container to start
echo "⏳ Waiting for container to start..."
sleep 5

# Check if container is running
if docker ps | grep -q $CONTAINER_NAME; then
  echo "✅ Deployment successful!"
  echo "📍 Application running at: http://localhost:3000"
  echo "📊 Container status:"
  docker ps | grep $CONTAINER_NAME
  echo ""
  echo "🔍 View logs with: docker logs $CONTAINER_NAME"
  echo "🛑 Stop with: docker stop $CONTAINER_NAME"
else
  echo "❌ Deployment failed!"
  echo "📋 Container logs:"
  docker logs $CONTAINER_NAME
  exit 1
fi