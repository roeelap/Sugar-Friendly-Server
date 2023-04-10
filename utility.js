"use strict";

const NodeGeocoder = require('node-geocoder');

// setup geocoder
const options = {
    provider: 'google',
    apiKey: 'AIzaSyA4VcSGbk-S5eAlv5fKl1lk6ZAx1OFAmFw'
}
const geocoder = NodeGeocoder(options);

export async function calculateDistances(dishes, userLat, userLng) {
    for (let dish of dishes) {
        // get restaurant lat and long using geocoder
        const geocoderRes = await geocoder.geocode(dish.address);
        const lat = geocoderRes[0].latitude;
        const long = geocoderRes[0].longitude;

        // calculate distance to user and add to dish object
        let distanceToUser = getDistanceFromLatLonInKm(userLat, userLng, lat, long);
        dish.distanceToUser = distanceToUser;
    }

    return dishes
}

export function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return Math.round(d * 100) / 100; // 2 decimal places
}

export function deg2rad(deg) {
    return deg * (Math.PI / 180)
}