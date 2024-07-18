import { MachineGroupDB, UserDB, LogDB, UserPermissionDB } from '../models';
import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import { GeoFence, isLocationInAnyGeoFence } from '../util/locationCheck';
import { MachineGroupGeoFence, MachineGroupGeoFenceJSON } from '../models/MachineGroupModel';
import { User, UserType } from '../models/UserModel';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';
import { UserPermissionEntry } from '../models/UserPermissionModel';
import { PermissionObject } from './userPermissionController';
import { MakerspaceConfig } from '../MakerspaceConfig';

type RegisterBody = {
    name: string;
    email: string;
    password: string;
    location?:{
        lat: number;
        lng: number;
    }
    registrationType: 'admin' | 'user';
    registrationKey?: string;
    additionalInfo?: object;
};

export const register: (makerspaceConfig:MakerspaceConfig)=>RequestHandler = (makerspaceConfig) => async (req, res) => {
    try {
        const registerBody:RegisterBody = req.body;
        if (!registerBody.name || !registerBody.email || !registerBody.password || !registerBody.registrationType) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (RegExp('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$').test(registerBody.email) === false) {
            res.status(400).json({ message: 'Invalid email' });
            return;
        }
        if (await UserDB.findOne({ where: { email: registerBody.email } }).then((user) => user?.toJSON()) as User) {
            res.status(400).json({ message: 'Email already in use' });
            return;
        }
        registerBody.email = registerBody.email.toLowerCase();
        const existingUser = await UserDB.findOne({ where: { email:registerBody.email } }).then((user) => user?.toJSON()) as User;
        if (existingUser){
            res.status(400).json({ message: 'Email already in use' });
            return;
        }
        const geoFences = await MachineGroupDB.findAll({ where:{ type:'GEOFENCE' } }).then((geoFences) => geoFences.map((geoFence) => {
            const geoFenceObj = geoFence.toJSON() as MachineGroupGeoFence;
            return {
                ...geoFenceObj,
                data:JSON.parse(geoFenceObj.data as string) as GeoFence,
            };
        }) as MachineGroupGeoFenceJSON[]);
        console.log('geoFences', geoFences, registerBody.location);

        if (!isLocationInAnyGeoFence(registerBody.location, geoFences)){
            res.status(400).json({ message: 'Invalid location' });
            return;
        }
        if (registerBody.registrationType !== 'user'){
            res.status(400).json({ message: 'Invalid registration type' });
            return;
        }
        if (registerBody.registrationKey !== makerspaceConfig.registrationPassword ) {
            res.status(400).json({ message: 'Invalid registration key' });
            return;
        }

        UserDB.create({
            name: registerBody.name,
            email: registerBody.email,
            userType:'user',
            password: bcrypt.hashSync(registerBody.password, 12),
            additionalInfo: registerBody.additionalInfo,
        });
        const newUser = await UserDB.findOne({ where: { email:registerBody.email } }).then((user) => user?.toJSON()) as User;
        LogDB.create({
            type:'User Created',
            message:`User ${registerBody.name} was created`,
            userId: newUser.id,
        });
        res.status(200).json({ message: 'User created!' });
        return;

    }
    catch (error) {
        res.status(500).json({ message: error });
        console.log(error);
    }
};

type LoginBody = {
    email: string;
    password: string;
};
export const login:RequestHandler = async (req, res) => {
    try {
        const loginBody:LoginBody = req.body;
        if (!loginBody.email || !loginBody.password) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        //case insensitive search
        const user = await UserDB.findOne({ where: { email:{ [Op.like]:loginBody.email } } }).then((user) => user?.toJSON()) as User;

        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }

        if (bcrypt.compareSync(loginBody.password, user.password)) {
            const token = uuidv4();
            const encryptedAccessToken = bcrypt.hashSync(token, 12);
            await UserDB.update({ accessToken: encryptedAccessToken }, { where: { id: user.id } });

            res.status(200).json({ token, userType:user.userType, userId:user.id });
            return;

        } else {
            res.status(400).json({ message: 'Invalid password' });
            return;
        }
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const authenticate:RequestHandler = async (req, res, next) => {
    try {
        const userId = req.headers.userid as string;
        const accessToken = req.headers.accesstoken as string;
        const userType = req.headers.usertype as UserType;
        if (!userId || !accessToken) {
            res.status(401).json({ message: 'Missing required fields' });
            return;
        }

        const user = await UserDB.findOne({ where: { id: userId, userType:userType } }).then((user) => user?.toJSON()) as User;

        if (!user) {
            res.status(401).json({ message: 'User not found' });
            return;
        }

        if (bcrypt.compareSync(accessToken, user.accessToken ? user.accessToken : '')) {
            next();
        } else {
            res.status(401).json({ message: 'Invalid access token' });
            return;
        }
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export const changeUserType:RequestHandler = async (req, res) => {
    try {
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;
        if (userType !== 'admin'){
            res.status(400).json({ message: 'User not authorized' });
            return;
        }

        const targetUserId = req.params.userId;
        const targetUserType = req.params.userType as UserType;
        if (!targetUserId || !targetUserType){
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (targetUserType !== 'admin'
            && targetUserType !== 'user'
            && targetUserType !== 'technician'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        await UserDB.update({ userType: targetUserType }, { where: { id: targetUserId } });
        await LogDB.create({ type:'User Type Changed', message:`User type changed to ${targetUserType} for user ${targetUserId}`, userId:userId, referenceId:targetUserId, referenceType:'user' });
        res.status(200).json({ message: 'User type updated' });
        return;
    }
    catch (e){
        res.status(500).json({ message: e });
    }
};

export const issueNewExternalAccessToken:RequestHandler = async (req, res) => {
    try {
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;

        const externalUserId = req.params.userId;
        if (!userId || !userType || !externalUserId) {
            res.status(400).json({ message: 'Missing required fields1' });
            return;
        }
        if (userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        const externalUser = await UserDB.findOne({ where: { id: externalUserId } }).then((user) => user?.toJSON()) as User;
        if (!externalUser) {
            res.status(400).json({ message: 'External user not found' });
            return;
        }
        const newAccessToken = uuidv4();
        const encryptedNewAccessToken = bcrypt.hashSync(newAccessToken, 12);
        await UserDB.update({ accessToken: encryptedNewAccessToken }, { where: { id: externalUser.id } });

        LogDB.create({
            type:'Token Issued',
            message:`An external access token was issued for ${externalUser.name}.`,
            userId:userId,
            referenceId:externalUser.id,
            referenceType:'user',
        });

        res.status(200).json({ accessToken: newAccessToken });
        return;

    }
    catch (e){
        res.status(500).json({ message: e });
    }
};

export const searchForUser:RequestHandler = async (req, res) => {
    try {
        const userType = req.headers.usertype as UserType;//either email or name
        if (userType == 'user'){
            res.status(400).json({ message: 'User not authorized' });
            return;
        }
        const searchTerm = req.params.searchTerm;
        if (!searchTerm){
            res.status(401).json({ message: 'Missing search term' });
            return;
        }
        const users = await UserDB.findAll({ limit:10, where: { [Op.or]:[{ email:{ [Op.like]:`%${searchTerm}%` } }, { name:{ [Op.like]:`%${searchTerm}%` } }] },
            attributes:{ exclude:['password','accessToken'] } }).then((users) => users.map((user) => user.toJSON())) as User[];

        const userPermissions = await UserPermissionDB.findAll({ where: { userId:{ [Op.in]:users.map((user) => user.id) } } }).then((userPermissions) => userPermissions.map((userPermission) => userPermission.toJSON())) as UserPermissionEntry[];

        const permissionObjectMap:{[userId:string]:PermissionObject} = {};

        users.forEach((user) => {
            permissionObjectMap[user.id] = { groups:[], machines:[] };
        });
        userPermissions.forEach((userPermission) => {
            if (userPermission.type === 'GROUP' && userPermission.permission){
                permissionObjectMap[userPermission.userId].groups.push({ id:userPermission.sk, permission:true });
            } else if (userPermission.type === 'MACHINE' && userPermission.permission){
                permissionObjectMap[userPermission.userId].machines.push({ id:userPermission.sk, permission:true });
            }
        });
        res.status(200).json({ users:users.map((user) => ({ ...user, permissionObject:permissionObjectMap[user.id] })) });
        return;
    }
    catch (e){
        res.status(500).json({ message: e });
    }
};

type UpdateUserBody = {
    newPassword: string;
}
export const changePassword:RequestHandler = async (req, res) => {
    try {
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;
        const body = req.body as UpdateUserBody;
        if (!userId || !userType){
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        const user = await UserDB.findOne({ where: { id: userId } }).then((user) => user?.toJSON()) as User;
        if (!user){
            res.status(400).json({ message: 'User not found' });
            return;
        }
        const newHashedPassword = bcrypt.hashSync(body.newPassword, 12);
        await UserDB.update({ password: newHashedPassword }, { where: { id: userId } });
        res.status(200).json({ message: 'Password updated' });
        return;
    } catch (e){
        res.status(500).json({ message: e });
    }
};

export const deleteUser:RequestHandler = async (req, res) => {
    try {
        const userId = req.headers.userid as string;
        const userType = req.headers.usertype as UserType;
        const targetUserId = req.params.userId;
        if (!userId || !userType || !targetUserId){
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (userType === 'admin' || userId === targetUserId){
            await UserDB.destroy({ where: { id: targetUserId } });
            res.status(200).json({ message: 'User deleted' });
            return;
        }
        res.status(400).json({ message: 'User not authorized' });
        return;
    } catch (e){
        res.status(500).json({ message: e });
    }
};

