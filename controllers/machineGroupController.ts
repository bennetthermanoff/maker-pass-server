import { RequestHandler } from 'express';
import { LogDB, MachineGroupDB } from '../models';
import { GeoFence } from '../util/locationCheck';
import { MachineGroup, GroupGeoFence, MachineGroupMachine } from '../models/MachineGroupModel';
import { Op } from 'sequelize';

type CreateMachineGroupBody = {
    name: string;
    machineIds?: string[];
    geoFences?: GeoFence[];
};
export const createMachineGroup:RequestHandler = async (req, res) => {
    if (req.headers.usertype !== 'admin'){
        res.status(400).json({ message: 'User not authorized' });
        return;
    }
    if (!req.body.name){
        res.status(400).json({ message: 'name is required' });
        return;
    }

    try {
        const createMachineGroupBody = req.body as CreateMachineGroupBody;
        const machineGroup = await MachineGroupDB.create({
            type:'GROUP',
            sk:null,
            data:createMachineGroupBody.name,
        }).then((machineGroup) => machineGroup.toJSON()) as MachineGroup;
        const machineGroupId = machineGroup.id;
        if (createMachineGroupBody.machineIds){
            //delete already existing machines assiged to another group
            await MachineGroupDB.destroy({
                where:{
                    type:'MACHINE',
                    data:{
                        [Op.in]:createMachineGroupBody.machineIds,
                    },
                },
            });
            //create new machines
            await MachineGroupDB.bulkCreate(createMachineGroupBody.machineIds.map((machineId) => ({
                type:'MACHINE',
                sk:machineGroupId,
                data:machineId,
            })));
        }
        if (createMachineGroupBody.geoFences){
            await MachineGroupDB.bulkCreate(createMachineGroupBody.geoFences.map((geoFence) => ({
                type:'GEOFENCE',
                sk:machineGroupId,
                data:JSON.stringify(geoFence),
            })));
        }
        LogDB.create({
            type:'Machine Group Created',
            message:`Machine Group ${createMachineGroupBody.name} was created`,
            referenceId:machineGroupId,
            referenceType:'Machine Group',
            userId:req.headers.userid,
        });
        res.status(200).json(machineGroup);
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
};

type UpdateMachineGroupBody = {
    name?: string;
    machineIds?: string[];
    geoFences?: GeoFence[];
};
export const updateMachineGroup:RequestHandler = async (req, res) => {
    if (req.headers.usertype !== 'admin'){
        res.status(400).json({ message: 'User not authorized' });
        return;
    }
    try {
        const machineGroupId = req.params.machineGroupId;
        const updateMachineGroupBody = req.body as UpdateMachineGroupBody;
        if (updateMachineGroupBody.name){
            await MachineGroupDB.update({
                data:updateMachineGroupBody.name,
            },{
                where:{
                    type:'GROUP',
                    id:machineGroupId,
                },
            });
        }
        if (updateMachineGroupBody.machineIds){
            //delete already existing machines assiged to another group
            await MachineGroupDB.destroy({
                where:{
                    type:'MACHINE',
                    data:{
                        [Op.in]:updateMachineGroupBody.machineIds,
                    },
                },
            });
            //delete already existing machines assiged to this group
            await MachineGroupDB.destroy({
                where:{
                    type:'MACHINE',
                    sk:machineGroupId,
                },
            });
            //create new machines
            await MachineGroupDB.bulkCreate(updateMachineGroupBody.machineIds.map((machineId) => ({
                type:'MACHINE',
                sk:machineGroupId,
                data:machineId,
            })));
        }
        if (updateMachineGroupBody.geoFences){
            //delete already existing geoFences assiged to this group
            await MachineGroupDB.destroy({
                where:{
                    type:'GEOFENCE',
                    sk:machineGroupId,
                },
            });
            //create new geoFences
            await MachineGroupDB.bulkCreate(updateMachineGroupBody.geoFences.map((geoFence) => ({
                type:'GEOFENCE',
                sk:machineGroupId,
                data:JSON.stringify(geoFence),
            })));
        }
        LogDB.create({
            type:'Machine Group Updated',
            message:`Machine Group ${machineGroupId} was updated`,
            referenceId:machineGroupId,
            referenceType:'Machine Group',
            userId:req.headers.userid,
        });
        res.status(200).json({ message: 'Machine Group updated!' });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
};

export const deleteMachineGroup:RequestHandler = async (req, res) => {
    if (req.headers.usertype !== 'admin'){
        res.status(400).json({ message: 'User not authorized' });
        return;
    }
    try {
        const machineGroupId = req.params.machineGroupId;
        await MachineGroupDB.destroy({
            where:{
                id:machineGroupId,
            },
        });
        await MachineGroupDB.destroy({
            where:{
                sk:machineGroupId,
            },
        });
        LogDB.create({
            type:'Machine Group Deleted',
            message:`Machine Group ${machineGroupId} was deleted`,
            referenceId:machineGroupId,
            referenceType:'Machine Group',
            userId:req.headers.userid,
        });
        res.status(200).json({ message: 'Machine Group deleted!' });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
};

export const getMachineGroup:RequestHandler = async (req, res) => {
    try {
        const machineGroupId = req.params.machineGroupId;
        const machineGroup = await MachineGroupDB.findOne({
            where:{
                id:machineGroupId,
            },
        }).then((machineGroup) => machineGroup?.toJSON()) as MachineGroup;
        if (!machineGroup){
            res.status(400).json({ message: 'Machine Group not found' });
            return;
        }
        const machineGroupMachines = await MachineGroupDB.findAll({
            where:{
                type:'MACHINE',
                sk:machineGroupId,
            },
        }).then((machineGroupMachines): MachineGroupMachine[] => machineGroupMachines.map((machineGroupMachine) => machineGroupMachine.toJSON())) as MachineGroupMachine[];
        const machineGroupGeoFences = await MachineGroupDB.findAll({
            where:{
                type:'GEOFENCE',
                sk:machineGroupId,
            },
        }).then((machineGroupGeoFences): GroupGeoFence[] => machineGroupGeoFences.map((machineGroupGeoFence) => machineGroupGeoFence.toJSON())) as GroupGeoFence[];
        res.status(200).json({ machineGroup:machineGroup, machineGroupMachines:machineGroupMachines, machineGroupGeoFences:machineGroupGeoFences });
    }
    catch (error) {
        res.status(500).json({ error: error });
    }
};

export const getAllMachineGroups:RequestHandler = async (req, res) => {
    try {
        const machineGroups = await MachineGroupDB.findAll({
            where:{
                type:'GROUP',
            },
        }).then((machineGroups) => machineGroups.map((machineGroup) => machineGroup.toJSON())) as MachineGroup[];
        const machineGroupMachines = await MachineGroupDB.findAll({
            where:{
                type:'MACHINE',
            },
        }).then((machineGroupMachines) => machineGroupMachines.map((machineGroupMachine) => machineGroupMachine.toJSON())) as MachineGroupMachine[];
        const machineGroupGeoFences = await MachineGroupDB.findAll({
            where:{
                type:'GEOFENCE',
            },
        }).then((machineGroupGeoFences) => machineGroupGeoFences.map((machineGroupGeoFence) => machineGroupGeoFence.toJSON())) as GroupGeoFence[];
        const machineGroupMap = machineGroups.reduce((machineGroupObject, machineGroup) => {
            machineGroupObject[machineGroup.id] = { name:machineGroup.data, machineIds:[], geoFences:[] };
            return machineGroupObject;
        }, {} as {[key:string]:{name:string, machineIds:string[], geoFences:GeoFence[]}});
        machineGroupMachines.forEach((machineGroupMachine) => {
            machineGroupMap[machineGroupMachine.sk].machineIds.push(machineGroupMachine.data);
        });
        machineGroupGeoFences.forEach((machineGroupGeoFence) => {
            machineGroupMap[machineGroupGeoFence.sk].geoFences.push(JSON.parse(machineGroupGeoFence.data as string));
        });
        res.status(200).json(machineGroupMap);

    }
    catch (error) {
        res.status(500).json({ error: error });
    }
};