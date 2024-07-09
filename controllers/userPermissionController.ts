import { RequestHandler } from 'express';
import { LogDB, MachineDB, PermissionGroupDB, UserDB, UserPermissionDB } from '../models';
import { UserPermissionEntry } from '../models/UserPermissionModel';
import { User, UserType } from '../models/UserModel';
import { Op } from 'sequelize';

export type PermissionObject = {groups:{id:string; permission:boolean;}[], machines:{id:string; permission:boolean;}[]};

export const getPermissions:RequestHandler = async (req, res) => {
    try {
        const userType = req.headers.usertype as UserType;
        if (userType == 'user'){
            res.status(400).json({ message: 'User not authorized' });
            return;
        }
        const requestUserId = req.params.userId;
        const user = await UserDB.findOne({ where: { id: requestUserId } }).then((user) => user?.toJSON()) as User;
        if (!user){
            res.status(400).json({ message: 'User not found' });
            return;
        }
        const userPermissions = await UserPermissionDB.findAll({ where: { userId: requestUserId } }).then((userPermissions) => userPermissions.map((userPermission) => userPermission.toJSON())) as UserPermissionEntry[];
        const permissionObject:PermissionObject = { groups:[], machines:[] };
        userPermissions.forEach((userPermission) => {
            if (userPermission.type === 'GROUP'){
                permissionObject.groups.push({ id:userPermission.sk, permission:userPermission.permission });
            } else if (userPermission.type === 'MACHINE'){
                permissionObject.machines.push({ id:userPermission.sk, permission:userPermission.permission });
            }
        });
        res.status(200).json(permissionObject);
    } catch (e) {
        res.status(500).json({ message: e });
    }

};

type UpdatePermissionsBody = PermissionObject;
export const updatePermissions:RequestHandler = async (req, res) => {
    try {
        const userType = req.headers.usertype as UserType;
        if (userType == 'user'){
            res.status(400).json({ message: 'User not authorized' });
            return;
        }
        const requestUserId = req.params.userId;
        const user = await UserDB.findOne({ where: { id: requestUserId } }).then((user) => user?.toJSON()) as User;
        if (!user){
            res.status(400).json({ message: 'User not found' });
            return;
        }
        const permissionObject = req.body as UpdatePermissionsBody;

        const areAllIdsUnique = permissionObject.groups.map((group) => group.id).concat(permissionObject.machines.map((machine) => machine.id)).filter((value, index, self) => self.indexOf(value) === index).length === permissionObject.groups.map((group) => group.id).concat(permissionObject.machines.map((machine) => machine.id)).length;
        if (!areAllIdsUnique){
            res.status(400).json({ message: 'Duplicate id' });
            return;
        }

        const areAllGroupsValid = await PermissionGroupDB.findAndCountAll({ where: { id: { [Op.in]: permissionObject.groups.map((group) => group.id) } } }).then((result) => result.count === permissionObject.groups.length);
        if (!areAllGroupsValid){
            res.status(400).json({ message: 'Invalid group id' });
            return;
        }
        const areAllMachinesValid = await MachineDB.findAndCountAll({ where: { id: { [Op.in]: permissionObject.machines.map((machine) => machine.id) } } }).then((result) => result.count === permissionObject.machines.length);
        if (!areAllMachinesValid){
            res.status(400).json({ message: 'Invalid machine id' });
            return;
        }
        // delete all existing permissions if they exist
        if (await UserPermissionDB.count({ where: { userId: requestUserId } }) > 0){
            await UserPermissionDB.destroy({ where: { userId: requestUserId } });
        }

        await UserPermissionDB.bulkCreate(permissionObject.groups.map((group) => ({
            userId: requestUserId,
            type:'GROUP',
            sk:group.id,
            permission:group.permission,
        })));
        await UserPermissionDB.bulkCreate(permissionObject.machines.map((machine) => ({
            userId: requestUserId,
            type:'MACHINE',
            sk:machine.id,
            permission:machine.permission,
        })));
        await LogDB.create({
            type:'PERMISSION',
            message:`Permissions updated for user ${user.id} by ${req.headers.userid}`,
            userId:req.headers.userid,
            referenceId:[...permissionObject.groups.map((group) => group.id), ...permissionObject.machines.map((machine) => machine.id)].join(','),
            referenceType:'PERMISSIONS',
        });
        res.status(200).json({ message: 'Permissions updated!' });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};