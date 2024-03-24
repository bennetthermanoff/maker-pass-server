# Maker Pass Server

### MakerPass is an upcoming iOS/Android app for managing access to machines in makerspaces. It is a successor of the Tulane Makerspace Card Reader System built for _any_ makerspace.

This repository contains the server-side code for the MakerPass system. MakerPass is built to be self-hosted, with the app connecting to makerspace servers directly.

MakerPass additionally hosts a MQTT server for communication with wifi relays. At the Tulane makerspace, we are using sonoff wifi relays running Tasmota firmware.

### Installation

1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start the server

### Configuration

MakerspaceConfig.ts contains the configuration for the makerspace. This includes the name of the makerspace, your ip address, and the port for the server. Additonally, it contains questions for the registration form. Take a look at the included example.

### API

The server exposes a RESTful API for managing users and machines. All routes are defined in the Routes directory.

### Database

The server uses a SQLite database to store user and machine information. There is no need to set up a database server. The database is created in the root directory of this repository.

### FAQ

- **Can I use this for my makerspace?** Yes! This server is designed to be easily configurable for any makerspace. If you have any questions, feel free to open an issue.
- **Where is the Android/iOS app?** The app is currently in development, and will be published soon. This code has been open-sourced to allow makerspaces to get a head start on setting up their own deployments.
- **Can I contribute?** Absolutely! Feel free to open a pull request with any changes you'd like to make. We are always looking for ways to improve the system.
- **Will I have to pay for this?** No! MakerPass is free and open-source in line with makerspace values.
