import { RequestHandler } from 'express';
import { MachineGroupDB } from '../models';
import { MachineGroupGeoFence } from '../models/MachineGroupModel';
import { MakerspaceConfig } from '../MakerspaceConfig';
import { compareSync } from 'bcrypt';
import { UserType } from '../models/UserModel';

export const pingServer:(makerspaceConfig:MakerspaceConfig)=>RequestHandler = (makerspaceConfig) => async (req,res) => {
    const { registrationType, registrationKey } = req.body;
    if (!registrationType || !registrationKey){
        res.status(400).json({ message:'Invalid registration type or key' });
        return;
    }
    if (registrationType !== 'admin' && registrationType !== 'user'){
        res.status(400).json({ message:'Invalid registration type' });
        return;
    }
    if (registrationType === 'admin' && !compareSync(registrationKey, makerspaceConfig.adminPassword)){
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
            serverPort:makerspaceConfig.externalServerPort,
            theme:makerspaceConfig.theme,
            additionalInfoFields:makerspaceConfig.additionalInfoFields,
            hasGeoFences:hasGeoFences,

        } });
};

export const getRegistrationKey:(makerspaceConfig:MakerspaceConfig)=>RequestHandler = (makerspaceConfig) => async (req,res) => {
    const userType = req.headers.usertype as UserType;
    if (userType !== 'admin' ){
        res.status(401).json({ message:'Unauthorized' });
        return;
    }
    res.status(200).json({ registrationKey:makerspaceConfig.registrationPassword });
};