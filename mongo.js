"use strict";

const MongoClient = require('mongodb').MongoClient;

class MongoDatabase {
    constructor() {
        const MONGO_URI = process.env.MONGO_URI;
        this.client = new MongoClient(MONGO_URI, {
            useUnifiedTopology: true, useNewUrlParser: true
        });
    }

    async init(callback) {
        this.client.connect().then(() => {
            console.log("Connected to mongodb");
            callback(null);
        }).catch((error) => {
            console.error(error);
            console.log("Failed to connect to mongodb, not allowing connection")
            callback(error);
        });
    }


    async getDishesCollection() {
        return this.client.db('Milab-App').collection('Dishes');
    }

    async getAllDishes() {
        console.log("Getting all dishes");
        const dishesCollection = await this.getDishesCollection();
        return dishesCollection.find().toArray();
    }

    async getTopRatedDishes() {
        console.log("Getting top rated dishes");
        const dishesCollection = await this.getDishesCollection();
        return dishesCollection.find().sort({ rating: -1 }).toArray();
    }

    async getNewestDishes() {
        console.log("Getting newest dishes");
        const dishesCollection = await this.getDishesCollection();
        return dishesCollection.find().sort({ uploadDate: -1 }).toArray();
    }

    async searchDishes(query) {
        const regex = '.*' + query + '.*';
        const dishesCollection = await this.getDishesCollection();
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

    async addDish(dish) {
        const dishesCollection = await this.getDishesCollection();
        dishesCollection.insertOne(dish)
        .then(result => { res.send(result); })
        .catch(error => console.error(error));
    }

}

module.exports = { MongoDatabase };