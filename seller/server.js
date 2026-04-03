require('dotenv').config();
const  listeners = require('./src/broker/listeners');
const app = require('./src/app');
const {connect} = require('./src/broker/broker');
const connectToDB = require('./src/db/db');

connectToDB();
connect().then(()=>{
    listeners();
})




app.listen('5007',()=>{
    console.log('seller service is running on port 5007');
});