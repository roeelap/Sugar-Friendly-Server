"use strict";

const express = require('express');
const bodyParser = require('body-parser');
// const NodeGeocoder = require('node-geocoder');
const { getDistanceFromLatLonInKm } = require('./utility');
const { MongoDatabase } = require('./mongo');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// // setup geocoder
// const options = {
//     provider: 'google',
//     apiKey: 'AIzaSyA4VcSGbk-S5eAlv5fKl1lk6ZAx1OFAmFw'
// }
// const geocoder = NodeGeocoder(options);


// setup mongodb
const mongoDatabase = new MongoDatabase();


app.get('/add-dish', async (req, res) => {
    console.log("Adding a dish");
    let dishName = req.body.dishName || null;
    let restaurantName = req.body.restaurantName || null;
    let foodTags = req.body.foodTags || null;
    let nutritionTags = req.body.nutritionTags || null;
    let address = req.body.address || null;

    if (dishName == null || restaurantName == null || address == null) {
        return res.send("Please provide a dish name, restaurant name and address");
    }

    const dish = {
        name: dishName,
        restaurant: restaurantName,
        foodTags: foodTags,
        nutritionTags: nutritionTags,
        likes: 0,
        rating: 3.0,
        sugarRating: 3.0,
        uploadDate: new Date(),
        address: address
    };

    mongoDatabase.addDish(dish)
});


app.get('/isup', async (req, res) => {
    console.log("Server pinged")

    // check if connected to mongodb
    let client = mongoDatabase.client;
    if (!!client && !!client.topology && client.topology.isConnected()) {
        console.log("Connected to mongodb, allowing connection");
        res.send({ result: true });
    } else {
        // if not connected, wait until connected
        console.log("Still Not connected to mongodb, waiting for connection");
        mongoDatabase.init((error) => {
            if (error) {
                console.log("Failed to connect to mongodb, not allowing connection")
                console.error(error);
                res.send({ result: false });
            } else {
                console.log("Connected to mongodb, allowing connection");
                res.send({ result: true });
            }
        });
    }
})


app.get('/dishes', async (req, res) => {
    console.log("Getting dishes");

    const userLat = req.query.lat || null;
    const userLng = req.query.lng || null;

    if (userLat == null || userLng == null) {
        res.send("Please provide user latitude and longitude");
        return;
    }

    try {
        const results = await Promise.all([
            mongoDatabase.getAllDishes(),
            mongoDatabase.getTopRatedDishes(), 
            mongoDatabase.getNewestDishes()
        ]);

        // TODO: figure out google cloud billing!!!

        // const resultsWithDistances = await Promise.all([
        //     calculateDistances(results[0], userLat, userLng),
        //     calculateDistances(results[1], userLat, userLng),
        //     calculateDistances(results[2], userLat, userLng)
        // ]);

        // temporary fix:
        for (result of results) {
            for (dish of result) {
                dish.distanceToUser = 0;
            }
        }

        return res.send({ recommendedDishes: results[0], topRatedDishes: results[1], newestDishes: results[2] });

    } catch (error) {
        console.error(error);
    }
});


async function calculateDistances(dishes, userLat, userLng) {
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


app.get('/search', async (req, res) => {
    const query = req.query.query || null;
    const userLat = req.query.lat || null;
    const userLng = req.query.lng || null;

    if (userLat == null || userLng == null) {
        res.send("Please provide user latitude and longitude");
        return;
    }

    console.log("Searching for " + query);
    try {
        const results = await mongoDatabase.searchDishes(query);
        const resultsWithDistances = await calculateDistances(results, userLat, userLng);
        return res.send({ results: resultsWithDistances });
    } catch (error) {
        console.error(error);
    }
});


app.post('/upload', (req, res) => {
    // get the image
    const image = req.body.image || null;
    
    if (image == null) {
        res.send({result: false, message: "Please provide an image"});
        return;
    } 

    console.log(image)
    res.send({result: true, message: "Image uploaded successfully"});
});


mongoDatabase.init((err) => {
    if (err != null) {
        console.error(err);
        return;
    }

    app.listen(PORT, () => {
        console.log(`Server listening for requests!`);
    });
})