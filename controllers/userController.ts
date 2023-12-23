import { makerspaceConfig } from '../MakerspaceConfig';
import { MachineGroupDB, UserDB, LogDB } from '../models';
import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import { isLocationInAnyGeoFence } from '../util/locationCheck';
import { MachineGroupGeoFence } from '../models/MachineGroupModel';
import { User, UserType } from '../models/UserModel';
import { v4 as uuidv4 } from 'uuid';
import { Op } from 'sequelize';

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

export const register:RequestHandler = async (req, res) => {
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

        if (registerBody.registrationType === 'admin'){
            if (!registerBody.registrationKey || !bcrypt.compareSync(registerBody.registrationKey, makerspaceConfig.adminPassword)) {
                res.status(400).json({ message: 'Invalid registration key' });
                return;
            }
            UserDB.create({
                name: registerBody.name,
                email: registerBody.email,
                password: bcrypt.hashSync(registerBody.password, 12),
                userType:'admin',
                additionalInfo: registerBody.additionalInfo,
            });
            const newUser = await UserDB.findOne({ where: { email:registerBody.email } }).then((user) => user?.toJSON()) as User;
            LogDB.create({
                type:'Admin Created',
                message:`Admin ${registerBody.name} was created`,
                userId: newUser.id,
            });
            res.status(200).json({ message:'Admin user created!' });
            return;
        }
        else if (registerBody.registrationType === 'user'){
            const geoFences = await MachineGroupDB.findAll({ where:{ type:'GEOFENCE' } }).then((geoFences) => geoFences.map((geoFence) => geoFence.toJSON() as MachineGroupGeoFence));
            if (!isLocationInAnyGeoFence(registerBody.location, geoFences)){
                res.status(400).json({ message: 'Invalid location' });
                return;
            }

            if (!registerBody.registrationKey || !bcrypt.compareSync(registerBody.registrationKey, makerspaceConfig.registrationPassword)) {
                res.status(400).json({ message: 'Invalid registration key' });
                return;
            }
            UserDB.create({
                name: registerBody.name,
                email: registerBody.email,
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
        else {
            res.status(400).json({ message: 'Invalid registration type' });
            return;
        }

    } catch (error) {
        res.status(500).json({ message: error });
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
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        const user = await UserDB.findOne({ where: { id: userId, userType:userType } }).then((user) => user?.toJSON()) as User;

        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }

        if (bcrypt.compareSync(accessToken, user.accessToken ? user.accessToken : '')) {
            next();
        } else {
            res.status(400).json({ message: 'Invalid access token' });
            return;
        }
    } catch (e) {
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

