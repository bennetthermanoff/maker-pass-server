/* eslint-disable func-call-spacing */
import { Express } from 'express';
import * as machineController from '../controllers/machineController';
import { authenticate } from '../controllers/userController';
const URL_BASE = '/api/machine';
export const useMachineRoutes = (router:Express) => {
    router.post     (URL_BASE + '/single', authenticate, machineController.createMachine);
    router.patch    (URL_BASE + '/single/:machineId', authenticate, machineController.updateMachine);
    router.get      (URL_BASE + '/single/:machineId', authenticate, machineController.getMachine);
    router.get      (URL_BASE + '/all', authenticate, machineController.getAllMachines({ sendPhotos: false }));
    router.get      (URL_BASE + '/all/photos', authenticate, machineController.getAllMachines({ sendPhotos: true }));
    router.delete   (URL_BASE + '/single/:machineId', authenticate, machineController.deleteMachine);
    router.get      (URL_BASE + '/permitted/:userId', authenticate, machineController.getPermittedMachineIdsRoute);
    router.post     (URL_BASE + '/enable/single/:machineId', authenticate, machineController.enableMachine);
    router.get     (URL_BASE + '/disable/single/:machineId', authenticate, machineController.disableMachine);
    router.post     (URL_BASE + '/disable/all', authenticate, machineController.disableAllMachines);
    router.post     (URL_BASE + '/disable/group/:groupId', authenticate, machineController.disableAllMachinesByGroupId);
};
