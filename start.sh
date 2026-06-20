#!/bin/bash

# Mehram Video Generator - Quick Start Script
# Run this after npm install && npm run build

set -e

echo "🎬 Starting Mehram Video Generator..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Run 'npm install' first."
    exit 1
fi

# Check if dist exists
if [ ! -d "dist" ]; then
    echo "❌ Project not built. Run 'npm run build' first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Read configuration from .env
PORT=$(grep ^PORT .env | cut -d '=' -f2)
HOST=$(grep ^HOST .env | cut -d '=' -f2)
NODE_ENV=$(grep ^NODE_ENV .env | cut -d '=' -f2)

echo "⚙️ Configuration:"
echo "   - Environment: $NODE_ENV"
echo "   - Host: $HOST"
echo "   - Port: $PORT"
echo ""

echo "🚀 Starting server..."
echo "📍 Access at: http://$HOST:$PORT"
echo "📍 Health check: http://$HOST:$PORT/health"
echo "📍 API: http://$HOST:$PORT/api"
echo ""
echo "Press Ctrl+C to stop"
echo ""

node dist/index.js