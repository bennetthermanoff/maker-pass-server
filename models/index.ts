import { Sequelize } from 'sequelize';
import { userModel } from './UserModel';
import { machineModel } from './MachineModel';
import { logModel } from './LogModel';
import { machineGroupModel } from './MachineGroupModel';
import { permissionGroupModel } from './PermissionGroupModel';
import { tagOutModel } from './TagOutModel';
import { userPermissionModel } from './UserPermissionModel';

export const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db.sqlite',
    logging: true,
});

export const UserDB = sequelize.define('user', userModel);
export const MachineDB = sequelize.define('machine', machineModel);
export const LogDB = sequelize.define('log', logModel);
export const MachineGroupDB = sequelize.define('machineGroup', machineGroupModel);
export const PermissionGroupDB = sequelize.define('permissionGroup', permissionGroupModel);
export const TagOutDB = sequelize.define('tagOut', tagOutModel);
export const UserPermissionDB = sequelize.define('userPermission', userPermissionModel);

