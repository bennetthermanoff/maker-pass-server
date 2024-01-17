/* eslint-disable func-call-spacing */
import * as MachineGroupController from '../controllers/machineGroupController';
import { Express } from 'express';
import { authenticate } from '../controllers/userController';
const URL_BASE = '/api/machineGroup';
export const useMachineGroupRoutes = (router:Express) => {
    router.post  (URL_BASE + '/single', authenticate, MachineGroupController.createMachineGroup);
    router.patch (URL_BASE + '/single/:machineGroupId',authenticate,MachineGroupController.updateMachineGroup);
    router.delete(URL_BASE + '/single/:machineGroupId',authenticate,MachineGroupController.deleteMachineGroup);
    router.get   (URL_BASE + '/all',authenticate,MachineGroupController.getAllMachineGroups);
};