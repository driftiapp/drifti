#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting GA4 Analytics System Deployment..."

# Check for required environment variables
if [ -z "$NEXT_PUBLIC_GA_ID" ]; then
    echo "❌ Error: NEXT_PUBLIC_GA_ID is not set"
    exit 1
fi

# Build the application
echo "📦 Building the application..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm run test

# Check for build errors
if [ $? -ne 0 ]; then
    echo "❌ Build failed"
    exit 1
fi

# Deploy to production
echo "🚀 Deploying to production..."
npm run start

# Verify deployment
echo "✅ Verifying deployment..."
curl -s http://localhost:3000/api/health | grep "ok" > /dev/null
if [ $? -ne 0 ]; then
    echo "❌ Health check failed"
    exit 1
fi

# Set up monitoring
echo "📊 Setting up monitoring..."
npm run setup-monitoring

# Configure alerts
echo "🔔 Configuring alerts..."
npm run setup-alerts

echo "✨ Deployment completed successfully!" 