import * as LocationController from '../controllers/locationController';
import { Express } from 'express';
import { authenticate } from '../controllers/userController';
const URL_BASE = '/api/locationGroups';
export const useLocationRoutes = (router:Express) => {
    router.post(URL_BASE + '/single', authenticate, LocationController.createLocation);
    router.patch(URL_BASE + '/single/:locationId',authenticate,LocationController.updateLocation);
    router.delete(URL_BASE + '/single/:locationId',authenticate,LocationController.deleteLocation);
    router.get(URL_BASE + '/all',authenticate,LocationController.getLocations);
};
