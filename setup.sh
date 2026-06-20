#!/bin/bash

# Mehram Video Generator - Setup & Run Script
# This script sets up the project and starts the server

set -e

echo "🎬 Mehram Video Generator - Setup Script"
echo "========================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
if [ ! -d "node_modules" ]; then
    npm install
    echo "✅ Dependencies installed successfully"
else
    echo "✅ Dependencies already installed"
fi
echo ""

# Build project
echo "🔨 Building project..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully"
else
    echo "❌ Build failed"
    exit 1
fi
echo ""

# Create output directory
echo "📁 Creating output directories..."
mkdir -p ./output/videos
mkdir -p ./output/thumbnails
mkdir -p ./output/temp
mkdir -p ./output/uploads
mkdir -p ./backups
echo "✅ Output directories created"
echo ""

# Check FFmpeg installation
if command -v ffmpeg &> /dev/null; then
    echo "✅ FFmpeg is installed: $(ffmpeg -version | head -n 1)"
else
    echo "⚠️ FFmpeg is not installed. Please install FFmpeg:"
    echo "   - Ubuntu/Debian: sudo apt-get install ffmpeg"
    echo "   - macOS: brew install ffmpeg"
    echo "   - Windows: https://ffmpeg.org/download.html"
    echo ""
fi
echo ""

# Display configuration
echo "⚙️ Configuration Summary:"
echo "   - Environment: $(grep NODE_ENV .env | cut -d '=' -f2)"
echo "   - Server: $(grep HOST .env | cut -d '=' -f2):$(grep PORT .env | cut -d '=' -f2)"
echo "   - Output Directory: $(grep VIDEO_OUTPUT_DIR .env | cut -d '=' -f2)"
echo "   - Quality: $(grep VIDEO_QUALITY .env | cut -d '=' -f2)"
echo "   - Max Concurrent Jobs: $(grep MAX_CONCURRENT_JOBS .env | cut -d '=' -f2)"
echo ""

# Start server
echo "🚀 Starting Mehram Video Generator..."
echo "📍 Server will be available at: http://localhost:$(grep PORT .env | cut -d '=' -f2)"
echo "📍 Health check: http://localhost:$(grep PORT .env | cut -d '=' -f2)/health"
echo "📍 API docs: http://localhost:$(grep PORT .env | cut -d '=' -f2)/api"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

npm run dev