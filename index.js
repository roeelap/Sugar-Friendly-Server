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
        rating: 3.0
    };

    const dishesCollection = await getDishesCollection();
    dishesCollection.insertOne(dish)
        .then(result => { res.send(result); })
        .catch(error => console.error(error));
});

app.get('/get-all-dishes', async (req, res) => {
    console.log("Getting all dishes");
    const dishesCollection = await getDishesCollection();
    dishesCollection.find().toArray()
        .then(results => { res.send({dishes: results}); })
        .catch(error => console.error(error));
});
