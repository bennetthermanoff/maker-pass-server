import express from 'express';
import { sequelize } from './models';
import { useUserRoutes } from './routes/userRoutes';
import { usePingRoutes } from './routes/pingRoutes';
import { useMachineRoutes } from './routes/machineRoutes';
import { usePermissionGroupRoutes } from './routes/permissionGroupRoutes';
import qrCode from 'qrcode-terminal';
import { useMachineGroupRoutes } from './routes/machineGroupRoutes';
import { useUserPermissionRoutes } from './routes/userPermissionRoutes';
import Aedes from 'aedes';
import mqtt from 'mqtt';
import tls from 'tls';
import fs from 'fs';
import ngrok from '@ngrok/ngrok';
import { useTagOutRoutes } from './routes/tagOutRoutes';
import { printWelcome, setup } from './setup';
import { readFileSync } from 'fs';
import { MakerspaceConfig } from './MakerspaceConfig';
import { createServer } from 'net';
export const app = express();

printWelcome();
fs.writeFileSync('process.pid', process.pid.toString());
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
    let MQTTClient: mqtt.MqttClient | undefined = undefined;

    const aedes = new Aedes();

    const MQTTserver = makerspaceConfig.mqttSecure ? tls.createServer({
        key: fs.readFileSync('certs/server.key'),
        cert: fs.readFileSync('certs/server.crt'),
    }, aedes.handle)
        : createServer(aedes.handle);

    MQTTserver.listen(MQTT_PORT, () => {
        console.log('MQTT server started and listening on port ', MQTT_PORT);
    });

    MQTTClient = mqtt.connect(`mqtt${makerspaceConfig.mqttSecure ? 's' : ''}://localhost:${MQTT_PORT}`, {
        rejectUnauthorized: false,
        clientId:'makerPassServer',
        username: makerspaceConfig.mqttUsername,
        password: makerspaceConfig.mqttPassword,
    }).on('error', (error) => {
        console.log('MQTT error:', error);
    });

    MQTTClient.on('connect', () => {
        console.log('MakerPass connected to new MQTT server');
        useMachineRoutes(app, MQTTClient);
    });
    aedes.authenticate = (client, username, password, callback) => {
        console.log('Authenticating MQTT client: ', client.id);

        if (makerspaceConfig && username === makerspaceConfig.mqttUsername && password?.toString() === makerspaceConfig.mqttPassword) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    };

    app.get('/', (req, res) => {
        res.json({ message: 'Welcome to the Tulane Makerspace!' });
    });
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));

    useUserRoutes(app,makerspaceConfig);
    usePingRoutes(app,makerspaceConfig);
    usePermissionGroupRoutes(app);
    useUserPermissionRoutes(app);
    useMachineGroupRoutes(app);
    useTagOutRoutes(app);

    sequelize.sync();

    app.listen(BACKEND_PORT, async () => {
        const makerspaceConfig = JSON.parse(readFileSync('MakerspaceConfig.json', 'utf8'));
        if (makerspaceConfig.ngrokToken && makerspaceConfig.ngrokStaticDomain){
            const listener = await ngrok.connect({
                addr: BACKEND_PORT,
                authtoken: makerspaceConfig.ngrokToken,
                // domain: makerspaceConfig.ngrokStaticDomain,

            });
            console.log(`Server is running on ${listener.url()}`);
            console.log('User registration QR code: ');
            qrCode.generate(`makerpass://--/makerspace/config?url=${listener.url()}&port=443&registrationType=user&registrationKey=${makerspaceConfig.registrationPassword}`, { small: true }, (qrCode) => {
                console.log(qrCode);
            });

        } else {
            console.log(`Server is running on ${makerspaceConfig?.serverAddress} port ${BACKEND_PORT}.`);
            qrCode.generate(`makerpass://--/makerspace/config?url=${makerspaceConfig.serverAddress}&port=${makerspaceConfig.externalServerPort}&registrationType=user&registrationKey=${makerspaceConfig.registrationPassword}`, { small: true }, (qrCode) => {
                console.log(qrCode);
            });
        }

    });

}

