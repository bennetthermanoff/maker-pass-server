import * as tagOutController from '../controllers/tagOutController';
import { Express } from 'express';
import { authenticate } from '../controllers/userController';
const URL_BASE = '/api/tagOut';

export const useTagOutRoutes = (router:Express) => {
    router.get(URL_BASE +  '/:machineId', authenticate, tagOutController.getTagOutsByMachineId);
    router.post(URL_BASE + '/create/:machineId', authenticate, tagOutController.createTagOut);
    router.post(URL_BASE + '/remove/:tagOutId', authenticate, tagOutController.removeTagOut);
};