"use strict";

const FormData = require('form-data');
const https = require('https');
const fs = require('fs');

class LogMealUser {
    constructor() {
        this.userToken = '976f1efbe142ed81fb129cf9a680f17b32f81df9';
        this.form = new FormData();
        this.headers = this.form.getHeaders();
        this.headers['Authorization'] = 'Bearer' +  this.userToken;
        this.options = {
            hostname: 'api.logmeal.es',
            path: '/v2/image/segmentation/complete',
            method: 'POST',
            headers: headers
        }
        
    }

    async getNutritionalInfoFromImage(image, callback) {
        if (!image) {
            this.form.append('image', fs.createReadStream('fish-chips.jpg'));
        } else {
            this.form.append('image', fs.createReadStream(image));
        }

        const req = https.request(this.options, (res) => {
            res.on('data', (d) => {
                callback(d);
            });
        });

        this.form.pipe(req);
    }
}


module.exports = { LogMealUser };