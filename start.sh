#!/bin/bash

# Script to kill all running servers and restart the cymasphere-website server
# Created for the Cymasphere project

# Function for restarting the script
restart_script() {
  echo ""
  echo "🔄 Restarting server..."
  echo ""
  exec "$0"
}

echo "----------------------------------------"
echo "🔄 Cymasphere Server Manager Script 🔄"
echo "----------------------------------------"

# Function to find and kill processes on specific ports
kill_process_on_port() {
  local port=$1
  local pid=$(lsof -t -i:$port)
  
  if [ -n "$pid" ]; then
    echo "🛑 Found process running on port $port (PID: $pid). Killing it..."
    kill -9 $pid
    echo "✅ Process killed successfully."
  else
    echo "ℹ️ No process found running on port $port."
  fi
}

# Function to find and kill processes by name
kill_process_by_name() {
  local process_name=$1
  local pids=$(pgrep -f "$process_name")
  
  if [ -n "$pids" ]; then
    echo "🛑 Found processes matching '$process_name'. Killing them..."
    pkill -f "$process_name"
    echo "✅ Processes killed successfully."
  else
    echo "ℹ️ No processes found matching '$process_name'."
  fi
}

# Clean up function to be called on exit
cleanup() {
  echo ""
  echo "🧹 Cleaning up..."
  
  # Kill the npm start process if it's still running
  if [ -n "$SERVER_PID" ]; then
    echo "Stopping server (PID: $SERVER_PID)..."
    kill -TERM $SERVER_PID >/dev/null 2>&1 || true
  fi
  
  # Remove temporary log file
  rm -f "$TEMP_LOG_FILE"
  
  echo "✅ Cleanup complete."
}

# Register cleanup on script exit
trap cleanup EXIT

# Kill processes on common development ports
echo "⏳ Checking for running servers..."
kill_process_on_port 3000  # React default
kill_process_on_port 8080  # Alternative web port
kill_process_on_port 4000  # API/GraphQL port

# Kill node/npm related processes that might be running the server
echo "⏳ Checking for lingering Node.js processes..."
kill_process_by_name "react-scripts start"
kill_process_by_name "node.*cymasphere-website"

# Clear any npm process errors
echo "🧹 Cleaning npm cache..."
npm cache clean --force 2>/dev/null

# Navigate to the cymasphere-website directory (in case script is run from elsewhere)
script_dir=$(dirname "$0")
cd "$script_dir"
echo "📁 Changed directory to: $(pwd)"

# Define temporary log file
TEMP_LOG_FILE="/tmp/cymasphere-server-$$.log"

# Install dependencies if node_modules doesn't exist or is empty
if [ ! -d "node_modules" ] || [ -z "$(ls -A node_modules)" ]; then
  echo "📦 Installing dependencies..."
  npm install
fi

# Start the server in the background and capture its output
echo "🚀 Starting the Cymasphere server..."
npm start >$TEMP_LOG_FILE 2>&1 &
SERVER_PID=$!

echo "🔍 Server starting with PID: $SERVER_PID"
echo "📝 Waiting for successful compilation..."

# Monitor the log file for successful compilation
COMPILED=false
while true; do
  if ! ps -p $SERVER_PID > /dev/null; then
    echo "❌ Server process has unexpectedly terminated."
    cat $TEMP_LOG_FILE
    break
  fi
  
  if grep -q "Compiled successfully!" $TEMP_LOG_FILE || grep -q "compiled successfully" $TEMP_LOG_FILE; then
    echo "✅ React app compiled successfully!"
    echo "💻 Server is running at http://localhost:3000"
    COMPILED=true
    break
  elif grep -q "Failed to compile" $TEMP_LOG_FILE; then
    echo "❌ Compilation failed. Check the output below:"
    cat $TEMP_LOG_FILE
    break
  fi
  
  sleep 1
done

# If compilation was successful, ask if user wants to restart while server is running
if [ "$COMPILED" = true ]; then
  while true; do
    echo ""
    echo "Server is running. Press Ctrl+C to stop."
    read -p "Would you like to restart the server? (y/n): " answer
    case $answer in
      [Yy]* ) 
        echo "Stopping current server..."
        kill -TERM $SERVER_PID
        restart_script
        break
        ;;
      [Nn]* ) 
        echo "Server will continue running."
        echo "Use Ctrl+C to stop the server when done."
        # Wait for the background process to terminate
        wait $SERVER_PID
        echo "Server has stopped."
        exit 0
        ;;
      * ) 
        echo "Please answer with 'y' (yes) or 'n' (no)."
        ;;
    esac
  done
fi

# If we get here, either compilation failed or server terminated
echo "❗ Server process has ended."
while true; do
  echo ""
  read -p "Do you want to restart the server? (y/n): " answer
  case $answer in
    [Yy]* ) 
      restart_script
      break
      ;;
    [Nn]* ) 
      echo "Exiting server manager. Goodbye! 👋"
      exit 0
      ;;
    * ) 
      echo "Please answer with 'y' (yes) or 'n' (no)."
      ;;
  esac
done
