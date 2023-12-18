import { DataTypes, ModelAttributes } from 'sequelize';
import { GeoFence } from '../util/locationCheck';

export const machineGroupModel:ModelAttributes = {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    type: {
        type: DataTypes.STRING, //'GROUP'|'MACHINE'|'GEOFENCE'
        allowNull: false,
    },
    sk: {
        type: DataTypes.STRING, // (ENTRY || GEOFENCE) ? groupId
        allowNull: true,
    },
    data: {
        type: DataTypes.STRING, //GROUP:name, MACHINE:machineId, GEOFENCE:geoFenceCoordinate
        allowNull:false,
    },

};

export interface MachineGroupEntry {
    id: string;
    type:'GROUP'|'MACHINE'|'GEOFENCE';
    sk?:string;
    data:string|GeoFence;
}
export interface MachineGroup extends MachineGroupEntry{
    type:'GROUP',
    sk:undefined,
    data:string
}
export interface MachineGroupMachine extends MachineGroupEntry{
    type:'MACHINE',
    sk:string,
    data:string
}
export interface MachineGroupGeoFence extends MachineGroupEntry{
    type:'GEOFENCE',
    sk:string,
    data:GeoFence
}

