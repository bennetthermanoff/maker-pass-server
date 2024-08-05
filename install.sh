# check for node
if ! [ -x "$(command -v node)" ]; then
  echo 'Error: node is not installed. Please install node.js and npm.' >&2
  exit 1
fi
# check for git
if ! [ -x "$(command -v git)" ]; then
  echo 'Error: git is not installed. Please install git.' >&2
  exit 1
fi
# check for npm
if ! [ -x "$(command -v npm)" ]; then
  echo 'Error: npm is not installed. Please install npm.' >&2
  exit 1
fi
# check for crontab
if ! [ -x "$(command -v crontab)" ]; then
  echo 'Error: crontab is not installed. Please install cron.' >&2
  exit 1
fi
if [ -d "maker-pass-server" ]; then
  echo "MakerPass is already installed. Would you like to update MakerPass? (y/n)"
  read -r response
  if [ "$response" = "y" ]; then
    cd maker-pass-server
    PID=$(cat "$PID_FILE")
    kill $PID
    echo $$ > "process.pid"
    while ! ping -c 1 1.1.1.1; do
        echo "No internet connection. Retrying in 5 seconds..."
        sleep 5
    done
    git fetch --tags
    LATEST_TAG=$(git describe --tags `git rev-list --tags --max-count=1`)
    git checkout $LATEST_TAG
    echo "Updated MakerPass to release $LATEST_TAG."
    sleep 5
    echo "Installing dependencies..."
    npm install
    rm "process.pid"
    nohup npm start &
    echo "MakerPass $LATEST_TAG is now running in the background."
    exit 0
  else
    echo "Exiting..."
    exit 0
  fi
fi
git clone "https://github.com/bennetthermanoff/maker-pass-server.git"
cd maker-pass-server
LATEST_TAG=$(git describe --tags `git rev-list --tags --max-count=1`)
git checkout $LATEST_TAG
echo "Installed MakerPass release $LATEST_TAG. Non-breaking updates will be automatically installed."
sleep 5
echo "Installing dependencies..."
npm install
npm start
rm "process.pid"
echo "Setup complete, would you like to add MakerPass to your crontab? (y/n) (requires sudo)"
read -r response
if [ "$response" = "y" ]; then
    PATH_TO_SCRIPT=$(pwd)
    sudo echo "* * * * * cd $PATH_TO_SCRIPT && ./mpCronJob.sh" | sudo crontab -
echo "MakerPass added to crontab. MakerPass will now run every minute and check for updates when killed.\n"
fi
echo "MakerPass is now running in the background."
nohup npm start &
