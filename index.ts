import express from 'express';
import { makerspaceConfig } from './MakerspaceConfig';
import { sequelize } from './models';
import { useUserRoutes } from './routes/userRoutes';
import { usePingRoutes } from './routes/pingRoutes';
import { useMachineRoutes } from './routes/machineRoutes';

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

app.use(express.urlencoded({ extended: true }));

sequelize.sync();

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

