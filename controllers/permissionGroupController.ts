import { RequestHandler } from 'express';
import { PermissionGroupDB } from '../models';
import { PermissionGroup, PermissionGroupEntry, PermissionGroupMachine } from '../models/PermissionGroupModel';
import { UserType } from '../models/UserModel';

type PermissionGroupObject = {
    [groupId:string]:{
        name:string;
        machineIds:string[];
    }
}
export const getPermissionGroups:RequestHandler = async (req, res) => {
    try {
        const permissionGroupEntries = await PermissionGroupDB.findAll().then((permissionGroups) => permissionGroups.map((permissionGroup) => permissionGroup.toJSON())) as PermissionGroupEntry[];
        const permissionGroupObject:PermissionGroupObject = {};
        permissionGroupEntries.forEach((permissionGroupEntry) => {
            if (permissionGroupEntry.type === 'GROUP'){
                const permissionGroup = permissionGroupEntry as PermissionGroup;
                permissionGroupObject[permissionGroup.id] = {
                    name: permissionGroup.data,
                    machineIds: [],
                };
            }
            else if (permissionGroupEntry.type === 'MACHINE'){
                const permissionGroupMachine = permissionGroupEntry as PermissionGroupMachine;
                permissionGroupObject[permissionGroupMachine.sk].machineIds.push(permissionGroupMachine.data);
            }
        });
        res.status(200).json(permissionGroupObject);
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

type CreatePermissionGroupBody = {
    name: string;
    machineIds?: string[];
};
export const createPermissionGroup:RequestHandler = async (req, res) => {
    try {
        const userType = req.headers.usertype as UserType;
        if (userType !== 'admin'){
            res.status(400).json({ message: 'User not authorized' });
            return;
        }
        const createPermissionGroupBody = req.body as CreatePermissionGroupBody;
        const permissionGroup = await PermissionGroupDB.create({
            type:'GROUP',
            sk:null,
            data:createPermissionGroupBody.name,
        }).then((permissionGroup) => permissionGroup.toJSON()) as PermissionGroup;

        const permissionGroupObject:PermissionGroupObject = { [permissionGroup.id]:{ name:permissionGroup.data, machineIds:[] } };
        if (createPermissionGroupBody.machineIds){
            const permissionGroupMachines = await PermissionGroupDB.bulkCreate(createPermissionGroupBody.machineIds.map((machineId) => ({
                type:'MACHINE',
                sk:permissionGroup.id,
                data:machineId,
            }))).then((permissionGroupMachines) => permissionGroupMachines.map((permissionGroupMachine) => permissionGroupMachine.toJSON())) as PermissionGroupMachine[];

            permissionGroupMachines.forEach((permissionGroupMachine) => {
                permissionGroupObject[permissionGroupMachine.sk].machineIds.push(permissionGroupMachine.data);
            });
        }
        res.status(200).json({ permissionGroup:permissionGroupObject, message: 'Permission Group created!' });
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

type UpdatePermissionGroupBody = Partial<CreatePermissionGroupBody>;
export const updatePermissionGroup:RequestHandler = async (req, res) => {
    try {
        const userType = req.headers.usertype as UserType;
        if (userType !== 'admin'){
            res.status(400).json({ message: 'User not authorized' });
            return;
        }
        const permissionGroupId = req.params.permissionGroupId as string;
        const updatePermissionGroupBody = req.body as UpdatePermissionGroupBody;
        const permissionGroup = await PermissionGroupDB.findOne({ where: { id: permissionGroupId } }).then((permissionGroup) => permissionGroup?.toJSON()) as PermissionGroup;
        if (!permissionGroup){
            res.status(400).json({ message: 'Permission Group not found' });
            return;
        }
        if (updatePermissionGroupBody.name){
            await PermissionGroupDB.update({ data:updatePermissionGroupBody.name }, { where: { id: permissionGroupId } });
        }
        if (updatePermissionGroupBody.machineIds){
            await PermissionGroupDB.destroy({ where: { type:'MACHINE', sk:permissionGroupId } });
            await PermissionGroupDB.bulkCreate(updatePermissionGroupBody.machineIds.map((machineId) => ({
                type:'MACHINE',
                sk:permissionGroupId,
                data:machineId,
            })));
        }
        const permissionGroupObject:PermissionGroupObject = { [permissionGroup.id]:{ name:permissionGroup.data, machineIds:[] } };
        const permissionGroupMachines = await PermissionGroupDB.findAll({ where: { type:'MACHINE', sk:permissionGroupId } }).then((permissionGroupMachines) => permissionGroupMachines.map((permissionGroupMachine) => permissionGroupMachine.toJSON())) as PermissionGroupMachine[];
        permissionGroupMachines.forEach((permissionGroupMachine) => {
            permissionGroupObject[permissionGroupMachine.sk].machineIds.push(permissionGroupMachine.data);
        });
        res.status(200).json({ permissionGroup:permissionGroupObject, message: 'Permission Group updated!' });
    } catch (error) {
        res.status(500).json({ message: error });
    }
};

export const deletePermissionGroup:RequestHandler = async (req, res) => {
    try {
        const userType = req.headers.usertype as UserType;
        if (userType !== 'admin'){
            res.status(400).json({ message: 'User not authorized' });
            return;
        }
        const permissionGroupId = req.params.permissionGroupId as string;
        await PermissionGroupDB.destroy({ where: { id: permissionGroupId } });
        await PermissionGroupDB.destroy({ where: { type:'MACHINE', sk:permissionGroupId } });
        res.status(200).json({ message: 'Permission Group deleted!' });
    } catch (error) {
        res.status(500).json({ message: error });
    }
};
