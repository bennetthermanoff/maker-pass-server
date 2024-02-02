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
import { createServer } from 'aedes-server-factory';
import mqtt from 'mqtt';
import fs from 'fs';
export const app = express();

// const corsOptions = {
//     origin: 'http://localhost:8081/',
// };
const PORT = makerspaceConfig.serverPort || 3000;

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

app.use(express.urlencoded({ extended: true }));
// app.use(express.bodyParser({ limit: '50mb' }));

sequelize.sync();
//tls
// const server = createServer(aedes, {
//     ws: true,
//     https: {
//         key: fs.readFileSync('key.pem'),
//         cert: fs.readFileSync('cert.pem'),
//     },
// });
// server.listen(8883, () => {
//     console.log('server started and listening on port ', 8883);
// });

// const client = mqtt.connect('mqtts://localhost:8883', {
//     rejectUnauthorized: false,
//     username: 'admin',
//     password: 'admin',
// });

// client.on('connect', () => {
//     console.log('Connected to MQTT server');
//     client.subscribe('test', (err) => {
//         if (!err) {
//             client.publish('test', 'Hello mqtt');
//         }
//     });
// });

app.listen(PORT, () => {
    console.log(`Server is running on ${makerspaceConfig.serverAddress} port ${PORT}.`);

});

qrCode.generate(`exp://test:${makerspaceConfig.serverPort}/--/makerspace/config?url=${makerspaceConfig.serverAddress}&port=${makerspaceConfig.serverPort}&registrationType=admin&registrationKey=${makerspaceConfig.adminPassword}`, { small: true }, (qrCode) => {
    console.log(qrCode);
});