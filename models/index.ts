import { Sequelize } from 'sequelize';
import { userModel } from './UserModel';
import { machineModel } from './MachineModel';
import { logModel } from './LogModel';
import { machineGroupModel } from './MachineGroupModel';
import { accessGroupModel } from './AccessGroupModel';
import { tagOutModel } from './TagOutModel';

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite',
    logging: false,
});

export const UserDB = sequelize.define('user', userModel);
export const MachineDB = sequelize.define('machine', machineModel);
export const LogDB = sequelize.define('log', logModel);
export const MachineGroupDB = sequelize.define('machineGroup', machineGroupModel);
export const AccessGroupDB = sequelize.define('accessGroup', accessGroupModel);
export const TagOutDB = sequelize.define('tagOut', tagOutModel);

