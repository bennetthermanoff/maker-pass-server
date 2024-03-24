import {  MachineGroupGeoFenceJSON } from '../models/MachineGroupModel';

export type Location = {
    lat: number,
    lng: number,
};
export type GeoFence = {
    lat: number,
    lng: number,
    radius: number,
};
export const isLocationInAnyGeoFence = (location:Location|undefined, machineGroupGeoFences:Array<MachineGroupGeoFenceJSON>) => {
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
    return distance <= geoFenceCoordinate.radius;
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

const toRadians = (degrees:number) => degrees * Math.PI / 180;