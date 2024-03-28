import { Express } from 'express';
import { pingServer } from '../controllers/pingController';
import { MakerspaceConfig } from '../MakerspaceConfig';
const URL_BASE = '/api/ping';
export const usePingRoutes = (router:Express,makerspaceConfig:MakerspaceConfig) => {
    router.post(URL_BASE, pingServer(makerspaceConfig));
};
