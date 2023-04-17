"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;
const NodeGeocoder = require('node-geocoder');
const { getDistanceFromLatLonInKm } = require('./utility');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;

// setup geocoder
const options = {
    provider: 'google',
    apiKey: 'AIzaSyA4VcSGbk-S5eAlv5fKl1lk6ZAx1OFAmFw'
}
const geocoder = NodeGeocoder(options);


// connect to the mongoDB database
// const MONGO_URI = 'mongodb+srv://rlapushin:0XMuH1LFBnOMjU7B@milab-app.pzlrmiq.mongodb.net/?retryWrites=true&w=majority';
const MONGO_URI = process.env.MONGO_URI;
const client = new MongoClient(MONGO_URI, {
    useUnifiedTopology: true, useNewUrlParser: true
});


app.get('/add-dish', async (req, res) => {
    console.log("Adding a dish");
    let dishName = req.body.dishName || null;
    let restaurantName = req.body.restaurantName || null;
    let foodTags = req.body.foodTags || null;
    let nutritionTags = req.body.nutritionTags || null;
    let address = req.body.address || null;

    if (dishName == null || restaurantName == null || address == null) {
        res.send("Please provide a dish name, restaurant name and address");
        return;
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

    const dishesCollection = await getDishesCollection();
    dishesCollection.insertOne(dish)
        .then(result => { res.send(result); })
        .catch(error => console.error(error));
});

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
            getAllDishes(),
            getTopRatedDishes(), 
            getNewestDishes()
        ]);

        const resultsWithDistances = await Promise.all([
            calculateDistances(results[0], userLat, userLng),
            calculateDistances(results[1], userLat, userLng),
            calculateDistances(results[2], userLat, userLng)
        ]);

        return res.send({ recommendedDishes: resultsWithDistances[0], topRatedDishes: resultsWithDistances[1], newestDishes: resultsWithDistances[2] });

    } catch (error) {
        console.error(error);
    }
});


async function getDishesCollection() {
    return client.db('Milab-App').collection('Dishes');
}

async function getAllDishes() {
    console.log("Getting all dishes");
    const dishesCollection = await getDishesCollection();
    return dishesCollection.find().toArray();
}

async function getTopRatedDishes() {
    console.log("Getting top rated dishes");
    const dishesCollection = await getDishesCollection();
    return dishesCollection.find().sort({ rating: -1 }).toArray();
}

async function getNewestDishes() {
    console.log("Getting newest dishes");
    const dishesCollection = await getDishesCollection();
    return dishesCollection.find().sort({ uploadDate: -1 }).toArray();
}

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
        const results = await searchDishes(query);
        const resultsWithDistances = await calculateDistances(results, userLat, userLng);
        return res.send({ results: resultsWithDistances });
    } catch (error) {
        console.error(error);
    }
});

async function searchDishes(query) {
    const regex = '.*' + query + '.*';
    const dishesCollection = await getDishesCollection();
    const results = await dishesCollection.find(
        { $or: [
            { name: { $regex: regex, $options: 'i' } },
            { restaurant: { $regex: regex, $options: 'i' } },
            { foodTags: { $regex: regex, $options: 'i' } },
            { nutritionTags: { $regex: regex, $options: 'i' } }
        ]}
    ).toArray();
    console.log(results);
    return results;
}


client.connect()
.then(() => { 
    app.listen(PORT, () => {
        console.log(`Server listening for requests!`);
    })
})
.catch((err) => console.log(err));