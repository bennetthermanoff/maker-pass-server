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
    },
    type: {
        type: DataTypes.STRING, // 'GROUP'|'MACHINE'
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
    type: 'GROUP'|'MACHINE';
    sk: string;
    permission: boolean;
}
export interface UserPermissionGroup extends UserPermissionEntry{
    type: 'GROUP';
}
export interface UserPermissionMachine extends UserPermissionEntry{
    type: 'MACHINE';
}

