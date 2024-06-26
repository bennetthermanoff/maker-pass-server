import { Express } from 'express';
import { getRegistrationKey, pingServer } from '../controllers/pingController';
import { MakerspaceConfig } from '../MakerspaceConfig';
import { authenticate } from '../controllers/userController';
const URL_BASE = '/api/ping';
export const usePingRoutes = (router:Express,makerspaceConfig:MakerspaceConfig) => {
    router.post(URL_BASE, pingServer(makerspaceConfig));
    router.get(URL_BASE + '/registrationKey', authenticate, getRegistrationKey(makerspaceConfig));
};
