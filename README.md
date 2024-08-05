![image](https://github.com/bennetthermanoff/maker-pass-server/assets/19416922/e7d9f9e2-a849-4a98-a71b-748616ca6def)

### MakerPass is an upcoming iOS/Android app for managing access to machines in makerspaces. It is a successor of the Tulane Makerspace Card Reader System built for _any_ makerspace.

This repository contains the server-side code for the MakerPass system. MakerPass is built to be self-hosted, with the app connecting to makerspace servers directly.

<img src="https://github.com/bennetthermanoff/maker-pass-server/assets/19416922/2a79122d-cfee-4ce3-8926-d70b1ebfc716" width="200">
<img src="https://github.com/bennetthermanoff/maker-pass-server/assets/19416922/05885f6a-c096-4081-887a-a732a42fce99" width="200">

MakerPass additionally hosts a MQTT server for communication with wifi relays. **The primary purpose of MakerPass is to only allow certain user's access to certain tools.** At the Tulane Makerspace, users must be trained on each tool, and with MakerPass, they are able to turn on the power to their authorized machines.

MakerPass also allows for keeping track of maintenance through TagOuts.

### Installation

To install MakerPass on a debian based device (like a Raspberry Pi), make sure you have Node 20 installed by installing it via fnm:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x -o nodesource_setup.sh
sudo -E bash nodesource_setup.sh
sudo apt-get install -y nodejs
```

Then, download and run the **MakerPass** installation script:

```bash
curl -o makerPassInstall.sh https://raw.githubusercontent.com/bennetthermanoff/maker-pass-server/main/install.sh
chmod +x makerPassInstall.sh
./makerPassInstall.sh
```

This will install the necessary dependencies, go through first time setup, and start the server.
At the end of the installation, you will be asked if you want to add a cron job to keep the server running and enable non-breaking updates. If you do this, the server will automatically update itself when a new version is released and your raspberry pi is restarted. Additionally, the server will be restarted if it crashes.
Please make sure node is accessible by root for the cronjob to work! run `sudo node -v` to verify.

#### Manual Installation

Linux is the only officially supported operating system for MakerPass, but it should work on any system that can run Node.js like so:

```bash
git clone https://github.com/bennetthermanoff.maker-pass-server.git
cd maker-pass-server
npm install
npm start # will start the server and run the first time setup
```

### Configuration and First Time Setup

The first time you run the server, you will be prompted to set up the server. This includes setting up the admin account, the MQTT server, and the server's internet access. If you want to re-run this setup, simply delete the `MakerPassConfig.json` file in the root directory of the repository.

### Internet Access

If you are planning for your server to be accessed from the internet, you can either do so manually or using ngrok. Ngrok is a lot easier and automatic, but a free Ngrok account is limited to 20,000 requests per month. If you are planning on having more than 20,000 requests per month, you will need to set up a domain and SSL certificate manually or pay for a Ngrok account (which is only $8/month).

### Updates

If you used the installation script, the server will automatically update itself to any version apart of the same major version. If you want to update to a new major version, run install.sh inside the maker-pass-server directory. Read the release notes to see if there are any breaking changes before updating.

### Security

The most popular way to run MakerPass is using ngrok for the MakerPass API, and keeping the MQTT server on the local network. This network should be on a secure network as the MQTT traffic is not encrypted by default. Alternatively, MQTTS can be used with a self-signed certificate or a certificate from a certificate authority if you are hosting the MQTTS server on the internet.

### Database

The server uses a SQLite database to store user and machine information. There is no need to set up a database server. The database is created in the root directory of this repository, if you want to back it up, simply copy the database file and store it somewhere safe.

### FAQ

- **Can I use this for my makerspace?** Yes! This server is designed to be easily configurable for any makerspace. If you have any questions, feel free to open an issue.
- **Where is the Android/iOS app?** The app is currently in development, and will be published soon. This code has been open-sourced to allow makerspaces to get a head start on setting up their own deployments.
- **Can I contribute?** Absolutely! Feel free to open a pull request with any changes you'd like to make. We are always looking for ways to improve the system.
- **Will I have to pay for this?** No! MakerPass is free and open-source in line with makerspace values.

### License

Copyright (C) 2024 Bennett Hermanoff

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
