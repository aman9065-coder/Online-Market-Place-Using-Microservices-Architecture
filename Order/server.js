require('dotenv').config();
const app = require('./src/app');
const connectedToDB = require('./src/db/db');
const {connect} = require('./src/broker/broker');


connectedToDB();
connect();


app.listen('5003',()=>{
    console.log("order service is listening on port 5003");
});