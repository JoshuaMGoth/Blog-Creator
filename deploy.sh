#!/bin/bash
# Simple deployment script for VPS
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code from main..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Reload PM2 app (zero-downtime)
echo "🔄 Reloading PM2 app..."
pm2 reload ecosystem.config.js --env production

# Save PM2 process list
pm2 save

# Show status
echo "✅ Deployment complete!"
echo ""
pm2 status
echo ""
git log -1 --oneline
