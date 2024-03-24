import { Express } from 'express';
import * as userController from '../controllers/userController';
const URL_BASE = '/api/user';
export const useUserRoutes = (router:Express) => {
    router.post(URL_BASE + '/register', userController.register);
    router.post(URL_BASE + '/login', userController.login);
    router.post(URL_BASE + '/promote/:userId/:userType', userController.authenticate, userController.changeUserType);
    router.get(URL_BASE + '/token/:userId', userController.authenticate, userController.issueNewExternalAccessToken);
    router.get(URL_BASE + '/search/:searchTerm', userController.authenticate, userController.searchForUser);
};
