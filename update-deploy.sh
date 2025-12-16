#!/bin/bash

# Tipsio Update Deployment Script
# Server: 5.129.242.61
# Usage: ./update-deploy.sh

set -euo pipefail

SERVER="5.129.242.61"
USER="root"
APP_DIR="/opt/tipsio"

echo "🚀 Starting Tipsio update deployment..."
echo "📡 Connecting to ${SERVER}..."

# Execute update commands on server
ssh "${USER}@${SERVER}" "bash -s" << 'ENDSSH'
set -euo pipefail

APP_DIR="/opt/tipsio"

echo "📂 Navigating to project directory..."
cd "${APP_DIR}"

echo "📥 Pulling latest code from repository..."
git pull origin main

echo "🛑 Stopping current containers..."
docker-compose down

echo "🏗️  Building new containers (no cache)..."
docker-compose build --no-cache

echo "🚀 Starting containers..."
docker-compose up -d

echo "⏳ Waiting for services to start..."
sleep 10

echo "🗄️  Running database migrations..."
docker-compose exec -T app npx prisma migrate deploy

echo "✅ Checking container status..."
docker-compose ps

echo "📊 Checking application logs..."
docker-compose logs --tail=50 app

echo "✅ Update deployment complete!"
echo "🌐 Application should be running now"

ENDSSH

echo "🎉 Done! Deployment updated successfully."
