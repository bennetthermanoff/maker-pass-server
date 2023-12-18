import { RequestHandler } from 'express';
import { AuthenticateBody } from './userController';
import { MachineDB } from '../models';
import { v4 as UUIDV4 } from 'uuid';
import { Machine } from '../models/MachineModel';

interface createMachineBody extends AuthenticateBody {
    name: string;
    photo?: string;
    photoContentType?: string;
    mqttTopic?: string;
    solenoidMode: boolean;
    machineGroupId?: string;
    accessGroupId?: string;
    enableTapUnlock?: boolean;
}
export const createMachine:RequestHandler = async (req,res) => {
    try {
        const createMachineBody:createMachineBody = req.body;
        if (!createMachineBody.name && !createMachineBody.solenoidMode) {
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (createMachineBody.solenoidMode && !createMachineBody.mqttTopic){
            res.status(400).json({ message: 'Missing required fields' });
            return;
        }
        if (createMachineBody.userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }

        const machine = await MachineDB.create({
            name: createMachineBody.name,
            photo: createMachineBody.photo,
            photoContentType: createMachineBody.photoContentType,
            mqttTopic: createMachineBody.mqttTopic,
            solenoidMode: createMachineBody.solenoidMode,
            machineGroupId: createMachineBody.machineGroupId,
            accessGroupId: createMachineBody.accessGroupId,
            tapUnlockKey: createMachineBody.enableTapUnlock ? UUIDV4() : null,
        });
        res.status(200).json({ machine });
    } catch (e) {
        res.status(500).json({ message: e });
    }
};

interface updateMachineBody extends AuthenticateBody {
    name?: string;
    photo?: string;
    photoContentType?: string;
    mqttTopic?: string;
    solenoidMode?: boolean;
    machineGroupId?: string;
    accessGroupId?: string;
    enableTapUnlock?: boolean;
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
        if (!machine.solenoidMode && updateMachineBody.solenoidMode && (!updateMachineBody.mqttTopic && !machine.mqttTopic)){
            res.status(400).json({ message: 'Solenoid Mode requires MQTT' });
            return;
        }
        if (updateMachineBody.userType !== 'admin'){
            res.status(400).json({ message: 'Invalid user type' });
            return;
        }
        const machineUpdate:Omit<updateMachineBody,AuthenticateBody>= updateMachineBody;
        MachineDB.update({
            ...{updateMachineBody},
        
        res.status(200).json({ machine });
    } catch (e) {
        res.status(500).json({ message: e });
    }
}