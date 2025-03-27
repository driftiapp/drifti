#!/bin/bash

# Function to check if MongoDB is running
check_mongodb() {
    if ! mongod --version > /dev/null 2>&1; then
        echo "❌ MongoDB is not installed. Please install MongoDB first."
        exit 1
    fi

    if ! pgrep -x "mongod" > /dev/null; then
        echo "Starting MongoDB..."
        mongod --dbpath ./data/db &
        sleep 5
    fi
}

# Function to check if Node.js and npm are installed
check_node() {
    if ! node --version > /dev/null 2>&1; then
        echo "❌ Node.js is not installed. Please install Node.js first."
        exit 1
    fi

    if ! npm --version > /dev/null 2>&1; then
        echo "❌ npm is not installed. Please install npm first."
        exit 1
    fi
}

# Function to install dependencies
install_dependencies() {
    echo "Installing backend dependencies..."
    cd backend && npm install
    
    echo "Installing frontend dependencies..."
    cd ../frontend && npm install
    
    cd ..
}

# Function to check and create necessary directories
setup_directories() {
    # Create data directory for MongoDB
    mkdir -p data/db
    
    # Create uploads directory for file storage
    mkdir -p backend/uploads
    
    # Create logs directory
    mkdir -p logs
}

# Function to start the development servers
start_servers() {
    # Start backend server
    echo "Starting backend server..."
    cd backend && npm run dev &
    
    # Wait for backend to start
    sleep 5
    
    # Start frontend server
    echo "Starting frontend server..."
    cd ../frontend && npm run dev &
    
    # Wait for all background processes
    wait
}

# Main execution
echo "🚀 Starting Drifti development environment..."

# Check requirements
check_node
check_mongodb

# Setup directories
echo "Setting up directories..."
setup_directories

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    install_dependencies
fi

# Start development servers
start_servers

# Print success message
echo "
✅ Drifti development environment is running!

Frontend: http://localhost:3000
Backend:  http://localhost:5000
API Docs: http://localhost:5000/api-docs

Press Ctrl+C to stop all servers.
"

# Wait for Ctrl+C
trap "echo 'Shutting down servers...' && pkill -P $$" SIGINT SIGTERM EXIT

# Keep script running
wait 