/* eslint-disable func-call-spacing */

import { Express } from 'express';
import * as permissionGroupController from '../controllers/permissionGroupController';
import { authenticate } from '../controllers/userController';
const URL_BASE = '/api/permissionGroup';
export const usePermissionGroupRoutes = (router:Express) => {
    router.get      (URL_BASE + '/all', authenticate, permissionGroupController.getPermissionGroups);
    router.post     (URL_BASE + '/single', authenticate, permissionGroupController.createPermissionGroup);
    router.patch    (URL_BASE + '/single/:permissionGroupId', authenticate, permissionGroupController.updatePermissionGroup);
    router.delete   (URL_BASE + '/single/:permissionGroupId', authenticate, permissionGroupController.deletePermissionGroup);
};