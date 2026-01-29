const mongoose = require('mongoose');
require('dotenv').config();

const uri = process.env.URI;
const clientOptions = { dbName: "CRM_info", serverApi: { version: '1', strict: true, deprecationErrors: true } };

module.exports = async function(){
    try {
        await mongoose.connect(uri, clientOptions);
        await mongoose.connection.db.admin().command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } catch (error) {
        console.log(`An error has ocurred: ${error}`)
    }
}