import { RequestHandler } from 'express';
import { makerspaceConfig } from '../MakerspaceConfig';

export const pingServer:RequestHandler = async (req,res) => {
    res.status(200).json({ message:'Server Found!',
        server:{
            id:makerspaceConfig.id,
            name:makerspaceConfig.name,
            website:makerspaceConfig.website,
            serverAddress:makerspaceConfig.serverAddress,
            serverPort:makerspaceConfig.serverPort,
            theme:makerspaceConfig.theme,

        } });
};