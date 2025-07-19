import { DataTypes, ModelAttributes } from 'sequelize';
import { GeoFence } from '../util/locationCheck';
// Machine group table stores the following types of objects:
// GROUP:    Holds the name and ID of a group
// MACHINE:  a machine that is assigned to a group by sk
// LOCATION: a group of groups, think Tulane MakerSpace and Tulane Architecture,
//           each with their own groups of wood shop, metal shop, etc.
// GEOFENCE: a geofence that is assigned to a group or location by sk

export const machineGroupModel:ModelAttributes = {
    id: {
        type: DataTypes.STRING,
        primaryKey: true,
        defaultValue: DataTypes.UUIDV4,
    },
    type: {
        type: DataTypes.STRING, //'GROUP'|'MACHINE'|'GEOFENCE'|'LOCATION';
        allowNull: false,
    },
    sk: {
        type: DataTypes.STRING, // (MACHINE || GEOFENCE) ? groupId
        allowNull: true,        // (GROUP) ? locationId
    },                          // (LOCATION) ? null
    data: {
        type: DataTypes.STRING, //GROUP:name, LOCATION:name, MACHINE:machineId, GEOFENCE:geoFenceCoordinate
        allowNull:false,
    },

};

export interface MachineGroupEntry {
    id: string;
    type:'GROUP'|'MACHINE'|'GEOFENCE'|'LOCATION';
    sk:string|null;
    data:string|GeoFence;
}
export interface ShopLocation extends MachineGroupEntry{
    type:'LOCATION',
    sk:null,
    data:string //name
}
export interface MachineGroup extends MachineGroupEntry{
    type:'GROUP',
    sk:string|null, //locationId
    data:string //name
}
export interface MachineGroupMachine extends MachineGroupEntry{
    type:'MACHINE',
    sk:string, //groupId
    data:string //machineId
}
export interface GroupGeoFence extends MachineGroupEntry{
    type:'GEOFENCE',
    sk:string, //groupId | locationId
    data:string|GeoFence //geoFenceCoordinate
}
export interface GroupGeoFenceJSON extends GroupGeoFence{
    data:GeoFence
}

