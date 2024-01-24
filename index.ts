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

app.listen(PORT, () => {
    console.log(`Server is running on ${makerspaceConfig.serverAddress} port ${PORT}.`);

});

qrCode.generate(`exp://test:${makerspaceConfig.serverPort}/--/makerspace/config?url=${makerspaceConfig.serverAddress}&port=${makerspaceConfig.serverPort}&registrationType=admin&registrationKey=${makerspaceConfig.adminPassword}`, { small: true }, (qrCode) => {
    console.log(qrCode);
});