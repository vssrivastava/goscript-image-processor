const fetch = require('node-fetch');
const csv = require("fast-csv");
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser')
const express = require('express');

const app = express();
const port = process.env.PORT || 5000;

app.use(bodyParser.json());

app.listen(port, () => console.log(`Listening on port ${port}`));

const CLIENT_ID = 'qkq50pgywOnMeuxGeyIBqUelF588BBp2';
const CLIENT_SECRET = '_4FhZIQuEGZqBkPgZPD4pZDNlLPuOxHRhjvuwKtK1Q-sb-cToKdZimXZu0yXVFYk';
let ACCESS_TOKEN = '';
/**
 * API to parse CSV and return images
 */
app.get('/parse-csv', (req, res) => {
    const allImages = [];
    const stream = fs.createReadStream(path.resolve(__dirname, '../src/data/snapshots.csv'));

    csv
    .fromStream(stream)
    .on("data", function(data){
        allImages.push({
            url: data[0]
        });
    })
    .on("end", function(){
        res.send({ images: allImages });
    });
});

app.get('/fetch-token', (req, res) => {
    fetch('https://api.imageintelligence.com/v2/oauth/token', {
        method: 'POST',
        body: JSON.stringify({
            "clientId": CLIENT_ID,
            "clientSecret": CLIENT_SECRET
        })
    }).then(resp => resp.json())
    .then(resp => {
        ACCESS_TOKEN = resp.accessToken;
        res.send({
            accessToken: resp.accessToken,
            expiresAt: resp.expiresAt
        });
    });
});

app.post('/process-batch', (req, res) => {
    fetch('https://api.imageintelligence.com/v2/detect/', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(req.body)
    }).then(resp => resp.json())
    .then(resp => {
        res.send({
            ...resp
        });
    });
});

app.get('/batch-status/:id', (req, res) => {
    fetch(`https://api.imageintelligence.com/v2/detect/${req.params['id']}`, {
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        }
    }).then(resp => resp.json())
    .then(resp => {
        res.send({
            ...resp
        });
    });
});
