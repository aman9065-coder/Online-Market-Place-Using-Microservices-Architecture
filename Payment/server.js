require('dotenv').config();
const app = require('./src/app');
const connectToDB = require('./src/db/db');
const {connect} = require('./src/broker/broker');

connectToDB();
connect();




app.listen('5004',()=>{
    console.log('payment service is listening on port 5004');
});