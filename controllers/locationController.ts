import { RequestHandler } from 'express';
import { LogDB, MachineGroupDB } from '../models';
import { GeoFence } from '../util/locationCheck';
import { Op } from 'sequelize';
import { GroupGeoFence, MachineGroup, ShopLocation } from '../models/MachineGroupModel';

type CreateLocationGroupBody = {
    name:string;
    groups:string[];
    geoFences:GeoFence[];
};
export const createLocation:RequestHandler = async (req, res) => {
    if (req.headers.usertype !== 'admin'){
        res.status(400).json({ message: 'User not authorized' });
        return;
    }
    if (!req.body.name){
        res.status(400).json({ message: 'Name is required' });
        return;
    }

    try {
        const createLocationGroupBody = req.body as CreateLocationGroupBody;
        const location = await MachineGroupDB.create({
            type:'LOCATION',
            sk:null,
            data:createLocationGroupBody.name,
        }).then((location) => location.toJSON());
        const locationId = location.id;
        if (createLocationGroupBody.groups){
            //edit sk of groups
            await MachineGroupDB.update({
                sk:locationId,
            }, {
                where:{
                    type:'GROUP',
                    id:{
                        [Op.in]:createLocationGroupBody.groups,
                    },
                },
            });
        }
        if (createLocationGroupBody.geoFences){
            await MachineGroupDB.bulkCreate(createLocationGroupBody.geoFences.map((geoFence) => ({
                type:'GEOFENCE',
                sk:locationId,
                data:JSON.stringify(geoFence),
            })));
        }
        LogDB.create({
            type:'Location Created',
            message:`Location ${createLocationGroupBody.name} was created`,
            referenceId:locationId,
            referenceType:'Location',
            userId:req.headers.userid,
        });
        res.status(200).json(location);
    } catch (e) {
        res.status(500).json({ message: 'Error creating location' });
    }
};

type UpdateLocationBody = {
    name:string;
    groups:string[];
    geoFences:GeoFence[];
};
export const updateLocation:RequestHandler = async (req, res) => {
    if (req.headers.usertype !== 'admin'){
        res.status(400).json({ message: 'User not authorized' });
        return;
    }
    try {
        const locationId = req.params.locationId;
        const updateLocationBody = req.body as UpdateLocationBody;
        if (updateLocationBody.name){
            await MachineGroupDB.update({
                data:updateLocationBody.name,
            }, {
                where:{
                    type:'LOCATION',
                    id:locationId,
                },
            });
        }
        if (updateLocationBody.groups){
            //edit sk of groups
            const currentGroups = await MachineGroupDB.findAll({
                where:{
                    type:'GROUP',
                    sk:locationId,
                },
            }).then((groups) => groups.map((group) => group.toJSON())) as MachineGroup[];
            const currentGroupIds = currentGroups.map((group) => group.id);
            const groupsToDelete = currentGroupIds.filter((groupId) => !updateLocationBody.groups.includes(groupId));
            const groupsToAdd = updateLocationBody.groups.filter((groupId) => !currentGroupIds.includes(groupId));
            await MachineGroupDB.update({
                sk:null,
            }, {
                where:{
                    type:'GROUP',
                    id:{
                        [Op.in]:groupsToDelete,
                    },
                },
            });
            await MachineGroupDB.update({
                sk:locationId,
            }, {
                where:{
                    type:'GROUP',
                    id:{
                        [Op.in]:groupsToAdd,
                    },
                },
            });
        }
        if (updateLocationBody.geoFences){
            //delete already existing geoFences assiged to this group
            await MachineGroupDB.destroy({
                where:{
                    type:'GEOFENCE',
                    sk:locationId,
                },
            });
            await MachineGroupDB.bulkCreate(updateLocationBody.geoFences.map((geoFence) => ({
                type:'GEOFENCE',
                sk:locationId,
                data:JSON.stringify(geoFence),
            })));
        }
        LogDB.create({
            type:'Location Updated',
            message:`Location ${locationId} was updated`,
            referenceId:locationId,
            referenceType:'Location',
            userId:req.headers.userid,
        });
        res.status(200).json({ message: 'Location updated' });
    } catch (e) {
        res.status(500).json({ message: 'Error updating location' });
    }
};

export const deleteLocation:RequestHandler = async (req, res) => {
    if (req.headers.usertype !== 'admin'){
        res.status(400).json({ message: 'User not authorized' });
        return;
    }
    if (!req.params.locationId){
        res.status(400).json({ message: 'Location ID is required' });
        return;
    }
    try {
        const locationId = req.params.locationId;
        await MachineGroupDB.destroy({
            where:{
                type:'LOCATION',
                id:locationId,
            },
        });
        await MachineGroupDB.update({
            sk:null,
        }, {
            where:{
                type:'GROUP',
                sk:locationId,
            },
        });
        await MachineGroupDB.destroy({
            where:{
                type:'GEOFENCE',
                sk:locationId,
            },
        });
        LogDB.create({
            type:'Location Deleted',
            message:`Location ${locationId} was deleted`,
            referenceId:locationId,
            referenceType:'Location',
            userId:req.headers.userid,
        });
        res.status(200).json({ message: 'Location deleted' });
    } catch (e) {
        res.status(500).json({ message: 'Error deleting location' });
    }
};
type LocationMap = {
    [locationId:string]:{
        name:string;
        groups:string[];
        geoFences:GeoFence[];
    };
}
export const getLocations:RequestHandler = async (req, res) => {
    try {
        const locations = await MachineGroupDB.findAll({
            where:{
                type:'LOCATION',
            },
        }).then((locations) => locations.map((location) => location.toJSON())) as ShopLocation[];
        const locationMap:LocationMap = {};
        const groups = await MachineGroupDB.findAll({
            where:{
                type:'GROUP',
                sk:{
                    [Op.ne]:null,
                },
            },
        }).then((groups) => groups.map((group) => group.toJSON())) as MachineGroup[];
        const geoFences = await MachineGroupDB.findAll({
            where:{
                type:'GEOFENCE',
                sk:{
                    [Op.ne]:null,
                },
            },
        }).then((geoFences) => geoFences.map((geoFence) => geoFence.toJSON())) as GroupGeoFence[];

        for (const location of locations){
            locationMap[location.id] = {
                name:location.data,
                groups:groups.filter((group) => group.sk === location.id).map((group) => group.id),
                geoFences:geoFences.filter((geoFence) => geoFence.sk === location.id).map((geoFence) => JSON.parse(geoFence.data as string) as GeoFence),
            };
        }
        res.status(200).json(locationMap);
    } catch (e) {
        res.status(500).json({ message: 'Error getting locations' });
    }
};
export const getLocation:RequestHandler = async (req, res) => {
    try {
        const locationId = req.params.locationId;
        const location = await MachineGroupDB.findOne({
            where:{
                type:'LOCATION',
                id:locationId,
            },
        }).then((location) => location?.toJSON()) as ShopLocation;
        const groups = await MachineGroupDB.findAll({
            where:{
                type:'GROUP',
                sk:locationId,
            },
        }).then((groups) => groups.map((group) => group.toJSON())) as MachineGroup[];
        const geoFences = await MachineGroupDB.findAll({
            where:{
                type:'GEOFENCE',
                sk:locationId,
            },
        }).then((geoFences) => geoFences.map((geoFence) => geoFence.toJSON())) as GroupGeoFence[];
        res.status(200).json({
            name:location.data,
            groups:groups.map((group) => group.id),
            geoFences:geoFences.map((geoFence) => JSON.parse(geoFence.data as string) as GeoFence),
        });
    } catch (e) {
        res.status(500).json({ message: 'Error getting location' });
    }
};
