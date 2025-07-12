import { MachineGroupDB } from '../models';
import { GroupGeoFence, GroupGeoFenceJSON, MachineGroup, MachineGroupMachine, ShopLocation } from '../models/MachineGroupModel';

export type Location = {
    lat: number,
    lng: number,
};
export type GeoFence = {
    lat: number,
    lng: number,
    radius: number,
};
export const isLocationInAnyGeoFence = (location:Location|undefined, machineGroupGeoFences:Array<GroupGeoFenceJSON>) => {
    if (machineGroupGeoFences.length == 0){
        return true;
    }
    if (!location){
        return false;
    }
    for (let i = 0; i < machineGroupGeoFences.length; i++) {
        if (isLocationInGeoFence(location,machineGroupGeoFences[i].data)){
            return true;
        }
    }
    return false;
};
export const isLocationInGeoFence = (location:Location|undefined, geoFenceCoordinate:GeoFence) => {
    if (!location){
        return false;
    }
    const distance = getDistanceBetweenPoints(location, geoFenceCoordinate);
    return distance <= geoFenceCoordinate.radius * 1000;
};
// https://www.movable-type.co.uk/scripts/latlong.html
const getDistanceBetweenPoints = (location1:Location, location2:Location) => {
    const R = 6371e3; // metres
    const φ1 = toRadians(location1.lat);
    const φ2 = toRadians(location2.lat);
    const Δφ = toRadians(location2.lat - location1.lat);
    const Δλ = toRadians(location2.lng - location1.lng);
    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
        + Math.cos(φ1) * Math.cos(φ2)
        * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};
export const isMachineRequiresLocation = async (machineId: string): Promise<[boolean, GroupGeoFenceJSON[]]> => {
    const machineGroupMachine = await MachineGroupDB.findOne({ where: { data: machineId, type: 'MACHINE' } }).then((machineGroup) => machineGroup?.toJSON()) as MachineGroupMachine;
    if (machineGroupMachine){
        const machineGroup = await MachineGroupDB.findOne({ where: { id: machineGroupMachine.sk, type: 'GROUP' } }).then((machineGroup) => machineGroup?.toJSON()) as MachineGroup;
        if (!machineGroup){
            return [false,[]];
        }
        const location = await MachineGroupDB.findOne({ where: { id: machineGroup.sk, type: 'LOCATION' } }).then((machineGroup) => machineGroup?.toJSON()) as ShopLocation;
        const geoFences = await MachineGroupDB.findAll({ where: { sk: [location?.id, machineGroup.id], type: 'GEOFENCE' } })
            .then((machineGroups) => machineGroups.map((geoFence) => {
                const geoFenceObj = geoFence.toJSON() as GroupGeoFence;
                return {
                    ...geoFenceObj,
                    data:JSON.parse(geoFenceObj.data as string) as GeoFence,
                };
            })) as GroupGeoFenceJSON[];
        if (geoFences.length == 0){
            return [false,[]];
        }
        else {
            return [true, geoFences];
        }
    }
    return [false,[]];
};

const toRadians = (degrees:number) => degrees * Math.PI / 180;
