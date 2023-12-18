import express from 'express';
import { makerspaceConfig } from './MakerspaceConfig';
import { sequelize } from './models';
import { useUserRoutes } from './routes/userRoutes';
import { usePingRoutes } from './routes/pingRoutes';

export const app = express();

// const corsOptions = {
//     origin: 'http://localhost:8081/',
// };
const PORT = makerspaceConfig.serverPort || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
});

app.get('/', (req, res) => {
    res.json({ message: 'Welcome to the Tulane Makerspace!' });
});

app.use(express.json());

useUserRoutes(app);
usePingRoutes(app);

app.use(express.urlencoded({ extended: true }));

sequelize.sync();

