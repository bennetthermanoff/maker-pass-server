import { TagOutDB, MachineDB, UserDB } from '../models';
import { RequestHandler } from 'express';
import { TagOut } from '../models/TagOutModel';
import { User } from '../models/UserModel';
import { Machine } from '../models/MachineModel';

export const getTagOutsByMachineId: RequestHandler = async (req, res) => {
    const machineId = req.params.machineId;
    const numberOfTagOutsString = req.query.limit as string;
    if (!machineId) {
        res.status(400).send('Machine ID is required');
        return;
    }
    let numberOfTagOuts = 0;
    if (isNaN(parseInt(numberOfTagOutsString)) && numberOfTagOutsString != 'all') {
        res.status(400).send('Invalid number of tag outs');
        return;
    }
    if (numberOfTagOutsString != 'all') {
        numberOfTagOuts = parseInt(numberOfTagOutsString);
        if (numberOfTagOuts < 1) {
            res.status(400).send('Invalid number of tag outs');
            return;
        }
    }

    const tagOuts = await TagOutDB.findAll({ where: { machineId }, limit: numberOfTagOuts === 0 ? undefined : numberOfTagOuts, order: [['createdAt', 'DESC']] }).then((tagOuts) => tagOuts.map((tagOut) => tagOut.toJSON() as TagOut));
    const users = await UserDB.findAll({ where: { id: tagOuts.map((tagOut) => tagOut.userId)
        .concat(tagOuts.map((tagOut) => tagOut.removedBy).filter((userId) => userId !== null) as string[]) } })
        .then((users) => users.map((user) => user.toJSON() as User));
    const tagOutsWithNames: Array<TagOut & { userName: string , removedByName?:string|null}> = tagOuts.map((tagOut) => {
        const name_in = users.find((user) => user.id === tagOut.userId)?.name;
        const name_out = tagOut.removedBy ? users.find((user) => user.id === tagOut.removedBy)?.name : null;

        return { ...tagOut, userName: name_in ? name_in : 'Unknown', removedByName: name_out };
    });
    res.json(tagOutsWithNames);
};

type TagOutCreateBody = {
    reason: string;
}
export const createTagOut: RequestHandler = async (req, res) => {
    const machineId = req.params.machineId;
    if (!machineId) {
        res.status(400).send('Machine ID is required');
        return;
    }
    const userId = req.headers.userid as string;
    const userType = req.headers.usertype as string;
    if (userType === 'user') {
        res.status(403).send('Only admins/technicians can create tag outs');
        return;
    }
    const body = req.body as TagOutCreateBody;
    if (!body.reason) {
        res.status(400).send('Reason is required');
        return;
    }
    const machine = await MachineDB.findByPk(machineId).then((machine) => machine?.toJSON()as Machine);
    if (!machine) {
        res.status(404).send('Machine not found');
        return;
    }
    if (machine.latestTagOutId) {
        res.status(400).send('Machine already tagged out');
        return;
    }

    const tagOut = await TagOutDB.create({ machineId, userId, reason: body.reason }).then((tagOut) => tagOut.toJSON() as TagOut);
    await MachineDB.update({ latestTagOutId: tagOut.id }, { where: { id: machineId } });

    res.json(tagOut).status(201);
};

type TagOutRemoveBody = {
    reason: string;
}
export const removeTagOut: RequestHandler = async (req, res) => {
    const tagOutId = req.params.tagOutId;
    if (!tagOutId) {
        res.status(400).send('Tag out ID is required');
        return;
    }
    const userId = req.headers.userid as string;
    const userType = req.headers.usertype as string;
    if (userType === 'user') {
        res.status(403).send('Only admins/technicians can remove tag outs');
        return;
    }
    const body = req.body as TagOutRemoveBody;
    if (!body.reason) {
        res.status(400).send('Reason is required');
        return;
    }
    const tagOut = await TagOutDB.findByPk(tagOutId).then((tagOut) => tagOut?.toJSON() as TagOut);
    if (!tagOut) {
        res.status(404).send('Tag out not found');
        return;
    }
    if (tagOut.removedDate) {
        res.status(400).send('Tag out already removed');
        return;
    }
    await TagOutDB.update({ removedDate: new Date(), removedBy: userId, removedReason: body.reason }, { where: { id: tagOutId } });
    await MachineDB.update({ latestTagOutId: null }, { where: { latestTagOutId: tagOutId } });
    res.status(204).send();
};

