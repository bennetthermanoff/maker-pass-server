import { RequestHandler } from 'express';
import { makerspaceConfig } from '../MakerspaceConfig';
import { MachineGroupDB } from '../models';
import { MachineGroupGeoFence } from '../models/MachineGroupModel';

export const pingServer:RequestHandler = async (req,res) => {
    const { registrationType, registrationKey } = req.body;
    if (!registrationType || !registrationKey){
        res.status(400).json({ message:'Invalid registration type or key' });
        return;
    }
    if (registrationType !== 'admin' && registrationType !== 'user'){
        res.status(400).json({ message:'Invalid registration type' });
        return;
    }
    if (registrationType === 'admin' && registrationKey !== makerspaceConfig.adminPassword){
        res.status(400).json({ message:'Invalid registration key' });
        return;
    }
    if (registrationType === 'user' && registrationKey !== makerspaceConfig.registrationPassword){
        res.status(400).json({ message:'Invalid registration key' });
        return;
    }
    const geoFences = await MachineGroupDB.findAll({ where:{ type:'GEOFENCE' } }).then((geoFences) => geoFences.map((geoFence) => geoFence.toJSON() as MachineGroupGeoFence));
    const hasGeoFences = geoFences.length > 0;
    res.status(200).json({ message:'Server Found!',
        registrationType:registrationType,
        server:{
            id:makerspaceConfig.id,
            name:makerspaceConfig.name,
            website:makerspaceConfig.website,
            serverAddress:makerspaceConfig.serverAddress,
            serverPort:makerspaceConfig.serverPort,
            theme:makerspaceConfig.theme,
            additionalInfoFields:makerspaceConfig.additionalInfoFields,
            hasGeoFences:hasGeoFences,

        } });
};