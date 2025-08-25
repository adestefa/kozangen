#!/bin/bash
# Remote VPS Deployment Script for Kozangen v1.0.0

set -e

echo "🚀 Starting remote deployment to VPS..."

# Configuration
VPS_HOST="kozangen"
VPS_USER="root"
PROJECT_DIR="/opt/kozangen"
REPO_URL="https://github.com/adestefa/kozangen.git"

echo "📡 Connecting to VPS: $VPS_HOST"

# Execute deployment on remote VPS
ssh -o StrictHostKeyChecking=no $VPS_USER@$VPS_HOST << 'ENDSSH'

echo "🔧 Setting up deployment environment..."

# Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "📦 Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    systemctl enable docker
    systemctl start docker
else
    echo "✅ Docker already installed"
fi

# Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null; then
    echo "📦 Installing Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
else
    echo "✅ Docker Compose already installed"
fi

# Create project directory
mkdir -p /opt/kozangen
cd /opt/kozangen

# Clone or update repository
if [ -d "kozangen" ]; then
    echo "🔄 Updating existing repository..."
    cd kozangen
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone https://github.com/adestefa/kozangen.git
    cd kozangen
fi

# Already in the NextJS app directory
echo "📁 Current directory: $(pwd)"
echo "📂 Contents:"
ls -la

# Install ALL dependencies (dev dependencies needed for build)
echo "📦 Installing all dependencies..."
npm ci

# Make deploy script executable
chmod +x deploy.sh

echo "🚀 Starting deployment..."
./deploy.sh

echo "✅ Deployment completed!"

# Show final status
echo "📊 Container status:"
docker ps | head -1
docker ps | grep kozangen || echo "No kozangen containers running"

echo "🌐 Application should be available at: http://$(curl -s ifconfig.me):3000"

ENDSSH

echo "🎉 Remote deployment completed!"
echo "📍 Check your VPS at: ssh $VPS_USER@$VPS_HOST"