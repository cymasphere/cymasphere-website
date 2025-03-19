#!/bin/bash

echo "🔍 Finding React server processes..."
# Find any process running on port 3000 or 3001 that's related to node
NODE_PIDS=$(lsof -i :3000,3001 | grep node | awk '{print $2}')

if [ -z "$NODE_PIDS" ]; then
  echo "✅ No React development servers found running."
else
  echo "🛑 Found React development servers with PIDs: $NODE_PIDS"
  echo "Terminating processes..."
  
  # Kill each process
  for PID in $NODE_PIDS; do
    echo "Killing process $PID"
    kill -9 $PID
  done
  
  echo "✅ All React development servers terminated."
fi

# Also find and kill any other node processes that might be React servers
echo "🔍 Checking for other React server processes..."
REACT_SCRIPTS_PIDS=$(ps aux | grep "react-scripts" | grep -v grep | awk '{print $2}')

if [ -n "$REACT_SCRIPTS_PIDS" ]; then
  echo "🛑 Found additional React processes with PIDs: $REACT_SCRIPTS_PIDS"
  
  # Kill each process
  for PID in $REACT_SCRIPTS_PIDS; do
    echo "Killing process $PID"
    kill -9 $PID
  done
  
  echo "✅ Additional React processes terminated."
fi

# Wait a moment to ensure ports are freed
echo "⏳ Waiting for ports to be released..."
sleep 2

# Change to the project directory if needed
cd cymasphere-website || cd ./cymasphere-website || true

# Start a new server on port 3001
echo "🚀 Starting new React development server on port 3001..."
npm run start -- --port 3001

echo "✅ Done!" 