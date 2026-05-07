#!/bin/bash

# Music Room - Quick Start Script
# This script sets up and runs the Music Room application

set -e

echo "🎵 Music Room - Quick Start"
echo "============================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Setup Backend
echo "📦 Setting up Backend..."
cd backend

if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "📝 Created .env file - please edit with your API keys"
    echo "   Important: Set JWT_SECRET to a random string"
fi

if [ ! -d "node_modules" ]; then
    npm install
fi

echo "✅ Backend setup complete"
echo ""

# Setup Frontend
echo "📦 Setting up Frontend..."
cd ../frontend

if [ ! -d "node_modules" ]; then
    npm install
fi

echo "✅ Frontend setup complete"
echo ""

# Start servers
echo "🚀 Starting servers..."
echo ""

# Start backend in background
cd ../backend
echo "🎵 Starting Backend on http://localhost:5000..."
npm run dev &
BACKEND_PID=$!

# Give backend time to start
sleep 2

# Start frontend
cd ../frontend
echo "🎵 Starting Frontend on http://localhost:3000..."
echo ""
echo "📝 Open your browser to http://localhost:3000"
echo "💡 Press Ctrl+C to stop servers"
echo ""

npm run dev

# Kill backend when frontend stops
kill $BACKEND_PID
