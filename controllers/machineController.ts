import { RequestHandler } from 'express';
import { LogDB, MachineDB, MachineGroupDB, PermissionGroupDB, UserDB, UserPermissionDB } from '../models';
import { v4 as UUIDV4 } from 'uuid';
import { Machine } from '../models/MachineModel';
import { UserPermissionGroup } from '../models/UserPermissionModel';
import { PermissionGroupMachine } from '../models/PermissionGroupModel';
import { User, UserType } from '../models/UserModel';
import { MachineGroupGeoFence, MachineGroupMachine } from '../models/MachineGroupModel';
import { isLocationInGeoFence, Location } from '../util/locationCheck';

interface createMachineBody {
    machine:Partial<Machine>;
    requireEnableKey?: boolean;
}
export const  createMachine:RequestHandler = async (req,res) => {
    try {
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;

        const createMachineBody:createMachineBody = req.body;
        if (!createMachineBody.machine.name || createMachineBody.machine.solenoidMode === undefined) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (createMachineBody.machine.solenoidMode === true && !createMachineBody.machine.mqttTopic){
            res.status(400).json({ message: 'Missing required fields: mqttTopic' });
            return;
        }
        if (userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        await MachineDB.create({
            ...createMachineBody.machine,
            enableKey: createMachineBody.requireEnableKey ? UUIDV4() : null,
        });
        const machine = await MachineDB.findOne({ where: { name: createMachineBody.machine.name } }).then((machine) => machine?.toJSON()) as Machine;
        await LogDB.create({
            userId: userId,
            type: 'CREATE_MACHINE',
            message: JSON.stringify(machine),
            referenceId: machine.id,
            referenceType: 'MACHINE',
        });
        res.status(200).json({ machine });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

interface updateMachineBody {
    machine?:Partial<Machine>;
    requireEnableKey?: boolean;
}
export const updateMachine:RequestHandler = async (req,res) => {
    try {
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;

        const updateMachineBody:updateMachineBody = req.body;
        const machineId = req.params.machineId;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (!updateMachineBody.machine){
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const machine = await MachineDB.findOne({ where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        if (!machine){
            res.status(400).json({ message: 'Machine not found' });
            return;
        }
        if (!machine.solenoidMode && updateMachineBody.machine.solenoidMode && (!updateMachineBody.machine.mqttTopic && !machine.mqttTopic)){
            res.status(400).json({ message: 'Solenoid Mode requires MQTT' });
            return;
        }
        if (userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        MachineDB.update({
            ...updateMachineBody.machine,
            enableKey:updateMachineBody.requireEnableKey || machine.enableKey ? UUIDV4() : null,
        }, { where: { id: machineId },
        });
        const updatedMachine = await MachineDB.findOne({ where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        updatedMachine.photo = null;
        updatedMachine.photoContentType = null;
        await LogDB.create({
            userId: userId,
            type: 'UPDATE_MACHINE',
            message: JSON.stringify(updatedMachine),
            referenceId: machineId,
            referenceType: 'MACHINE',

        });
        res.status(200).json({ machine: updatedMachine, message: 'Machine updated' });

    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const getMachine:RequestHandler = async (req,res) => {
    try {
        const userType = req.headers.usertype as UserType;
        const machineId = req.params.machineId;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const machine = await MachineDB.findOne({ attributes: { exclude:['photo','photoContentType'] }, where: { id: machineId } }).then((machine) => {
            const jsonMachine:Machine|undefined = machine?.toJSON();
            if (jsonMachine?.enableKey && userType !== 'admin'){
                jsonMachine.enableKey = null;
            }
            return jsonMachine;
        });
        if (!machine){
            res.status(400).json({ message: 'Machine not found' });
            return;
        }
        res.status(200).json({ machine });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const getAllMachines = ({ sendPhotos }:{sendPhotos:boolean}):RequestHandler  => async (req,res) => {
    try {
        const userType = req.headers.usertype as UserType;
        const machines = await MachineDB.findAll(sendPhotos ? {} : { attributes: { exclude:['photo','photoContentType'] } }).then((machines) => machines.map((machine) => {
            const jsonMachine:Machine = machine.toJSON();
            if (jsonMachine.enableKey && userType !== 'admin'){
                jsonMachine.enableKey = null;
            }
            return jsonMachine;
        })) as Machine[];
        res.status(200).json({ machines });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const getMachinesByGroupId:RequestHandler = async (req,res) => {
    try {
        const userType = req.headers.usertype as UserType;
        const machineGroupId = req.params.groupId;
        if (!machineGroupId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const machines = await MachineDB.findAll({ attributes: { exclude:['photo','photoContentType'] }, where: { machineGroupId } }).then((machines) => machines.map((machine) => {
            const jsonMachine:Machine = machine.toJSON();
            if (jsonMachine.enableKey && userType !== 'admin'){
                jsonMachine.enableKey = null;
            }
            return jsonMachine;
        }));
        res.status(200).json({ machines });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const deleteMachine:RequestHandler = async (req,res) => {
    try {
        const machineId = req.params.machineId;
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        const machine = await MachineDB.findOne({ attributes: { exclude:['photo','photoContentType'] }, where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        if (!machine){
            res.status(400).json({ message: 'Machine not found' });
            return;
        }
        await MachineDB.destroy({ where: { id: machineId } });
        await LogDB.create({
            userId: userId,
            type: 'DELETE_MACHINE',
            message: JSON.stringify(machine),
            referenceId: machineId,
            referenceType: 'MACHINE',
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

interface EnableMachineBody {
    enableKey?:string;
    location?:Location;
}
export const enableMachine:RequestHandler = async (req,res) => {
    try {
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;

        const machineId = req.params.machineId;
        const body = req.body as EnableMachineBody;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const user = await UserDB.findOne({ where: { id: userId } }).then((user) => user?.toJSON()as User);
        if (!user){
            res.status(400).json({ message: 'User not found' });
            return;
        }
        const machine = await MachineDB.findOne({ attributes: { exclude:['photo','photoContentType'] }, where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        if (!machine){
            res.status(400).json({ message: 'Machine not found' });
            return;
        }
        if (machine.enableKey && machine.enableKey !== body.enableKey && userType == 'user'){
            res.status(400).json({ message: 'Invalid enable key' });
            return;
        }
        const machineGroupMachine = await MachineGroupDB.findOne({ where: { data: machine.id, type: 'MACHINE' } }).then((machineGroup) => machineGroup?.toJSON()) as MachineGroupMachine;
        if (machineGroupMachine){
            const geoFence = await MachineGroupDB.findOne({ where: { sk: machineGroupMachine?.sk, type: 'GEOFENCE' } }).then((machineGroup) => machineGroup?.toJSON()) as MachineGroupGeoFence;
            if (geoFence && !isLocationInGeoFence(body.location, geoFence.data)){
                res.status(400).json({ message: 'Invalid location' });
                return;
            }
        }

        const permittedMachineIds = await getPermittedMachineIds(userId);
        if (!permittedMachineIds.includes(machineId)){
            res.status(400).json({ message: 'User not permitted to enable machine' });
            return;
        }
        // TODO: MQTT ENABLE HERE
        await MachineDB.update({ enabled: true }, { where: { id: machineId } });
        await LogDB.create({
            type: 'ENABLE_MACHINE',
            message: JSON.stringify(machine),
            referenceId: machineId,
            referenceType: 'MACHINE',
            userId: userId,
        });
        res.status(200).json({ message: 'Machine enabled', machine });

    } catch (e) {
        res.status(500).json({ message: e });
    }
};

interface DisableMachineBody extends EnableMachineBody {}
export const disableMachine:RequestHandler = async (req,res) => {
    try {
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;

        const machineId = req.params.machineId;
        const body = req.body as DisableMachineBody;
        if (!machineId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const user = await UserDB.findOne({ where: { id: userId } }).then((user) => user?.toJSON()as User);
        if (!user){
            res.status(400).json({ message: 'User not found' });
            return;
        }
        const machine = await MachineDB.findOne({ attributes: { exclude:['photo','photoContentType'] }, where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;
        if (!machine){
            res.status(400).json({ message: 'Machine not found' });
            return;
        }
        const machineGroupMachine = await MachineGroupDB.findOne({ where: { data: machine.id, type: 'MACHINE' } }).then((machineGroup) => machineGroup?.toJSON()) as MachineGroupMachine;
        if (machineGroupMachine){
            const geoFence = await MachineGroupDB.findOne({ where: { sk: machineGroupMachine?.sk, type: 'GEOFENCE' } }).then((machineGroup) => machineGroup?.toJSON()) as MachineGroupGeoFence;
            if (geoFence && !isLocationInGeoFence(body.location, geoFence.data) && userType == 'user'){
                res.status(400).json({ message: 'Invalid location' });
                return;
            }
        }
        //TODO: MQTT DISABLE HERE
        await MachineDB.update({ enabled: false }, { where: { id: machineId } });
        await LogDB.create({
            type: 'DISABLE_MACHINE',
            message: JSON.stringify(machine),
            referenceId: machineId,
            referenceType: 'MACHINE',
            userId: userId,
        });
        const updatedMachine = await MachineDB.findOne({ attributes: { exclude:['photo','photoContentType'] }, where: { id: machineId } }).then((machine) => machine?.toJSON()) as Machine;

        res.status(200).json({ message: 'Machine disabled', machine:updatedMachine });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const disableAllMachines:RequestHandler = async (req,res) => {
    try {
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;
        if (userType === 'user'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        await MachineDB.update({ enabled: false }, { where: {} });
        //TODO: MQTT DISABLE HERE
        await LogDB.create({
            type: 'DISABLE_ALL_MACHINES',
            message: 'All machines disabled',
            userId: userId,
        });

        res.status(200).json({ message: 'All machines disabled' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const disableAllMachinesByGroupId:RequestHandler = async (req,res) => {
    try {
        const machineGroupId = req.params.groupId;
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;
        if (!machineGroupId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (userType === 'user'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        const machineGroupMachineIds = await MachineGroupDB.findAll({ where: { sk: machineGroupId, type: 'MACHINE' } }).then((machineGroups) => machineGroups.map((machineGroup) => (machineGroup.toJSON() as MachineGroupMachine).data));
        await MachineDB.update({ enabled: false }, { where: { id: machineGroupMachineIds } });
        //TODO: MQTT DISABLE HERE
        await LogDB.create({
            type: 'DISABLE_ALL_MACHINES',
            message: `All machines in group ${machineGroupId} disabled`,
            referenceId: machineGroupId,
            referenceType: 'MACHINEGROUP',
            userId: userId,
        });

        res.status(200).json({ message: 'All machines disabled' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};