![image](https://github.com/bennetthermanoff/maker-pass-server/assets/19416922/e7d9f9e2-a849-4a98-a71b-748616ca6def)

### MakerPass is an upcoming iOS/Android app for managing access to machines in makerspaces. It is a successor of the Tulane Makerspace Card Reader System built for _any_ makerspace.

This repository contains the server-side code for the MakerPass system. MakerPass is built to be self-hosted, with the app connecting to makerspace servers directly.

<img src="https://github.com/bennetthermanoff/maker-pass-server/assets/19416922/2a79122d-cfee-4ce3-8926-d70b1ebfc716" width="200">
<img src="https://github.com/bennetthermanoff/maker-pass-server/assets/19416922/05885f6a-c096-4081-887a-a732a42fce99" width="200">


MakerPass additionally hosts a MQTT server for communication with wifi relays. **The primary purpose of MakerPass is to only allow certain user's access to certain tools.** At the Tulane Makerspace, users must be trained on each tool, and with MakerPass, they are able to turn on the power to their authorized machines.

MakerPass also allows for keeping track of maintenance through TagOuts.

## Notice: this repository is under active development. It's not done yet! 

### Installation

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start the server

### Configuration

MakerspaceConfig.ts contains the configuration for the makerspace. This includes the name of the makerspace, your ip address, and the port for the server. Additonally, it contains questions for the registration form. Take a look at the included example.

### First Time Setup

When you start the MakerPass, the admin QR code will be displayed, this allows you to register for your makerspace directly as an admin. **Do not share this QR Code. In the MakerPass app, there is a User registration QR code that should be posted at your makerspace.**

### API

The server exposes a RESTful API for managing users and machines. All routes are defined in the Routes directory.

### Database

The server uses a SQLite database to store user and machine information. There is no need to set up a database server. The database is created in the root directory of this repository.

### FAQ

- **Can I use this for my makerspace?** Yes! This server is designed to be easily configurable for any makerspace. If you have any questions, feel free to open an issue.
- **Where is the Android/iOS app?** The app is currently in development, and will be published soon. This code has been open-sourced to allow makerspaces to get a head start on setting up their own deployments.
- **Can I contribute?** Absolutely! Feel free to open a pull request with any changes you'd like to make. We are always looking for ways to improve the system.
- **Will I have to pay for this?** No! MakerPass is free and open-source in line with makerspace values.
