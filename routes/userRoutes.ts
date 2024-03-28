import { Express } from 'express';
import * as userController from '../controllers/userController';
import { MakerspaceConfig } from '../MakerspaceConfig';
const URL_BASE = '/api/user';
export const useUserRoutes = (router:Express,makerspaceConfig:MakerspaceConfig) => {
    router.post(URL_BASE + '/register', userController.register(makerspaceConfig));
    router.post(URL_BASE + '/login', userController.login);
    router.post(URL_BASE + '/promote/:userId/:userType', userController.authenticate, userController.changeUserType);
    router.get(URL_BASE + '/token/:userId', userController.authenticate, userController.issueNewExternalAccessToken);
    router.get(URL_BASE + '/search/:searchTerm', userController.authenticate, userController.searchForUser);
};
