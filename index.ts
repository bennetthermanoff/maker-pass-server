import express from 'express';
import { makerspaceConfig } from './MakerspaceConfig';
import { sequelize } from './models';
import { useUserRoutes } from './routes/userRoutes';
import { usePingRoutes } from './routes/pingRoutes';
import { useMachineRoutes } from './routes/machineRoutes';
import { usePermissionGroupRoutes } from './routes/permissionGroupRoutes';
import qrCode from 'qrcode-terminal';
import { useMachineGroupRoutes } from './routes/machineGroupRoutes';
import { useUserPermissionRoutes } from './routes/userPermissionRoutes';
import aedes from 'aedes';
import mqtt from 'mqtt';
import tls from 'tls';
import fs from 'fs';
import { useTagOutRoutes } from './routes/tagOutRoutes';
export const app = express();

// const corsOptions = {
//     origin: 'http://localhost:8081/',
// };
const BACKEND_PORT = makerspaceConfig.serverPort || 3000;
const MQTT_PORT = makerspaceConfig.mqttPort || 8883;

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Tulane Makerspace!' });
});

app.use(express.json());

useUserRoutes(app);
usePingRoutes(app);
useMachineRoutes(app);
usePermissionGroupRoutes(app);
useUserPermissionRoutes(app);
useMachineGroupRoutes(app);
useTagOutRoutes(app);

app.use(express.urlencoded({ extended: true }));
// app.use(express.bodyParser({ limit: '50mb' }));

sequelize.sync();
//tls
// const aedesHandle = new aedes();
// const MQTToptions = {
//     key: fs.readFileSync('certs/server.key'),
//     cert: fs.readFileSync('certs/server.crt'),
// };
// aedesHandle.authenticate = (client, username, password, callback) => {
//     console.log('Authenticating client: ', client.id);

//     if (username === makerspaceConfig.mqttUsername && password?.toString() === makerspaceConfig.mqttPassword) {
//         callback(null, true);
//     } else {
//         callback(null, false);
//     }
// };

// const MQTTserver = tls.createServer(MQTToptions, aedesHandle.handle);

// MQTTserver.listen(MQTT_PORT, () => {
//     console.log('MQTT server started and listening on port ', MQTT_PORT);
// });

// const client = mqtt.connect('mqtts://localhost:8883', {
//     rejectUnauthorized: false,
//     clientId:'makerspaceBackend',
//     username: makerspaceConfig.mqttUsername,
//     password: makerspaceConfig.mqttPassword,
// });

// client.on('connect', () => {
//     console.log('Connected to MQTT server');
//     client.subscribe('test', (err) => {
//         if (!err) {
//             client.publish('test', 'Hello mqtt');
//         } else {
//             console.log(err);
//         }
//     });
// });

app.listen(BACKEND_PORT, () => {
    console.log(`Server is running on ${makerspaceConfig.serverAddress} port ${BACKEND_PORT}.`);

});

qrCode.generate(`makerpass://test:${makerspaceConfig.serverPort}/--/makerspace/config?url=${makerspaceConfig.serverAddress}&port=${makerspaceConfig.serverPort}&registrationType=admin&registrationKey=${makerspaceConfig.adminPassword}`, { small: true }, (qrCode) => {
    console.log(qrCode);
});