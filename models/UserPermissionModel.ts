import { DataTypes, ModelAttributes } from 'sequelize';

export const userPermissionModel:ModelAttributes = {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    userId: {
        type: DataTypes.STRING,
        allowNull: false,
        references: {
            model: 'user',
            key: 'id',
        },
    },
    type: {
        type: DataTypes.STRING, // 'PERMISSIONGROUP'|'MACHINE'
        allowNull: false,
    },
    sk: {
        type: DataTypes.STRING, // 'permissionGroupId'|'machineId'
        allowNull: false,
    },
    permission: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
    },
};

export interface UserPermissionEntry {
    id: string;
    userId: string;
    type: 'PERMISSIONGROUP'|'MACHINE';
    sk: string;
    permission: boolean;
}
export interface UserPermissionGroup extends UserPermissionEntry{
    type: 'PERMISSIONGROUP';
}
export interface UserPermissionMachine extends UserPermissionEntry{
    type: 'MACHINE';
}

