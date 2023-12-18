import { makerspaceConfig } from '../MakerspaceConfig';
import { MachineGroupDB, UserDB, LogDB } from '../models';
import { RequestHandler } from 'express';
import bcrypt from 'bcrypt';
import { isLocationInAnyGeoFence } from '../util/locationCheck';
import { MachineGroupGeoFence } from '../models/MachineGroupModel';
import { User, UserType } from '../models/UserModel';
import { v4 as uuidv4 } from 'uuid';

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

        if (await UserDB.findOne({ where: { email: registerBody.email } }).then((user) => user?.toJSON()) as User) {
            res.status(400).json({ message: 'Email already in use' });
            return;
        }

        switch (registerBody.registrationType) {
        case 'admin':{
            if (!registerBody.registrationKey || bcrypt.compareSync(registerBody.registrationKey, makerspaceConfig.adminPassword)) {
                res.status(400).json({ message: 'Invalid registration key' });
                return;
            }
            UserDB.create({
                name: registerBody.name,
                email: registerBody.email,
                password: bcrypt.hashSync(registerBody.password, 12),
                admin: true,
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
        case 'user':{
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
        default:{
            res.status(400).json({ message: 'Invalid registration type' });
            return;
        }
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

        const user = await UserDB.findOne({ where: { email: loginBody.email } }).then((user) => user?.toJSON()) as User;

        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }

        if (bcrypt.compareSync(loginBody.password, user.password)) {
            const accessToken = uuidv4();
            const encryptedAccessToken = bcrypt.hashSync(accessToken, 12);
            await UserDB.update({ accessToken: encryptedAccessToken }, { where: { id: user.id } });

            res.status(200).json({ accessToken });
            return;

        } else {
            res.status(400).json({ message: 'Invalid password' });
            return;
        }
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

export type AuthenticateBody = {
    userId: string;
    accessToken: string;
    userType: UserType;
};
export const authenticate:RequestHandler = async (req, res, next) => {
    try {
        const authenticateBody:AuthenticateBody = req.body;
        if (!authenticateBody.userId || !authenticateBody.accessToken) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }

        const user = await UserDB.findOne({ where: { id: authenticateBody.userId, userType:authenticateBody.userType } }).then((user) => user?.toJSON()) as User;

        if (!user) {
            res.status(400).json({ message: 'User not found' });
            return;
        }

        if (bcrypt.compareSync(authenticateBody.accessToken, user.accessToken ? user.accessToken : '')) {
            next();
        } else {
            res.status(400).json({ message: 'Invalid access token' });
            return;
        }
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

interface IssueNewExternalAccessTokenBody extends AuthenticateBody {}
export const issueNewExternalAccessToken:RequestHandler = async (req, res) => {
    try {
        const issueNewExternalAccessTokenBody:IssueNewExternalAccessTokenBody = req.body;
        const externalUserId = req.params.userId;
        if (!issueNewExternalAccessTokenBody.userId || !issueNewExternalAccessTokenBody.userType || !externalUserId) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (issueNewExternalAccessTokenBody.userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        const externalUser = await UserDB.findOne({ where: { id: externalUserId } }).then((user) => user?.toJSON()) as User;
        if (!externalUser) {
            res.status(400).json({ message: 'External user not found' });
            return;
        }
        const accessToken = uuidv4();
        const encryptedAccessToken = bcrypt.hashSync(accessToken, 12);
        await UserDB.update({ accessToken: encryptedAccessToken }, { where: { id: externalUser.id } });

        LogDB.create({
            type:'Token Issued',
            message:`An external access token was issued for ${externalUser.name}.`,
            userId:issueNewExternalAccessTokenBody.userId,
            referenceId:externalUser.id,
            referenceType:'user',
        });

        res.status(200).json({ accessToken });
        return;

    }
    catch (e){
        res.status(500).json({ message: e });
    }
};

