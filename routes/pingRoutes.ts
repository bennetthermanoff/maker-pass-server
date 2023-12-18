import { Express } from 'express';
import { pingServer } from '../controllers/pingController';
const URL_BASE = '/api/ping';
export const usePingRoutes = (router:Express) => {
    router.get(URL_BASE, pingServer);
};
