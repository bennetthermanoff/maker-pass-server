import express from 'express';
import { sequelize } from './models';
import { useUserRoutes } from './routes/userRoutes';
import { usePingRoutes } from './routes/pingRoutes';
import { useMachineRoutes } from './routes/machineRoutes';
import { usePermissionGroupRoutes } from './routes/permissionGroupRoutes';
import qrCode from 'qrcode-terminal';
import { useMachineGroupRoutes } from './routes/machineGroupRoutes';
import { useUserPermissionRoutes } from './routes/userPermissionRoutes';
// import aedes from 'aedes';
// import mqtt from 'mqtt';
// import tls from 'tls';
// import fs from 'fs';
import { useTagOutRoutes } from './routes/tagOutRoutes';
import { printWelcome, setup } from './setup';
import { readFileSync } from 'fs';
import { MakerspaceConfig } from './MakerspaceConfig';
export const app = express();

printWelcome();
let makerspaceConfig : MakerspaceConfig|undefined = undefined;
try {
    makerspaceConfig = JSON.parse(readFileSync('MakerspaceConfig.json', 'utf8'));
} catch (e){
    console.log('No MakerspaceConfig.json found. Running setup.');
}

if (!makerspaceConfig){
    setup();
} else {
    // const corsOptions = {
    //     origin: 'http://localhost:8081/',
    // };
    const BACKEND_PORT = makerspaceConfig.internalServerPort;
    const MQTT_PORT = makerspaceConfig.mqttPort;

    app.get('/', (req, res) => {
        res.json({ message: 'Welcome to the Tulane Makerspace!' });
    });

    app.use(express.json());

    useUserRoutes(app,makerspaceConfig);
    usePingRoutes(app,makerspaceConfig);
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
        console.log(`Server is running on ${makerspaceConfig?.serverAddress} port ${BACKEND_PORT}.`);

    });
    console.log('User registration QR code: ');
    qrCode.generate(`makerpass://--/makerspace/config?url=${makerspaceConfig.serverAddress}&port=${makerspaceConfig.externalServerPort}&registrationType=user&registrationKey=${makerspaceConfig.registrationPassword}`, { small: true }, (qrCode) => {
        console.log(qrCode);
    });
}