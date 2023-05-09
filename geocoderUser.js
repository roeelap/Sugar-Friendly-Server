"use strict";

const NodeGeocoder = require('node-geocoder');
const { getDistanceFromLatLonInKm } = require('./utility');

// TODO: figure out google cloud billing!!!
class GeocoderUser {
    constructor() {
        // this.apiKey = 'AIzaSyA4VcSGbk-S5eAlv5fKl1lk6ZAx1OFAmFw';
        // this.geocoder = NodeGeocoder({
        //     provider: 'google',
        //     apiKey: this.apiKey
        // });
    }

    async calculateDistances(dishes, userLat, userLng) {
        for (let dish of dishes) {
            // // get restaurant lat and long using geocoder
            // const geocoderRes = await this.geocoder.geocode(dish.address);
            // const lat = geocoderRes[0].latitude;
            // const long = geocoderRes[0].longitude;
    
            // // calculate distance to user and add to dish object
            // let distanceToUser = getDistanceFromLatLonInKm(userLat, userLng, lat, long);
            // dish.distanceToUser = distanceToUser;


            dish.distanceToUser = 0; // <--- temporary fix
        }
    
        return dishes
    }

}


module.exports = { GeocoderUser };