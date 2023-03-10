"use strict";

const express = require('express');
const bodyParser = require('body-parser');
const MongoClient = require('mongodb').MongoClient;

const app = express();
app.use(bodyParser.json());
const PORT = 8080;

// connect to the mongoDB database
const MONGO_URL = 'mongodb+srv://rlapushin:0XMuH1LFBnOMjU7B@milab-app.pzlrmiq.mongodb.net/?retryWrites=true&w=majority';
const client = new MongoClient(MONGO_URL, {
    useUnifiedTopology: true, useNewUrlParser: true
});
client.connect()
    .then(() => { app.listen(PORT, () => console.log(`Server listening on port ${PORT}!`)); })
    .catch((err) => console.log(err));


const getDishesCollection = async () => {
    return client.db('Milab-App').collection('Dishes');
}

const getRestaurantsCollection = async () => {
    return client.db('Milab-App').collection('Restaurants');
}


app.get('/add-dish', async (req, res) => {
    console.log("Adding a dish");
    let dishName = req.body.dishName || null;
    let restaurantName = req.body.restaurantName || null;
    let foodTags = req.body.foodTags || null;
    let nutritionTags = req.body.nutritionTags || null;

    if (dishName == null || restaurantName == null) {
        res.send("Please provide a dish name and restaurant name");
        return;
    }

    const dish = {
        name: dishName,
        restaurant: restaurantName,
        foodTags: foodTags,
        nutritionTags: nutritionTags,
        likes: 0,
        rating: 3.0,
        uploadDate: new Date()
    };

    const dishesCollection = await getDishesCollection();
    dishesCollection.insertOne(dish)
        .then(result => { res.send(result); })
        .catch(error => console.error(error));
});

app.get('/dishes', async (req, res) => {
    console.log("Getting dishes");
    try {
        const results = await Promise.all([
            getAllDishes(),
            getTopRatedDishes(),
            getDishesByUploadDate(),
            
        ]);
        return res.send({ recommendedDishes: results[0], topRatedDishes: results[1], 
            newestDishes: results[2] });
    } catch (error) {
        console.error(error);
    }
});

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

async function getDishesByUploadDate() {
    console.log("Getting dishes by upload date");
    const dishesCollection = await getDishesCollection();
    return dishesCollection.find().sort({ uploadDate: -1 }).toArray();
}

app.get('/restaurants', async (req, res) => {
    console.log("Getting restaurants");
    try {
        const result = await getAllRestaurants();            
        return res.send({ restaurants: result });
    } catch (error) {
        console.error(error);
    }
});

async function getAllRestaurants() {
    console.log("Getting all restaurants");
    const restaurantsCollection = await getRestaurantsCollection();
    return restaurantsCollection.find().toArray();
}
