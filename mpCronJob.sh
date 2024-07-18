#!/bin/bash
cd "$(dirname "$0")";
PID_FILE="process.pid"

if [ -f "$PID_FILE" ]; then
    PID=$(cat "$PID_FILE")

    if ps -p $PID > /dev/null; then
        echo "Node.js process is already running with PID $PID"
        exit 0
    else
        echo "Node.js process is not running. Starting..."
        rm "$PID_FILE"
    fi
else
    echo "Node.js process is not running. Starting..."
fi
# create process.pid file as a lock while getting updates
echo $$ > "$PID_FILE"
while ! ping -c 1 1.1.1.1; do
    echo "No internet connection. Retrying in 5 seconds..."
    sleep 5
done
git pull
npm install 
rm "$PID_FILE"
npm run start

echo "Node.js process started"