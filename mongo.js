"use strict";

const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;

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

    async getUser(userName) {
        const usersCollection = await this.getUsersCollection();
        let user = await usersCollection.findOne({ userName: userName });

        console.log("Getting user");
        console.log(user);

        return {
            name: user.name,
            userName: user.userName,
            // map objectIds to strings
            favoriteDishes: this.ObjectIdToString(user.favoriteDishes),
        }
    }

    async likeDish(userName, dishId) {
        const usersCollection = await this.getUsersCollection();
        
        // add dish to user's favorite dishes
        usersCollection.updateOne(
            { userName: userName },
            { $addToSet: { favoriteDishes: ObjectId(dishId) } }
        ).then(result => { 
            if (result.modifiedCount == 0) {
                return false;
            }
            return true;
         })
    }

    async getUsersCollection() {
        return this.client.db('Milab-App').collection('Users');
    }

    async getDishesCollection() {
        return this.client.db('Milab-App').collection('Dishes');
    }

    async getAllDishes() {
        console.log("Getting all dishes");
        const dishesCollection = await this.getDishesCollection();
        const dishes = dishesCollection.find().toArray();
        return this.ObjectIdToString(dishes);
    }

    async getTopRatedDishes() {
        console.log("Getting top rated dishes");
        const dishesCollection = await this.getDishesCollection();
        const dishes = dishesCollection.find().sort({ rating: -1 }).toArray();
        return this.ObjectIdToString(dishes);
    }

    async getNewestDishes() {
        console.log("Getting newest dishes");
        const dishesCollection = await this.getDishesCollection();
        const dishes = dishesCollection.find().sort({ uploadDate: -1 }).toArray();
        return this.ObjectIdToString(dishes);
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
        return this.ObjectIdToString(results);
    }

    async addDish(dish) {
        const dishesCollection = await this.getDishesCollection();
        dishesCollection.insertOne(dish)
        .then(result => { res.send(result); })
        .catch(error => console.error(error));
    }

    ObjectIdToString(dishes) {
        for (let dish of dishes) {
            dish._id = dish._id.toString();
        }
        return dishes;
    }

}

module.exports = { MongoDatabase };