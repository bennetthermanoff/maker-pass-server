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
git fetch --tags
CURRENT_TAG=$(git describe --tags `git rev-list --tags --max-count=1`)
MAJOR_VERSION=$(echo $CURRENT_TAG | cut -d. -f1)
LATEST_TAG_WITH_SAME_MAJOR_VERSION=$(git tag -l "$MAJOR_VERSION.*" | tail -n 1)
git checkout $LATEST_TAG_WITH_SAME_MAJOR_VERSION
echo "Updated MakerPass to release $LATEST_TAG_WITH_SAME_MAJOR_VERSION."
npm install 
rm "$PID_FILE"
if [ ! -d "/tmp/maker-pass-server" ]; then
    mkdir /tmp/maker-pass-server
fi
npm run start > /tmp/maker-pass-server/log-$(date +%Y-%m-%d_%H-%M-%S).log 2>&1 &

echo "Node.js process started"