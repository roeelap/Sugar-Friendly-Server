"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const { MongoDatabase } = require('./mongo');
const { LogMealUser } = require('./logmealUser');
const { GeocoderUser } = require('./geocoderUser');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;


// TODO: figure out google cloud billing!!!
const geocoderUser = new GeocoderUser();


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

app.get('/login', async (req, res) => {
    console.log("Logging in");

    const userName = req.query.userName || null;

    if (userName == null) {
        res.send("Please provide a user name");
        return;
    }

    try {
        const user = await mongoDatabase.getUser(userName);
        return res.send({ user: user });
    } catch (error) {
        console.error(error);
        return res.send({ error: error });
    }
});


app.get('/home', async (req, res) => {
    console.log("Getting dishes");

    const userLat = req.query.lat || null;
    const userLng = req.query.lng || null;

    try {

        const results = await Promise.all([
            mongoDatabase.getAllDishes(),
            mongoDatabase.getTopRatedDishes(), 
            mongoDatabase.getNewestDishes()
        ]);

        // TODO: figure out google cloud billing!!!
        const resultsWithDistances = await Promise.all([
            geocoderUser.calculateDistances(results[0], userLat, userLng),
            geocoderUser.calculateDistances(results[1], userLat, userLng),
            geocoderUser.calculateDistances(results[2], userLat, userLng)
        ]);

        return res.send({ 
            recommendedDishes: resultsWithDistances[0], 
            topRatedDishes: resultsWithDistances[1], 
            newestDishes: resultsWithDistances[2],
        });

    } catch (error) {
        console.error(error);
        return res.send({ error: error });
    }
});


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
        const resultsWithDistances = await geocoderUser.calculateDistances(results, userLat, userLng);
        return res.send({ results: resultsWithDistances });
    } catch (error) {
        console.error(error);
    }
});


app.post('/updateUser', async (req, res) => {
    console.log("Updating user");
    const userName = req.body.userName || null;
    const favoriteDishes = req.body.favoriteDishes || null;

    if (userName == null) {
        res.send("Please provide a userName");
        return;
    }

    console.log("Updating user " + userName + " with favorite dishes " + favoriteDishes);

    try {
        const result = await mongoDatabase.updateUserFavoriteDishes(userName, favoriteDishes);
        const user = await mongoDatabase.getUser(userName);
        return res.send({ result: result.modifiedCount > 0 });
    } catch (error) {
        console.error(error);
        return res.send({ error: error });
    }
});


app.post('/upload', async (req, res) => {
    // get the image
    const image = req.body.image || null;
    
    if (image == null) {
        res.send({result: false, message: "Please provide an image"});
        return;
    }

    console.log(image)

    let logMealUser = new LogMealUser();
    logMealUser.getNutritionalInfoFromImage(image, (data) => {
        console.log(data);
        res.send({result: true, data: data});
    });
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