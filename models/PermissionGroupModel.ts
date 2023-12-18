import { DataTypes, ModelAttributes } from 'sequelize';

export const permissionGroupModel:ModelAttributes = {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    type:{
        type: DataTypes.STRING, //'GROUP' ||'MACHINE'
        allowNull:false,
    },
    sk:{
        type: DataTypes.STRING,
        allowNull:true,
    },
    data:{
        type:DataTypes.STRING,
        allowNull:false,
    },
};

export interface PermissionGroupEntry {
    id: string;
    type: 'GROUP'|'MACHINE';
    sk: string|null;
    data:string; // groupName || machineId
}
export interface PermissionGroup extends PermissionGroupEntry{
    type:'GROUP';
    sk:null;

}
export interface PermissionGroupMachine extends PermissionGroupEntry {
    type:'MACHINE';
    sk:string;
}