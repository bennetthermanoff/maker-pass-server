import { RequestHandler } from 'express';
import { AuthenticateBody } from './userController';
import { LogDB, MachineDB, MachineGroupDB, PermissionGroupDB, UserDB, UserPermissionDB } from '../models';
import { v4 as UUIDV4 } from 'uuid';
import { Machine } from '../models/MachineModel';
import { UserPermissionGroup } from '../models/UserPermissionModel';
import { PermissionGroupMachine } from '../models/PermissionGroupModel';
import { User } from '../models/UserModel';
import { MachineGroupGeoFence } from '../models/MachineGroupModel';
import { isLocationInGeoFence, Location } from '../util/locationCheck';

interface createMachineBody extends AuthenticateBody {
    machine:Partial<Machine>;
    requireEnableKey?: boolean;
}
export const createMachine:RequestHandler = async (req,res) => {
    try {
        const createMachineBody:createMachineBody = req.body;
        if (!createMachineBody.machine.name && !createMachineBody.machine.solenoidMode) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (createMachineBody.machine.solenoidMode && !createMachineBody.machine.mqttTopic){
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (createMachineBody.userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }

        await MachineDB.create({
            ...createMachineBody.machine,
            enableKey: createMachineBody.requireEnableKey ? UUIDV4() : null,
        });
        const machine = await MachineDB.findOne({ where: { name: createMachineBody.machine.name } }).then((machine) => machine?.toJSON()) as Machine;
        await LogDB.create({
            userId: createMachineBody.userId,
            action: 'CREATE_MACHINE',
            data: JSON.stringify(machine),
        });
        res.status(200).json({ machine });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

interface updateMachineBody extends AuthenticateBody {
    machineUpdates:Partial<Machine>;
    requireEnableKey?: boolean;
}
export const updateMachine:RequestHandler = async (req,res) => {
    try {
        const updateMachineBody:updateMachineBody = req.body;
        const machineId = req.params.machineId;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const machine = await MachineDB.findOne({ where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        if (!machine){
            res.status(400).json({ message: 'Machine not found' });
            return;
        }
        if (!machine.solenoidMode && updateMachineBody.machineUpdates.solenoidMode && (!updateMachineBody.machineUpdates.mqttTopic && !machine.mqttTopic)){
            res.status(400).json({ message: 'Solenoid Mode requires MQTT' });
            return;
        }
        if (updateMachineBody.userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        MachineDB.update({
            ...updateMachineBody.machineUpdates,
            enableKey:updateMachineBody.requireEnableKey || machine.enableKey ? UUIDV4() : null,
        }, { where: { id: machineId },
        });
        const updatedMachine = await MachineDB.findOne({ where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        await LogDB.create({
            userId: updateMachineBody.userId,
            action: 'UPDATE_MACHINE',
            data: JSON.stringify(updatedMachine),
        });
        res.status(200).json({ machine: updatedMachine, message: 'Machine updated' });

    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const getMachine:RequestHandler = async (req,res) => {
    try {
        const machineId = req.params.machineId;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const machine = await MachineDB.findOne({ where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        if (!machine){
            res.status(400).json({ message: 'Machine not found' });
            return;
        }
        res.status(200).json({ machine });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const getMachines:RequestHandler = async (req,res) => {
    try {
        const machines = await MachineDB.findAll().then((machines) => machines.map((machine) => machine.toJSON())) as Machine[];
        res.status(200).json({ machines });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const getMachinesByGroupId:RequestHandler = async (req,res) => {
    try {
        const machineGroupId = req.params.machineGroupId;
        if (!machineGroupId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const machines = await MachineDB.findAll({ where: { machineGroupId } }).then((machines) => machines.map((machine) => machine.toJSON())) as Machine[];
        res.status(200).json({ machines });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const deleteMachine:RequestHandler = async (req,res) => {
    try {
        const machineId = req.params.machineId;
        const body = req.body as AuthenticateBody;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (body.userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        await MachineDB.destroy({ where: { id: machineId } });
        await LogDB.create({
            userId: body.userId,
            action: 'DELETE_MACHINE',
            data: machineId,
        });
        res.status(200).json({ message: 'Machine deleted' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const getPermittedMachineIds = async (userId:string):Promise<string[]> => {
    const userPermissionGroups = await UserPermissionDB.findAll({ where: { userId, type: 'PERMISSIONGROUP' } }).then((permissionGroups) => permissionGroups.map((permissionGroup) => permissionGroup.toJSON())) as UserPermissionGroup[];
    const permittedMachineIds = await Promise.all(userPermissionGroups.map(async (userPermissionGroup) => {
        const permissionGroup = await PermissionGroupDB.findAll({ where: { id: userPermissionGroup.sk } }).then((permissionGroups) => permissionGroups.map((permissionGroup) => permissionGroup.toJSON())) as PermissionGroupMachine[];
        if (!permissionGroup){
            return [];
        }
        const machineIds = permissionGroup.map((permissionGroup) => permissionGroup.data);
        return machineIds;
    }));
    const singleMachinePermissions = await UserPermissionDB.findAll({ where: { userId, type: 'MACHINE' } }).then((permissionGroups) => permissionGroups.map((permissionGroup) => permissionGroup.toJSON())) as UserPermissionGroup[];
    const singleMachineIds = singleMachinePermissions.map((singleMachinePermission) => singleMachinePermission.sk);
    const totalPermittedMachineIds = permittedMachineIds.flat().concat(singleMachineIds);
    return totalPermittedMachineIds;
};
export const getPermittedMachineIdsRoute:RequestHandler = async (req,res) => {
    try {
        const userId = req.params.userId;
        if (!userId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const totalPermittedMachineIds = await getPermittedMachineIds(userId);
        res.status(200).json({ permittedMachineIds: totalPermittedMachineIds });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

interface EnableMachineBody extends AuthenticateBody {
    enableKey?:string;
    location?:Location;
}
export const enableMachine:RequestHandler = async (req,res) => {
    try {
        const machineId = req.params.machineId;
        const body = req.body as EnableMachineBody;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const user = await UserDB.findOne({ where: { id: body.userId } }).then((user) => user?.toJSON()as User);
        if (!user){
            res.status(400).json({ message: 'User not found' });
            return;
        }
        const machine = await MachineDB.findOne({ where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        if (!machine){
            res.status(400).json({ message: 'Machine not found' });
            return;
        }
        if (machine.enableKey && machine.enableKey !== body.enableKey && user.userType == 'user'){
            res.status(400).json({ message: 'Invalid enable key' });
            return;
        }
        const geoFence = await MachineGroupDB.findOne({ where: { id: machine.machineGroupId, type: 'GEOFENCE' } }).then((machineGroup) => machineGroup?.toJSON()) as MachineGroupGeoFence;
        if (geoFence && !isLocationInGeoFence(body.location, geoFence.data)){
            res.status(400).json({ message: 'Invalid location' });
            return;
        }
        const permittedMachineIds = await getPermittedMachineIds(body.userId);
        if (!permittedMachineIds.includes(machineId)){
            res.status(400).json({ message: 'User not permitted to enable machine' });
            return;
        }

        await MachineDB.update({ enabled: true }, { where: { id: machineId } });
        // TODO: MQTT ENABLE HERE
        await LogDB.create({
            userId: body.userId,
            action: 'ENABLE_MACHINE',
            data: machineId,
        });
        res.status(200).json({ message: 'Machine enabled' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

interface DisableMachineBody extends EnableMachineBody {}
export const disableMachine:RequestHandler = async (req,res) => {
    try {
        const machineId = req.params.machineId;
        const body = req.body as DisableMachineBody;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const user = await UserDB.findOne({ where: { id: body.userId } }).then((user) => user?.toJSON()as User);
        if (!user){
            res.status(400).json({ message: 'User not found' });
            return;
        }
        const machine = await MachineDB.findOne({ where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        if (!machine){
            res.status(400).json({ message: 'Machine not found' });
            return;
        }
        const geoFence = await MachineGroupDB.findOne({ where: { id: machine.machineGroupId, type: 'GEOFENCE' } }).then((machineGroup) => machineGroup?.toJSON()) as MachineGroupGeoFence;
        if (geoFence && !isLocationInGeoFence(body.location, geoFence.data) && user.userType == 'user'){
            res.status(400).json({ message: 'Invalid location' });
            return;
        }
        await MachineDB.update({ enabled: false }, { where: { id: machineId } });
        //TODO: MQTT DISABLE HERE
        await LogDB.create({
            userId: body.userId,
            action: 'DISABLE_MACHINE',
            data: machineId,
        });
        res.status(200).json({ message: 'Machine disabled' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const disableAllMachines:RequestHandler = async (req,res) => {
    try {
        const body = req.body as AuthenticateBody;
        if (body.userType === 'user'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        await MachineDB.update({ enabled: false }, { where: {} });
        //TODO: MQTT DISABLE HERE
        await LogDB.create({
            userId: body.userId,
            action: 'DISABLE_ALL_MACHINES',
            data: '',
        });
        res.status(200).json({ message: 'All machines disabled' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const disableAllMachinesByGroupId:RequestHandler = async (req,res) => {
    try {
        const machineGroupId = req.params.machineGroupId;
        const body = req.body as AuthenticateBody;
        if (!machineGroupId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (body.userType === 'user'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        await MachineDB.update({ enabled: false }, { where: { machineGroupId } });
        //TODO: MQTT DISABLE HERE
        await LogDB.create({
            userId: body.userId,
            action: 'DISABLE_ALL_MACHINES_BY_GROUP_ID',
            data: machineGroupId,
        });
        res.status(200).json({ message: 'All machines disabled' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};
