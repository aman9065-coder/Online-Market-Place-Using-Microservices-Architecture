require('dotenv').config();
const app = require('./src/app');
const connectedToDb = require('./src/db/db');
const {connect} = require('./src/broker/broker');



connectedToDb();
connect();


app.listen('5001',()=>{
    console.log('product service is running on port 5001');
});