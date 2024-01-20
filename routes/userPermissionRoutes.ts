const URL_BASE = '/api/userPermission';
import * as userPermissionController from '../controllers/userPermissionController';
import { Express } from 'express';
import { authenticate } from '../controllers/userController';
export const useUserPermissionRoutes = (router:Express) => {
    router.get(URL_BASE + '/:userId', authenticate, userPermissionController.getPermissions);
    router.put(URL_BASE + '/:userId', authenticate, userPermissionController.updatePermissions);
};