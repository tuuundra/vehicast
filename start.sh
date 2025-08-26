#!/bin/bash

# Start the application (both frontend and backend)
echo "Starting Automotive Parts Prediction & Inventory Optimization application..."

# Check if Python virtual environment exists
if [ -d "venv" ]; then
    # Activate virtual environment
    echo "Activating Python virtual environment..."
    source venv/bin/activate
else
    echo "Warning: Python virtual environment not found. Using system Python."
fi

# Check if node_modules exists in the root directory
if [ ! -d "node_modules" ]; then
    echo "Installing root dependencies..."
    npm install
fi

# Check if node_modules exists in the frontend directory
if [ ! -d "frontend/node_modules" ]; then
    echo "Installing frontend dependencies..."
    cd frontend && npm install && cd ..
fi

# Check if Redis is running
redis_running=$(pgrep -x redis-server || true)
if [ -z "$redis_running" ]; then
    echo "Starting Redis server..."
    if command -v brew &> /dev/null; then
        brew services start redis || echo "Failed to start Redis. Please install it with: brew install redis"
    else
        echo "Homebrew not found. Please ensure Redis is installed and running."
    fi
fi

# Kill any processes using our ports (more robust approach)
echo "Cleaning up any existing processes..."
# Find and kill processes using FLASK_PORT
for pid in $(lsof -t -i:${FLASK_PORT:-5001} 2>/dev/null); do
    echo "Killing process $pid using port ${FLASK_PORT:-5001}"
    kill -9 $pid 2>/dev/null || true
done

# Find and kill processes using WEBSOCKET_PORT
for pid in $(lsof -t -i:${WEBSOCKET_PORT:-8765} 2>/dev/null); do
    echo "Killing process $pid using port ${WEBSOCKET_PORT:-8765}"
    kill -9 $pid 2>/dev/null || true
done

# Wait for ports to be released
sleep 2

# Verify ports are free
if lsof -i:${FLASK_PORT:-5001} >/dev/null 2>&1; then
    echo "ERROR: Port ${FLASK_PORT:-5001} is still in use. Please restart your computer or manually kill the process."
    exit 1
fi

if lsof -i:${WEBSOCKET_PORT:-8765} >/dev/null 2>&1; then
    echo "ERROR: Port ${WEBSOCKET_PORT:-8765} is still in use. Please restart your computer or manually kill the process."
    exit 1
fi

echo "Ports are clear. Starting servers..."

# Start the WebSocket server in the background
echo "Starting WebSocket server..."
nohup python websocket_server.py > websocket.log 2>&1 &
websocket_pid=$!
echo "WebSocket server started with PID: $websocket_pid"

# Give WebSocket server time to initialize
sleep 2

# Monitor WebSocket server log for errors
if grep -q "TypeError: handle_websocket()" websocket.log; then
    echo "ERROR: WebSocket server has a signature error. Fixing the issue..."
    # Update the websocket_server.py file to fix the signature
    sed -i '' 's/async def handle_websocket(websocket, path):/async def handle_websocket(websocket):/' websocket_server.py
    
    # Restart the WebSocket server
    kill -9 $websocket_pid
    sleep 1
    nohup python websocket_server.py > websocket.log 2>&1 &
    websocket_pid=$!
    echo "WebSocket server restarted with fixed code and PID: $websocket_pid"
    sleep 2
fi

# Start the application using the dev script (Flask backend + frontend)
echo "Starting Flask and frontend..."
npm run dev

# Note: This will keep running until you press Ctrl+C
# Clean up when script is terminated
trap "echo 'Shutting down servers...'; kill $websocket_pid 2>/dev/null || true" EXIT 