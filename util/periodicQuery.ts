import { getAllMachines } from '../controllers/machineController';

export const periodicQuery = () => {
    //periodically query machinedb to keep sqlite db in memory (for servers running spinning rust)
    getAllMachines({ sendPhotos: false });
};