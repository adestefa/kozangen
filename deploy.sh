#!/bin/bash
# Simple VPS Deployment Script - Git Pull + Build

set -e

echo "🚀 Starting VPS deployment..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci

# Build application
echo "🔨 Building application..."
npm run build

# Start with PM2
echo "▶️  Starting application..."
if pm2 list | grep -q "kozangen"; then
    echo "Restarting existing kozangen process..."
    pm2 restart kozangen
else
    echo "Starting new kozangen process..."
    pm2 start npm --name "kozangen" -- start
fi

# Show status
pm2 show kozangen

echo "✅ Deployment complete!"
echo "🌐 Application available at: http://$(hostname -I | awk '{print $1}'):3000"