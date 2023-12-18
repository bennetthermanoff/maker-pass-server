import { DataTypes, ModelAttributes } from 'sequelize';

export const accessGroupModel:ModelAttributes = {
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

export interface AccessGroupEntry {
    id: string;
    type: 'GROUP'|'MACHINE';
    sk?: string;
    data:string; // groupName || machineId
}
export interface AccessGroup extends AccessGroupEntry{
    type:'GROUP',
    sk:undefined,

}
export interface AccessGroupMachine {
    type:'MACHINE',
    sk:string
}